-- Identity Lab dedicated Supabase project only.
-- Never execute this on the Filmshow database. Apply after creating the isolated project.
-- Customer accounts use Auth (auth.users); operators are explicitly listed in a private schema.
-- RLS is mandatory for every table. No public anonymous grants or service keys in clients.

begin;
create schema if not exists idlab_private;
revoke all on schema idlab_private from public, anon;
grant usage on schema idlab_private to authenticated;

create table if not exists idlab_private.operators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  added_at timestamptz not null default now()
);
alter table idlab_private.operators enable row level security;
revoke all on idlab_private.operators from public, anon, authenticated;
grant select on idlab_private.operators to authenticated;
drop policy if exists "idlab_operator_can_read_self" on idlab_private.operators;
create policy "idlab_operator_can_read_self" on idlab_private.operators for select to authenticated
  using (user_id = (select auth.uid()));

create table if not exists public.idlab_cases (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  subject text not null check (char_length(trim(subject)) between 2 and 100),
  website_url text check (website_url is null or (char_length(website_url) between 12 and 2048 and website_url ~ '^https://')),
  summary text not null default '' check (char_length(summary) <= 1000),
  status text not null default 'intake' check (status in ('intake','in_review','customer_action','submitted','monitoring','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idlab_cases_owner_created_idx on public.idlab_cases(owner_id,created_at desc);
alter table public.idlab_cases enable row level security;
revoke all on public.idlab_cases from public, anon, authenticated;
grant select on public.idlab_cases to authenticated;
-- Customers may provide only intake fields; server owns IDs, ownership, status and timestamps.
grant insert (subject, website_url, summary) on public.idlab_cases to authenticated;
grant update (status,updated_at) on public.idlab_cases to authenticated;
drop policy if exists "idlab_cases_self_or_operator_read" on public.idlab_cases;
create policy "idlab_cases_self_or_operator_read" on public.idlab_cases for select to authenticated
  using (owner_id = (select auth.uid()) or exists(select 1 from idlab_private.operators m where m.user_id = (select auth.uid())));
drop policy if exists "idlab_cases_self_insert" on public.idlab_cases;
create policy "idlab_cases_self_insert" on public.idlab_cases for insert to authenticated
  with check (owner_id = (select auth.uid()) and status = 'intake');
drop policy if exists "idlab_cases_operator_status_update" on public.idlab_cases;
create policy "idlab_cases_operator_status_update" on public.idlab_cases for update to authenticated
  using (exists(select 1 from idlab_private.operators m where m.user_id = (select auth.uid())))
  with check (exists(select 1 from idlab_private.operators m where m.user_id = (select auth.uid())));

create table if not exists public.idlab_case_events (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.idlab_cases(id) on delete cascade,
  kind text not null default 'customer_note' check (kind in ('customer_note','operator_note','submission_recorded','public_observation','public_reversion')),
  note text not null check (char_length(trim(note)) between 3 and 3000),
  receipt text check (receipt is null or char_length(trim(receipt)) between 6 and 180),
  public_url text check (public_url is null or (char_length(public_url) between 12 and 2048 and public_url ~ '^https://')),
  created_at timestamptz not null default now(),
  constraint idlab_receipt_required check (kind <> 'submission_recorded' or receipt is not null),
  constraint idlab_observation_url_required check (kind not in ('public_observation','public_reversion') or public_url is not null)
);
create index if not exists idlab_case_events_case_time_idx on public.idlab_case_events(case_id,created_at desc);
alter table public.idlab_case_events enable row level security;
revoke all on public.idlab_case_events from public, anon, authenticated;
grant select on public.idlab_case_events to authenticated;
-- Customers may add only notes: no event kind, receipt, URL or timestamp spoofing.
grant insert (case_id, note) on public.idlab_case_events to authenticated;
drop policy if exists "idlab_events_self_or_operator_read" on public.idlab_case_events;
create policy "idlab_events_self_or_operator_read" on public.idlab_case_events for select to authenticated
  using (exists(select 1 from public.idlab_cases c where c.id=case_id and
    (c.owner_id=(select auth.uid()) or exists(select 1 from idlab_private.operators m where m.user_id=(select auth.uid())))));
drop policy if exists "idlab_events_customer_note_only" on public.idlab_case_events;
create policy "idlab_events_customer_note_only" on public.idlab_case_events for insert to authenticated
  with check (kind='customer_note' and receipt is null and public_url is null
    and exists(select 1 from public.idlab_cases c where c.id=case_id and c.owner_id=(select auth.uid())));

-- No deletion/update granted to customers, so recorded history cannot be silently rewritten.
-- Explicitly appoint an operator after their account exists:
-- INSERT INTO idlab_private.operators(user_id) VALUES ('<verified-user-uuid>');
commit;
