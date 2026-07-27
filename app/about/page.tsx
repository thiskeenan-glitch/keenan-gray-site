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
  "Keenan Gray is a mountain-born, Brooklyn-based film director with a circus background, 4 years at Saturday Night Live, and work across narrative films, commercials, and Filmshow.";
const headshot = "/media/optimized/about-headshot.jpg";
const headshotDimensions = getImageDimensions(headshot);

export const metadata: Metadata = {
  title: "Me | Brooklyn Film Director",
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
    title: "Me | Keenan Gray",
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
    title: "Me | Keenan Gray",
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
            name: "Me | Keenan Gray",
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
        <h1>Me</h1>
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
            Keenan Gray is a mountain-born, Brooklyn-based film director.
          </p>
          <p>
            He combines 12 years as a circus performer and 4 years at Saturday
            Night Live.
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
            <li>4 years at Saturday Night Live</li>
            <li>Jack Daniel&apos;s campaign development</li>
            <li>Fenty and Puma campaign development</li>
            <li>Founder and director of Filmshow</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
