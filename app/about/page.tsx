import type { Metadata } from "next";
import { site, socialLinks } from "../data";

export const metadata: Metadata = {
  title: "Me",
  description:
    "Keenan Gray is a mountain-born, Brooklyn-based film director with a circus background and 4 years at Saturday Night Live.",
  alternates: {
    canonical: "/about",
  },
};

export default function AboutPage() {
  const newsletter = socialLinks.find((link) => link.label === "Newsletter");
  const imdb = socialLinks.find((link) => link.label === "IMDb");

  return (
    <main id="main" className="page-shell about-page">
      <section className="personal-statement about-me-section">
        <h1>Me</h1>
        <img
          src="/media/optimized/about-headshot.jpg"
          alt="Portrait of Keenan Gray."
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
