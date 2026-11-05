# Identity Lab: Completed 40-person search observation study

**Date:** 2026-11-05  
**Status:** 40 unique people checked (80 distinct initial queries, plus 10 duplicate queries caused by one overlapping batch). The study uses US Google searches as reported by SerpApi. **All title-matched panels remain provisional until independently verified as the correct individual.**  
**This is observational data, not a causal or predictive model.**

## Top-line results

| Career category | Established, reference-rich people with possible panels | Emerging, accomplished people with possible panels | Emerging people with no panel returned in either of two queries |
|---|---:|---:|---:|
| Film | 10 / 10 | 7 / 10 | 3 / 10 |
| Founders | 5 / 5 | 0 / 5 | 5 / 5 |
| Visual art | 5 / 5 | 1 / 5 | 4 / 5 |
| **Total** | **20 / 20** | **8 / 20** | **12 / 20** |

A `possible panel` means the Search API returned a `knowledge_graph` object whose title resembles the name, not that the right person's Google Knowledge Panel has been independently confirmed in a human browser. A negative means nothing matching was returned for the exact **two US queries used on that date**, not that Google has no graph entity or never shows a panel.

## Emerging candidates, complete results

**Possible same-name, role-consistent Knowledge Graph blocks:** Dian Weys; Jessy Moussallem; Kiana Naghshineh; Alyssa Loh; Adrian Moyse Dullin; Jeremy Max; Shruti Parekh; Seba Calfuqueo.

**No panel returned in either query:** Keenan Gray; Rosella Tursi; Pippa Feldberg Collins; David Roberts; Paulina Xu; James Baek; Amie Leighton; Ryan Samadi; Abraham González Pacheco; Reika Takebayashi; Joanne Burke; Aki Goto.

**Established, reference-rich candidates:** Sean Baker; Celine Song; Jane Schoenbrun; Emma Seligman; Jim Cummings; Janicza Bravo; Lulu Wang; Chloé Zhao; Shaka King; A. V. Rockwell; Brian Chesky; Melanie Perkins; Whitney Wolfe Herd; Sara Blakely; Drew Houston; KAWS; Kehinde Wiley; Mickalene Thomas; Theaster Gates; Tschabalala Self. All 20 had a possible name-matching KG block in at least one tested query. **Jim Cummings name-only returned the voice actor, not the independent filmmaker; only the role-qualified query disambiguated the filmmaker.** Human confirmation is still needed for other homonyms.

## Meaningful observations

1. **Recognition differs sharply by profession and career stage.** Emerging-film directors were far more likely to return a matching KG block in this particular convenience sample than emerging founders. Possible explanations include domain-specific databases, Google data partnerships, public search demand, awards and coverage. We cannot isolate any cause.
2. **Keenan Gray has recognized professional evidence but weak name-to-person query convergence.** The exact-name search surfaced IMDb image, the director's Filmshow project page, TMDb and a namesake athlete; the role-qualified query also produced unrelated YouTube and film results. His existing film credits are real; the query did not resolve them into a panel in this locale.
3. **Examples of externally operated person-level profiles on positive-film cases:** Dian Weys has Cannes reporting and South African film festival references; Jessy Moussallem has Unifrance and Sundance-linked records; Kiana Naghshineh has arts residency, festival and animation industry coverage; Adrian Moyse Dullin has a Unifrance person listing and agency profile. These sources may be useful corroboration but are not proven causes of panels.
4. **Generic listings are not enough by themselves.** Candidates with IMDb, TMDb, MUBI, YC, Artsy or filmmaker social accounts sometimes still showed no panel. The sample cannot distinguish missing visibility from the wrong search phrasing or other Google choices.
5. **Beware false positives.** Panel title similarity does not prove it is the person in the cohort. Check knowledge graph description, links and film names; record panel screenshot or source ID. Also, panel presentation is query-dependent: Kiana, Adrian and Jeremy have possible panels in the name-only query but not in the name-plus-profession query.

## Replicable low-login intervention experiment for Keenan

**Round 1: evidence convergence, not manufactured publicity.**

- Capture a human-verified search baseline: exact name, name + film director, and name + Toy Gun. Record date/location/screenshots; do not attribute any change to intervention without a valid baseline.
- Create a consistent **factual professional identity dossier** using existing public links: official website, IMDb person ID, verified independent press and film festival programs, an accurate filmography and consistent description `Keenan Gray, Brooklyn-based film director`. Do not misrepresent personal/social posts or self-submitted festival listings as independent editorial features.
- Find **legitimate professional industry person registries** that accept factual first-party submissions with permission or independent editorial updates. Prioritize fit with directing credits, editorial requirements, free or low fee and publicly indexed pages. Treat every submitted entry as a source whose accuracy may need later maintenance.
- When a profile has demonstrable incorrect information, propose an evidence-linked correction via its official process. If an account-holder login/approval is required, ask once, rather than obtaining passwords or automated login access.
- Any optional update to the personal website's About heading, Person schema or outbound authoritative links must be reviewed before committing to the live site. The previous audit already found a crawlable homepage, IMDb link and schema, so do not oversell cosmetic changes.
- Monitor sources and Google presentation for 60–90 days. Declare the outcome **confirmed / not observed / unknown**; no guarantee.

**What not to automate:** covert paid advertorials described as independent press, indiscriminate Wikipedia/Wikidata creation, fake awards, unauthorized profile edits, or repeated speculative submissions to Google.

## Next falsifiable business test

Use **three consenting emerging filmmakers**, including Keenan, who have independently verifiable awards/credits and who currently have no matching panel under defined queries. A human reviewer should first confirm panel status and choose two comparable observational controls. For the three subjects, record actual hours, direct out-of-pocket costs, permissions required, source additions, and subsequent panel observations. If low-cost source corrections produce panels consistently enough to justify fulfillment, expand. If meaningful PR/institutional credibility is essential and bespoke, do not advertise guaranteed $650 panels.

**Key limitation:** The established half of this sample was deliberately selected for rich reference coverage and public visibility. Comparing its 100% possible-panel rate with the emerging half is subject to severe selection bias. No evidence here suggests that adding any particular link, biography, or registry will trigger a panel.

## Full GitHub Actions evidence

- [5 established filmmakers: run 42092256342](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42092256342), artifact `identity-lab-panel-study`
- [Emerging filmmakers 1–5: run 42093799815](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42093799815), artifact `identity-lab-emerging-sample`
- [Emerging filmmakers 6–10: run 42094925243](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42094925243), artifact `identity-lab-emerging-sample`
- [Emerging founders and artists: run 42095945066](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42095945066), artifact `identity-lab-founders-artists-sample`
- [Established founders and artists, plus repeated emerging-film sample: run 42096283396](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42096283396), artifact `identity-lab-established-comparators`
- [Final 5 established filmmakers: run 42096539794](https://github.com/thiskeenan-glitch/keenan-gray-site/actions/runs/42096539794), artifact `identity-lab-final-five-directors`

Official Google explanation: https://support.google.com/knowledgepanel/answer/9163198 and https://support.google.com/knowledgepanel/answer/9787176. Google's panel algorithms may display one for some queries and not others, and panels cannot be directly commissioned from Google.
