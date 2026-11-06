# Identity Lab (private pilot)

A lightweight identity-footprint auditor that checks live pages for Person JSON-LD, sameAs profile links, visible profile links, metadata, robots.txt, sitemap.xml and an About page. It does **not** apply edits, access third-party accounts, claim panels, determine whether Google has indexed a URL, or promise Knowledge Panel eligibility.

## Pilot inputs
- Name: Keenan Gray
- Website: https://www.thiskeenan.com
- IMDb: https://www.imdb.com/name/nm16096261/

## Safety
The serverless endpoint allows only `thiskeenan.com` and `www.thiskeenan.com`. No login or credentials are collected. Each scan fetches up to four public pages on that domain, with request timeouts. Reports are not retained on a database. External third-party profiles are NOT fetched, and missing reciprocal links are labelled unverified.

## Optional AI
Without an API key, the deterministic auditor works normally. To add an AI-written evidence summary, set `OPENAI_API_KEY` **and** `AUDIT_ACCESS_KEY` in Vercel's encrypted environment variables. Enter the audit access code in the UI. Calls are bounded to a short response, model `gpt-4.1-mini` by default, and cannot approve edits or send messages. API costs are separate from hosting.

## Future
Move the pilot to its own repository, add secure user authentication, credential-scoped integrations (GitHub/WordPress), a database for consented case records, rate limits, and an approval queue before accepting third-party customers.

## Run locally
Install the Vercel CLI and execute `vercel dev` from this directory. Review `api/audit.js` before expanding permitted hosts.

Based on Google's public structured-data documentation. This is not an official Google product.

## Deploying from the existing repository (one-time setup)

Vercel's connected Film Show team returned HTTP 403 when the pilot tried to create a new project. The existing live director site was not changed.

1. Open [Vercel New Project](https://vercel.com/new).
2. Import GitHub repository `thiskeenan-glitch/keenan-gray-site`.
3. Create a **separate** Vercel project named `identity-lab-pilot`. Do not modify the existing `keenan-gray-site` project.
4. Set the production Git branch to `identity-lab-pilot` and the project root directory to `identity-lab` before attempting the production deployment; the repository's default `main` branch does not contain the pilot files.
5. Use the Other framework preset or no framework. Leave build/install commands blank.
6. No environment variables are required for the standard evidence auditor.
7. Open the project deployment URL, submit the prefilled Keenan Gray case, and verify the findings.
8. Do not activate the optional AI step unless you intentionally set secure `OPENAI_API_KEY` and `AUDIT_ACCESS_KEY` variables and establish request limits.

## Automated checks

From the repository root, use `node --test identity-lab/test-audit.mjs` with Node 22+. The test file includes mock pages, invalid-host rejection, invalid IMDb URL rejection, and a redirect outside the domain allowlist. A GitHub Actions workflow is present on the pilot branch, but its run status must be verified in GitHub.

## First public case

See [FIRST_AUDIT.md](FIRST_AUDIT.md) for verified and unverified findings from thiskeenan.com on 2026-11-05.

<!-- Deployment trigger: after linking Vercel project identity-lab-pilot to branch identity-lab-pilot on 2026-11-05. -->


## Customer accounts (disabled until dedicated database)

A private client workspace is implemented at `/account`. It stays disabled unless `IDLAB_SUPABASE_URL`, `IDLAB_SUPABASE_PUBLISHABLE_KEY`, and the explicit `IDLAB_ACCOUNTS_ENABLED=true` flag are configured on the **Identity Lab Vercel project**. Do **not** reuse Filmshow's Supabase database. Read [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md) and review `supabase/identity_lab_schema.sql` before activating. The old browser-only operator queue does not automatically sync with accounts. No external platform submissions are performed by this feature.

## Universal audit v0.2

- Primary input: **professional name**, with **one optional public identity link** (a website, LinkedIn, IMDb, or any other real HTTPS profile); neither IMDb nor a website is required.
- POST `/api/discover`: fixed-host public Wikidata query; exact-name candidates are explicitly **unverified**. A directly linked Wikidata external identifier can strengthen an association but not guarantee identity ownership.
- Optional wider search via the server-only `IDLAB_BRAVE_SEARCH_KEY` environment variable; it uses an approved search API and keeps web result snippets labeled as unverified candidates. The key is **not configured** by default.
- No public arbitrary website crawling in this first version; direct server-side fetching of untrusted domains is intentionally disabled pending DNS-rebinding/SSRF hardened infrastructure. The user-provided link is used as an identity anchor, not blindly fetched.
- The previous controlled website auditor `/api/audit` remains available separately for its original limited pilot. The main page now uses `/api/discover`.
- There is no automatic third-party correction, editing, article placement, Knowledge Panel promise, or real panel check. The correction engine remains separate and permission-gated.
- In-memory per-instance rate limiting is best effort only; implement durable rate limits and bot protection before external scale.


## Audit → correction review (v0.3)
- A public Wikidata official-website (P856) claim is inspected for an exact-name candidate. Missing P856 is a **possible gap**, not proof of an error.
- The customer must explicitly mark the Wikidata item as theirs and supply a website link before a mismatch review appears.
- The mismatch is a review suggestion, not a verified correction. Same-host websites do not trigger suggestions.
- The customer can add an **evidence-gated Wikidata task** to the browser-only correction queue. Its state remains **needs_evidence** until an independent citation is added and reviewed. No third-party submission or login takes place.
- This browser-local queue is not yet synchronized with the Supabase customer database.
