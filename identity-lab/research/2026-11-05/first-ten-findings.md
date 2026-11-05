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

## Next five emerging filmmakers: November 5, 2026

[GitHub Actions run #42094925243](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42094925243), artifact `identity-lab-emerging-sample`, contains ten query observations for these five filmmakers:

| Person | Name query | Name + role query | Key observation |
|---|---|---|---|
| Pippa Feldberg Collins | No panel returned | No panel returned | Film work and MUBI cast listing; few immediately visible person-focused public sources |
| Alyssa Loh | Panel titled Alyssa Loh, type Filmmaker | Same titled panel | Personal site, Vimeo and a published Artforum author profile visible |
| Adrian Moyse Dullin | Panel titled Adrian Moyse Dullin, type Film director | No panel returned | Unifrance professional person listing, agency profile, festival/program references |
| Jeremy Max | Panel titled Jeremy Max, type Film director | No panel returned | IMDb/TMDb and film interviews; verify the returned panel is actually the same director |
| Shruti Parekh | Panel titled Shruti Parekh, type Director | Same titled panel | IMDb/TMDb and other filmmaker references; verify person identity |

**Across all 15 filmmakers checked:** 12 show at least one possible same-name Knowledge Graph block (five established and seven emerging); three (Keenan Gray, Rosella Tursi, and Pippa Feldberg Collins) show none in the two tested searches. These are *automated title and role matches*, not confirmed screenshot-backed Knowledge Panels and not an intervention success rate.

### Working signals to audit (hypotheses, not established predictors)

1. **Third-party person records vs project pages:** Peers with possible panels often have distinct person profiles on Unifrance, agency/film organizations, institutional directories or publications; those are not equivalent to film-listing credits alone.
2. **Name-to-profession search clarity:** Keenan's name-plus-role query produced weak identity matching with unrelated video results in this location, despite an IMDb identity and official website. Compare Google query phrasing before assuming entity absence.
3. **Namesake and identity mismatch:** Do not count actor/director homonyms or a same-name person in a different profession. A matching name is only the first filter.
4. **Quality before quantity:** One authoritative, regularly maintained professional identity page may matter more than many low-quality syndicated pages; this is an hypothesis to test prospectively.

### Low-login, low-cost intervention priorities for the Keenan case

- **Priority A, no client accounts:** Build a machine-readable dossier of existing *verified* press, film festival credits and public institutional references, with exact matching name, role, titles, and URLs; find genuinely missing professional directories with a legitimate editorial/inclusion process, and submit only where permitted and supported.
- **Priority B, authorized one-time website update:** If approved, improve conspicuous name + film director identification on About page, add links to *specific independent person references*, and validate existing Person schema. This is easy, but expected panel effect is unproven.
- **Priority C, only as warranted:** Correct mismatched professional profile descriptions through their official suggestion/correction processes, asking for account approval only if needed.
- **Not a default low-cost workflow:** Commission new paid media, create promotional Wikipedia/Wikidata entries, or imply that indexing/search-console actions can force a panel.

**Next decision:** A controlled 60–90 day pilot should test pre-existing evidence consolidation and legitimate directory corrections against comparable waiting-list subjects. This remains a hypothesis until there is reproducible, identity-verified panel appearance.

## Founder and artist sample, November 5, 2026

[GitHub run #42095945066](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42095945066) completed successfully; the `identity-lab-founders-artists-sample` artifact contains 20 query-level observations.

| Cohort | Possible person-matching Knowledge Graph panel in either query | No panel returned in both queries |
|---|---:|---:|
| Five emerging startup founders | 0 | 5 |
| Five emerging visual artists | 1 | 4 |

The one emerging artist with an apparent panel was **Seba Calfuqueo** (listed as `Plastician`); public results include museum, gallery, and specialist art-event references. The names and exact entity identity require manual confirmation.

Other emerging cases had genuine third-party records but no returned panel: founders David Roberts, Paulina Xu, James Baek, Amie Leighton, Ryan Samadi; artists Abraham González Pacheco, Reika Takebayashi, Joanne Burke, and Aki Goto. These are *specific-query negatives*, not proof that no panel ever exists or that sources are inadequate.

### Cross-category caution

Five early-stage founders versus five award-recognized filmmakers are not a fair matched test. Differences may arise from career stage, search demand, data licenses for entertainment, institutional profiles, and query ambiguity. The data cannot establish the underlying ranking mechanism. Future matching should control for career age, coverage count, professional awards, and source type.

### Preliminary, falsifiable business hypothesis

For creators in domains like film and visual arts, *externally administered person profiles* (film-industry registries, museums, agencies, gallery/arts institutions) may be helpful entity signals. Verify with paired comparisons and experiments before claiming causation. This is more scalable than booking custom interviews for every customer; it is **not** a demonstrated panel-generation recipe.
