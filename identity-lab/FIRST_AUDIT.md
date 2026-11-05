# Identity Lab pilot: first public footprint audit

**Subject:** Keenan Gray  
**Checked:** November 5, 2026  
**Website:** https://www.thiskeenan.com  
**IMDb:** https://www.imdb.com/name/nm16096261/

## Publicly verified

- Homepage resolves, with title **Keenan Gray | Brooklyn Film Director** and an accurate film director meta description.
- Homepage contains a visible link to the IMDb profile (and links to Instagram, YouTube, Vimeo, and Substack).
- Public About page is available at https://www.thiskeenan.com/about and links to the same IMDb profile.
- Homepage and About page both publish a canonical URL and index/follow directives.
- robots.txt allows crawlers and identifies the sitemap at https://www.thiskeenan.com/sitemap.xml.
- Public sitemap enumerates 12 site URLs including About, Toy Gun, and Filmshow.

## Observed in GitHub source, not independently extracted from the rendered HTML

- The website code defines **Person** JSON-LD in `app/seo.ts`.
- The `personSchema()` record sets **name**, film-director job title, website URL, image, and **sameAs** entries built from socialLinks.
- `app/data.ts` lists the verified IMDb URL as an explicit social link.
- `app/layout.tsx` emits the Person schema through the JsonLd component.

These are strong technical signs, but rendered production JSON-LD should be tested directly with [Google's Rich Results Test](https://search.google.com/test/rich-results) or a raw page-source inspection before marking production schema as verified.

## First fix candidate

The About page's main heading is **"Me"**. Change the visible H1 to `Keenan Gray` (or `Keenan Gray — Film Director`) if that fits the site design, then request a Google recrawl through Search Console. This is a reasonable clarity improvement, not a guarantee of a Knowledge Panel.

## Not yet established

- Whether the website is verified in Google Search Console or actually indexed for the desired queries.
- Whether IMDb links back to the official personal website through an accepted IMDb contribution.
- Whether Google currently displays any Knowledge Panel for this specific search result.
- Whether independent sources are sufficient for Google to generate a Knowledge Panel.

## Pilot engineering summary

- Read-only API, four fixed public pages, allowlisted website hostname, bounded response size and timeouts.
- No account credentials collected. No automatic third-party edits.
- Distinguishes **Confirmed**, **Needs attention**, **Unknown**, and **Manual verification** rather than inventing an overall "eligibility score".
- Interactive dashboard supports report export.
- AI commentary is optional and disabled unless both server-side API credentials and an access code are configured.
- GitHub branch: [identity-lab-pilot](https://github.com/thiskeenan-glitch/keenan-gray-site/tree/identity-lab-pilot/identity-lab)
- Deployment attempted in Film Show Vercel team but API rejected new project creation with **403 Forbidden**. The pilot is not live on a separate public URL.

## Next checks

1. Deploy the pilot as a **separate** Vercel project with root directory `identity-lab`, or grant project-creation permission on the Film Show team.
2. Test the runtime API on the live site, check response statuses and validate links.
3. Verify Search Console property ownership and use URL Inspection.
4. Run a second trial with an authorized customer only after implementing login, rate limiting, and robust third-party host safety restrictions.

**No changes were made to the live Keenan Gray website.**
