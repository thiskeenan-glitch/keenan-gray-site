import Link from "next/link";
import { HeroVideo } from "./components/HeroVideo";
import { ProjectLink } from "./components/ProjectLink";
import { projects, site } from "./data";

export default function Home() {
  const selected = projects
    .filter((project) => project.featured || project.slug === "filmshow")
    .slice(0, 6);

  return (
    <main id="main">
      <section className="hero">
        <HeroVideo />
        <div className="hero-copy">
          <p className="hero-role">Film Director</p>
          <h1>Keenan Gray</h1>
        </div>
      </section>

      <section className="section selected-work">
        <div className="section-heading split">
          <div>
            <p className="scarlet">Projects</p>
            <h2>Projects</h2>
          </div>
          <Link className="button" href="/work">
            Projects
          </Link>
        </div>
        <div className="selected-grid">
          {selected.map((project, index) => (
            <ProjectLink
              key={project.slug}
              project={project}
              priority={index < 2}
            />
          ))}
        </div>
      </section>

      <section className="section personal-statement">
        <h2>
          <Link href="/about">Me</Link>
        </h2>
        <Link className="personal-photo-link" href="/about" aria-label="Read more about Keenan Gray">
          <img
            src="/media/optimized/about-headshot.jpg"
            alt="Portrait of Keenan Gray."
            loading="lazy"
            decoding="async"
          />
        </Link>
        <div>
          <p>
            Keenan Gray is a mountain-born, Brooklyn-based film director.
          </p>
          <p>
            He combines 12 years as a circus performer and 4 years at Saturday
            Night Live.
          </p>
          <a className="button personal-deck-link" href={site.deck} target="_blank" rel="noreferrer">
            Director&apos;s Deck
          </a>
        </div>
      </section>

      <section className="section contact-close">
        <p className="scarlet">Contact</p>
        <h2>Contact</h2>
        <p className="contact-dare">Say hi, I dare you.</p>
        <div className="contact-actions">
          <a className="button button-solid" href={`mailto:${site.email}`}>
            {site.email}
          </a>
          <Link className="button" href="/contact">
            Start an Inquiry
          </Link>
        </div>
      </section>
    </main>
  );
}
