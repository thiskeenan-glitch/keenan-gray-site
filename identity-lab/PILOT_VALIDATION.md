# Ulab: system-owned validation pilot

## Participants

Only the four agreed people:
- Keenan Gray
- Sam Ferlo
- Liam Gundlach
- Davis Brown

Andy Kugler is **not** part of this cohort.

## Purpose

Validate whether the Ulab **software**, rather than one-off assistant effort, can research real professional identities, generate legitimate repair opportunities, apply authorized source-specific changes, and independently verify results.

## Current operation

Open the internal preview route `/pilot` and click **Run all four audits** (or run subjects individually). The browser sends each name plus one optional public identity link to the existing live `POST /api/discover` research endpoint. The system builds a structured case and records its own discovery / triage stages. Results are stored in browser-local storage for the preview; **Export pilot results** creates a portable JSON file. No browser storage is synchronized across devices.

Only Keenan Gray has a pre-populated identity link. Sam Ferlo, Liam Gundlach and Davis Brown run name-only searches unless a trusted public identifying link is supplied. Name-only results can be namesakes and cannot justify a correction on their own.

The research system does **not** currently edit IMDb, LinkedIn, Wikipedia, or another person's account. No consent is inferred from using a name or posting a public link. A customer-owned website edit requires site verification, explicit owner approval and a scoped integration. A submitted editorial request is not a published change.

## Audit trail and measures

Every research case contains:
- Source leads and their URLs, marked unverified;
- Potential website gaps only when the user's supplied site was actually inspected and a specific issue observed;
- A status and an actor trail showing the stages Ulab completed automatically versus what remains blocked;
- Zero successful edits until independently established, even if an existing code patch or draft pull request is available.

Success requires a **specific, material correction** supported by evidence; authorized execution by the system or a source's permitted workflow; a pre-edit public baseline; and subsequent independent observation of the changed public value. Human assistance is tracked separately. Do not treat discovery, an AI score, a draft PR, or an unapproved submission as success.

## Next engineering milestone

A reusable adapter-and-consent protocol for owned websites, starting with owner-authorized source control or CMS integrations. Prefer a small number of safely supported exact changes over generic third-party account automation. Build an audited permission and correction queue before automatically invoking any write adapter for other participants.

## Explicitly not included

No new price, paid customer plan, backlink buying, Wikipedia creation, guaranteed Knowledge Panel, automatic external writes, recurring paid research jobs, or live production release is authorized by this pilot.
