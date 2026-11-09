import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import { site, socialLinks } from "../data";
import { getImageDimensions } from "../media";
import {
  breadcrumbSchema,
  personSchema,
  webPageSchema,
  withContext,
} from "../seo";

const aboutDescription =
  "Keenan Gray is a mountain-born, Brooklyn-based film director whose work combines the physicality of his twelve years as a circus performer with the sharp comedic instincts he developed at Saturday Night Live. He explores outlandish concepts with emotional authenticity, directing loosely enough for performances to feel natural and unscripted, then editing like it's surgery. His recent short Toy Gun (2026) was selected for HollyShorts Film Festival.";
const headshot = "/media/optimized/about-headshot.jpg";
const headshotDimensions = getImageDimensions(headshot);

export const metadata: Metadata = {
  title: { absolute: "Keenan Gray | Film Director" },
  description: aboutDescription,
  alternates: {
    canonical: "/about",
  },
  keywords: [
    "Keenan Gray biography",
    "Brooklyn film director",
    "New York filmmaker",
    "Saturday Night Live",
    "Filmshow founder",
  ],
  openGraph: {
    title: "Keenan Gray | Film Director",
    description: aboutDescription,
    url: `${site.url}/about`,
    images: [
      {
        url: headshot,
        ...headshotDimensions,
        alt: "Portrait of Keenan Gray.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Keenan Gray | Film Director",
    description: aboutDescription,
    images: [headshot],
  },
};

export default function AboutPage() {
  const newsletter = socialLinks.find((link) => link.label === "Newsletter");
  const imdb = socialLinks.find((link) => link.label === "IMDb");

  return (
    <main id="main" className="page-shell about-page">
      <JsonLd
        data={withContext([
          webPageSchema({
            path: "/about",
            name: "Keenan Gray | Film Director",
            description: aboutDescription,
            type: "ProfilePage",
            primaryImage: headshot,
            mainEntityId: `${site.url}/#keenan-gray`,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Me", path: "/about" },
          ]),
          personSchema(),
        ])}
      />
      <section className="personal-statement about-me-section">
        <h1>Keenan Gray</h1>
        <img
          src={headshot}
          alt="Portrait of Keenan Gray."
          width={headshotDimensions?.width}
          height={headshotDimensions?.height}
          sizes="(max-width: 720px) 58vw, 320px"
          fetchPriority="high"
          decoding="async"
        />
        <div>
          <p>
            Keenan Gray is a mountain-born, Brooklyn-based film director whose
            work combines the physicality of his twelve years as a circus
            performer with the sharp comedic instincts he developed at{" "}
            <em>Saturday Night Live</em>. He explores outlandish concepts with
            emotional authenticity, directing loosely enough for performances to
            feel natural and unscripted, then editing like it&apos;s surgery.
          </p>
          <p>
            His short film <a href="/work/toy-gun">Toy Gun</a> (2026) was
            selected for HollyShorts Film Festival.
          </p>
        </div>
        <div className="about-links">
          {newsletter ? (
            <a href={newsletter.href} target="_blank" rel="noreferrer">
              {newsletter.label}
            </a>
          ) : null}
          <a href={site.deck} target="_blank" rel="noreferrer">
            Director&apos;s Deck
          </a>
          {imdb ? (
            <a href={imdb.href} target="_blank" rel="noreferrer">
              {imdb.label}
            </a>
          ) : null}
        </div>
      </section>
      <section className="about-strip">
        <div>
          <p className="scarlet">Experience</p>
          <ul>
            <li>Oscar Qualifying&trade; HollyShorts Official Selection</li>
            <li>Saturday Night Live</li>
            <li>Graduated from the National Circus School of Montreal</li>
            <li>Jack Daniel&apos;s campaign development</li>
            <li>Fenty and Puma campaign development</li>
            <li>Co-Founder and Creative Director of Filmshow</li>
          </ul>
        </div>
        <div>
          <p className="scarlet">Independent coverage</p>
          <ul>
            <li>
              <a href="https://www.leagueoffilmmakers.com/toy-gun-throws-a-birthday-party-at-the-end-of-the-world/" target="_blank" rel="noopener noreferrer">
                Toy Gun filmmaker interview
              </a>
            </li>
            <li>
              <a href="https://www.timesunion.com/movies/article/saratoga-film-showcase-21298774.php" target="_blank" rel="noopener noreferrer">
                Times Union filmmaker profile
              </a>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
