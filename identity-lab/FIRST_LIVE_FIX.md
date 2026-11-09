# Ulab first-party publication and integrity pilot

## Product milestone

An authorized account holder can draft an identity record, approve publication, have Ulab expose a read-only public HTTPS page, compare its visible data against the approved inputs, and monitor its database state for later drift. This is an Ulab-controlled record, not a correction on an external platform.

## Architecture

- /studio: owner interface, currently disabled until invite-only accounts are configured.
- /u/:slug: public read-only identity page. Requires an explicitly published record.
- /api/public-identity.js: Supabase anon-RLS SELECT with public columns only, escaped HTML and JSON-LD, anti-framing security headers, noindex.
- lib/public-profile.mjs: data validation, HTML rendering, approval checks and read-back comparison.
- idlab_public_identities: owner-owned drafts and published profiles, with private writes.
- idlab_public_identity_monitors: owner-scoped expected version/hash.
- idlab_public_identity_monitor_runs: historical integrity observations.
- Active Supabase Cron job at 10:15 UTC daily, checking the stored Ulab record's integrity.

## Safety and proof

Owners explicitly attest accuracy before publication, which is NOT proof that Ulab independently verified a person's identity or control of third-party profiles. Public beta cards are marked self-published and search indexing is disabled.

The four-person pilot can prefill an unpublished draft using directly linked public-source candidates. All prefilled links still require the person's approval. Third-party records cannot be edited through this workflow.

A successful public verification requires an HTTPS GET of the rendered public profile and an exact comparison of approved values and version. A saved database row alone is not proof. Scheduled integrity matches are not proof of Google indexing or changes to any external platform.

## Readiness

- CI tests cover approval, XSS escaping, URL validation, read-only selection and public read-back.
- Live Supabase RLS security advisors reported no findings.
- Accounts are disabled and no authenticated pilot users or published profiles exist yet.
- The scheduled job is active but currently monitors zero identities; no completed monitoring outcome has been observed.
- No external site edits, LinkedIn/IMDb changes, Knowledge Panels or paid customers have been produced by this version.

## Release gates

Before enabling publication, configure authorized Supabase Auth beta accounts and allowed redirect URLs; confirm appropriate identity/domain verification controls. Do not claim a completed third-party correction without a licensed integration, exact consent, platform-approved action and independent verification.
