# Identity Lab: Knowledge Panel comparison pilot

**Prepared:** November 5, 2026  
**Status:** 40-person source-grounded candidate cohort assembled. **Panel presence has not yet been independently checked for the cohort, so no panel/no-panel outcome comparison is claimed.**

## Question

Among accomplished, identifiable people, what observable public-source signals distinguish Google Knowledge Panels from no panels, and can any missing signals be improved ethically, cheaply, and without client-account login?

Google states that Knowledge Panels are automatically generated from the Knowledge Graph and various web and partner sources. A panel's appearance is not a user-controlled output: https://support.google.com/knowledgepanel/answer/9163198 and https://support.google.com/knowledgepanel/answer/9787176.

## What is in this pilot

- [candidate-cohort-40.csv](./candidate-cohort-40.csv): **40 prospective examples**, divided evenly into 20 reference-rich / established people and 20 accomplished emerging candidates. Within each cohort: 10 filmmakers, 5 founders, 5 visual artists. Each has at least a starting public reference link, but these **seed URLs are not yet a verified source audit for every row**.
- [check-panels.mjs](./check-panels.mjs): limited Google Search Results API runner. Makes 2 queries per person, stores search observations and source links in JSON and CSV, and treats potential matching panels as **requiring human review**. It does not make account changes.
- [../../cases/keenan-gray-proof-of-outcome.md](../../cases/keenan-gray-proof-of-outcome.md): richer first-subject evidence and hypotheses.

**Crucial methodological limitation:** These are not matched pairs. Established celebrities versus emerging professionals almost certainly differ in public visibility. Do not attribute differences to any single signal. After the first panel-status sweep, match within each category and similar career stage before drawing conclusions.

## Observational definitions

- `possible_panel_needs_human_confirmation`: Google API returned a Knowledge Graph block whose title resembles the person's name. Human must review type, description, links, and whether it is the intended person.
- `not_observed_in_two_queries`: No matching Knowledge Graph block was returned for the *specified queries and US locale*. **Not proof that no Knowledge Panel exists** elsewhere, for another query, or on another day.
- `other_entity_panel_observed`: Panel title seems to refer to a different entity, often a namesake.
- `unknown`: API error or insufficient evidence.
- Only a screenshot or unambiguous captured query-specific results for the **correct person** can support a verified positive panel outcome. A user can report absence, but that does not independently verify it.

## Data collection protocol

1. Run **two Google US queries** per person: exact name, then name plus profession. If names are shared, additionally verify correct identity by professional context and authoritative links.
2. Manually review all positive/ambiguous results. Record query, date, locale, screenshot or API search ID, matching profile, and reviewer.
3. Separately audit public identity signals:
   - official personal website, crawlable and accessible;
   - trustworthy career/profile record(s) (IMDb, YC company, gallery, festival);
   - number of **distinct independently controlled domains** with supported references;
   - number of **person-focused independent stories**, separately from film/event/product-focused stories;
   - Wikipedia/Wikidata presence, eligibility and appropriate citations (never create promotional entries);
   - stable canonical name/role/profile links and same-name ambiguity.
4. Find comparable subjects by category and career stage, check potential confounders, and see which *observed* signals are meaningfully associated with panels.
5. Only after a credible signal emerges, perform controlled authorized experiments with consenting subjects; observe outputs over time and count cost, reviews, cancellations and failures.

## Running the API sample without risking unexpected costs

SerpApi currently advertises 250 searches/month on its free plan and up to 50/hour: https://serpapi.com/pricing. The script makes two requests per person. Budget for the complete 40-person study is **80 queries** before any reruns or follow-up queries. Keep it to no more than 20 people (40 searches) per hour on that plan.

- Create a free SerpApi account: https://serpapi.com/users/sign_up
- Put the secret in the **`SERPAPI_KEY`** environment variable, not in a commit or chat.
- Run from this repository with Node.js 20 or newer: `node identity-lab/research/2026-11-05/check-panels.mjs --limit 5`.
- Results are generated locally in `identity-lab/research/2026-11-05/results/panel-observations.json` and `.csv`. They are **not yet populated** in this repository.
- For remaining participants, run separate batches with `--offset` and `--limit` after respecting the hourly allowance.

Do **not** state that the research has established a predictive algorithm or that a Knowledge Panel can be bought. External publication must be authorized, authentic and not misrepresented as independent editorial content.

## Early observations (not statistical results)

- HollyShorts 2026 award winners have verified, prominent awards and credited names in organizer records: https://www.hollyshorts.com/news/hollyshorts-2026-the-winners.
- Frieze has individual artist-focused editorial coverage for five emerging artists: https://www.frieze.com/article/five-emerging-artists-watch-frieze-new-york-2026.
- YC cohort lists include founder names but are largely **company-focused**: https://www.vcbacked.co/yc/batch/w26 and https://www.vcbacked.co/yc/batch/s26.
- Keenan Gray already has independent film/event reporting and professional records, but his first study has **not** yet confirmed panel presence by normal visual SERP inspection after Google blocked an automated check.

These observations motivate testing **person-focused independent sources, stable disambiguation, and reference consistency**. They do not establish these features as causes of Knowledge Panel creation.

## Product decision gate

If the cohort reveals an inexpensive, legitimate, and repeatable evidence correction path, run three consented 60–90 day pilots with bounded human hours. If each customer needs bespoke editorial commissions and frequent approvals, do not promise a $650 nearly automatic panel product. Offer a smaller identity evidence/repair product or decline unready customers instead.

## Initial API check

On 2026-11-05, the repository owner configured the `SERPAPI_KEY` Actions secret and requested activation of the bounded five-person sample. The workflow is triggered by this documentation commit; the result must be verified in GitHub Actions before making panel claims.
