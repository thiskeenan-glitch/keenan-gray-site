# First ten filmmakers: Google panel search observations

Observed: November 5, 2026, US / New York, two Google queries per person using SerpApi.

**Source records:** [Established filmmaker run](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42092256342) and [emerging filmmaker run](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42093799815). Download the `identity-lab-panel-study` and `identity-lab-emerging-sample` artifacts for query-level JSON with SerpApi IDs and top organic results.

## Observed results

| Person | Group | Automated result | Important caveat |
|---|---|---|---|
| Sean Baker | Established | Panel matching name, filmmaker | Needs human confirmation, although title and role agree |
| Celine Song | Established | Panel matching name, director/playwright | Needs human confirmation |
| Jane Schoenbrun | Established | Panel matching name, filmmaker | Needs human confirmation |
| Emma Seligman | Established | Panel matching name, director | Needs human confirmation |
| Jim Cummings | Established | Panels on both queries | Bare name returns a **voice actor**, profession qualifier returns the filmmaker; name-only result must not be counted as filmmaker's panel |
| Keenan Gray | Emerging | No panel returned for either query | Does not prove universal absence; the short query returns IMDb, personal site, TMDb and unrelated namesakes |
| Dian Weys | Emerging | Panel matching name and film-director role | Needs human confirmation |
| Jessy Moussallem | Emerging | Panel matching name and director role | Needs human confirmation |
| Rosella Tursi | Emerging | No panel returned for either query | Does not prove universal absence |
| Kiana Naghshineh | Emerging | Panel matching name and animator role for name query; no panel on role query | Search term affects whether Google presents a panel |

## Initial findings

- There is **no universal high-profile threshold** visible from this tiny sample. Three of five emerging candidates triggered panel blocks in at least one query.
- Search-query intent and **identity ambiguity** matter: Jim Cummings is a clear same-name collision, and Kiana Naghshineh shows query-dependent presence.
- The dataset is observational and highly selection-biased. It does **not prove** that certain publications, databases, or schema cause Google to create a panel.
- An absence of a Knowledge Graph block in the API must not be described as a definitive finding that a person lacks any Knowledge Panel.
- Compare **person-focused** reporting versus primarily *project-focused* reporting, publicly maintained reference profiles, and cross-site identity disambiguation before choosing any fulfillment steps.

## What we should test next

1. Complete the next five emerging filmmakers, then expand to the other categories with a controlled query budget.
2. Assess a small pair of comparably accomplished filmmakers, including Keenan Gray, recording independently maintained person profiles, independent person-focused news, film-program credits, canonical profile links and same-name confusion.
3. Rank interventions by feasibility **without customer account logins**. Publishing and database submissions must be accurate, independently appropriate and not covert advertising.
4. No new low-cost Knowledge Panel guarantee unless a consented intervention is actually associated with reproducible panel creation in multiple tests.

**Action boundaries:** This research reads public information only. It does not create Wikipedia/Wikidata entries, solicit coverage, or change any client accounts.
