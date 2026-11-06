# Identity Lab secure accounts (isolated rollout)

This is a **disabled-by-default** account foundation. It does not use the existing Filmshow Supabase project.

## Current capability
- `/account` shows a clear unavailable state if a dedicated database is not configured.
- Supabase email magic-link authentication is invite-only: `shouldCreateUser: false`. A project owner must first invite/test an authenticated email in the Identity Lab Supabase Auth console.
- Signed-in customers can create cases, list **their own** cases, and add immutable `customer_note` events.
- A private operator membership table controls operator-level read/status permissions; membership **must** be assigned explicitly by the database administrator.
- Customers cannot claim submitted receipts, edit platform outcomes, update a status, access someone else's case, or delete history.
- No AI, crawler, profile submission, or payment flow is wired into accounts. The old /workspace/operations browser-local prototype is unchanged and does not synchronize with this system.

## Activate only after separate project creation
1. Create **a new Supabase project for Identity Lab** (not the Filmshow project). Review cost and pick the owning organization with the user.
2. Run `supabase/identity_lab_schema.sql` in that **new** project's SQL editor. This migration has not been applied.
3. Verify policies from a real user and a separate user: one cannot select or insert rows into another user's case. Verify anon access denied and ordinary users cannot add a `submission_recorded` event. Use Supabase security advisors.
4. Under Supabase Authentication → URL Configuration set Site URL to `https://identity-lab-pilot.vercel.app` and allow `https://identity-lab-pilot.vercel.app/account` in redirect URLs. Configure a production-grade SMTP provider before external beta customers; Supabase default email is not suitable for production-volume delivery.
5. Invite a test user from Supabase Auth. Email link defaults to allow only users that already exist.
6. Set on **Identity Lab Vercel project only**:
   - `IDLAB_SUPABASE_URL=https://<dedicated-project-ref>.supabase.co`
   - `IDLAB_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...`
   These two values are **public browser config**, not privileged secrets. Never set service-role or secret API keys in public JS or this endpoint.
7. Redeploy and test magic-link login, creating two separate accounts, row isolation, note persistence and sign-out across browsers. Monitor Vercel and Supabase logs.
8. Do not import old browser-local records automatically: customer identity mapping and consent must be verified before any migration.
9. Only after integration tests and legal/privacy review, begin a closed beta (maximum ten invited users).

## Operational boundaries
- Accounts are **not activated** without a separate project's URL and publishable key.
- This release is **not** a finished paid product or third-party editor.
- Browser imports pinned `@supabase/supabase-js@2.119.0` UMD from jsDelivr. Upgrade deliberately and pin exact versions; consider bundling the SDK for a production product.
- Website URLs entered by customers are stored as strings but never fetched by this feature. Later crawlers need dedicated SSRF safeguards.
- Operators are presently managed through restricted SQL membership, not a public self-serve onboarding screen.
- PostgreSQL schema uses RLS to authorize access. Never rely on hiding UI controls as an authorization mechanism.
