# Keenan Gray: Knowledge Panel proof-of-outcome experiment

**Case created:** 2026-11-05  
**Status:** Source mapping complete; live panel status not independently confirmed.  
**Goal:** Determine whether authentic, verifiable sources can lead Google to display a Knowledge Panel for the Brooklyn film director, without artificially manufactured claims or repeated account logins.  
**Subject's reported baseline:** No personal Knowledge Panel.  
**Automated baseline limitation:** Google CAPTCHA blocked a direct visual SERP check on 2026-11-05. Web search indexes the person but is not proof either way about panel appearance.

## Hypotheses to test, not established causes

1. **Identity ambiguity:** The exact name "Keenan Gray" also appears for unrelated sports journalists/athletes/creatives. Google may treat the short query as ambiguous.
2. **Fragmented sources:** Strong coverage exists across film, events, and festivals, but the pages often focus on a *film* or *event*, not primarily on Keenan as an individual.
3. **Google's independent ranking and presentation choices:** Google's Knowledge Graph and Knowledge Panel appearance are not controlled by an applicant or agency. Even successful identity recognition may not show a panel for every query.

## Evidence: independently published or externally maintained

| Source | URL | What it supports | Classification / limitation |
|---|---|---|---|
| Times Union | https://www.timesunion.com/movies/article/saratoga-film-showcase-21298774.php | Film director, former SNL staffer, *Seedless* screening | Independent regional newspaper; main story is the film showcase |
| League of Filmmakers | https://www.leagueoffilmmakers.com/toy-gun-throws-a-birthday-party-at-the-end-of-the-world/ | Extended *Toy Gun* feature/interview and director credits | Independently published feature; interview statements are attributed to subject |
| The Contending | https://thecontending.com/hollyshorts-2026/ | Official selection of *Toy Gun* and directing attribution | Independently published selection list; brief mention |
| Greenpointers | https://greenpointers.com/2026/09/14/new-festival-filmshow-brings-shorts-and-live-performances-to-rollin-studios-this-fall/ | Filmshow event; tag and supplied photography identifying Keenan | Independent neighborhood article; primarily about event |
| Queens World Film Festival | https://queensworldfilmfestival.org/keenan-gray-queens-world-film-festival-alumni-on-the-move/ | Dedicated alumni career feature; *Seedless* credits, festival history | Festival-maintained subject-specific feature, not wholly independent from film ecosystem |
| HollyShorts official program | https://circle-brass-c6d4.squarespace.com/news/hollyshorts-2026-the-official-selections-are-here | *Toy Gun* credited to Keenan Gray | Primary organizer/source of selection announcement |
| IMDb | https://www.imdb.com/name/nm16096261/ | Distinct person identifier, professional film and TV credits; *Toy Gun* (2026), *Seedless* (2025) | External film database, not a guarantee of panel |
| FilmFreeway | https://filmfreeway.com/thefilmshow | Named Filmshow founder/director; audience attendance 225 | Event listing operated by organizers, not independent press |
| NYReview contributor story | https://nyreview.com/filmshow-is-reinventing-what-a-night-of-short-films-can-feel-like/ | Keenan identified as Filmshow creator | **Contributor Content**, not assumed to be independent editorial reportage |

## External evidence of same-name ambiguity

- Sports journalist named Keenan Gray: https://muckrack.com/keenan-gray
- College basketball player named Keenan Gray: https://basketball.realgm.com/player/Keenan-Gray/Summary/262240
- Designer named Keenan Gray: https://www.linkedin.com/in/keenan-gray-297854211

These are not the filmmaker. Never merge them into his professional identity.

## What the existing technical audit established

The public website at https://www.thiskeenan.com is crawlable and publishes `Person` schema and `sameAs` linking to https://www.imdb.com/name/nm16096261/. Public homepage and About page contain the IMDb link. XML sitemap and robots.txt resolve. The sole small copy issue found was an About page H1 of "Me". Do not exaggerate the expected Knowledge Panel effect of that heading change.

## Proposed no-login fulfillment experiment

1. Capture the baseline search result in a normal human browser for **Keenan Gray**, **Keenan Gray film director**, and **Keenan Gray Toy Gun**, with date/country noted. Automated live visual check was stopped by a Google CAPTCHA, so this remains unconfirmed.
2. Identify genuinely **independent, person-focused** reporting opportunities. Strongest editorial narrative: former circus performer and SNL production worker now directing *Toy Gun* and building a cinema/live theater event in Brooklyn. Offer real interviews and primary supporting material, without promises to editors or payment for undisclosed content.
3. Ensure any available externally managed film and event records are accurate, consistent, and correctly distinguish this person from unrelated namesakes. Account-owned changes require authorization, but are optional in the no-login path.
4. Observe legitimate publication/crawl outcomes and monitor search results over 8–12 weeks. Record date, source, link, cost, and any human hours. Do not credit an individual change as the cause of a panel without defensible evidence.
5. Report the outcome as **panel appeared / no panel confirmed / unavailable to verify**. No success claim until a panel is seen in an ordinary, reproducible search.

## Disallowed or counterproductive shortcuts

- Do not fabricate awards, coverage, professional records or identities.
- Do not purchase undisclosed promotional articles and represent them as independent editorial coverage.
- Do not create Wikidata/Wikipedia entries on behalf of the subject for promotion or create items where inclusion criteria are not met. See https://www.wikidata.org/wiki/Wikidata:SELF and https://www.wikidata.org/wiki/Wikidata:Notability.
- Do not promise Google will create a panel: https://blog.google/products-and-platforms/products/search/about-knowledge-graph-and-knowledge-panels/
- Do not make public profile changes without authorized access or human review.

## Competitor claim to test

Essentras publicly states that many customers already have enough existing coverage, that extra media placements are **not required**, and that its $650 personal offer is backed by an outcome refund. It estimates 4–10 weeks when credible coverage exists; this timing is **its estimate, not Google's guarantee**.

Reference: https://essentras.com/services/google-knowledge-panel

## Current outcome

**A repeatable service has not been proven yet.** The case has substantial third-party evidence and visible namesake ambiguity. No new editorial coverage has been secured, no third-party accounts have been changed, and no Knowledge Panel has been confirmed through this experiment.
