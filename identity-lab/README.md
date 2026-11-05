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
