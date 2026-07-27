import type { Metadata } from "next";
import { FilmshowPhotoSequence } from "../components/FilmshowPhotoSequence";
import { getProject, site } from "../data";

export const metadata: Metadata = {
  title: "Filmshow",
  description:
    "Filmshow by Keenan Gray.",
  alternates: {
    canonical: "/filmshow",
  },
};

export default function FilmshowPage() {
  const filmshow = getProject("filmshow");
  const photos = filmshow?.gallery ?? [];

  return (
    <main id="main" className="page-shell filmshow-page">
      <section className="filmshow-hero">
        <img
          src="/media/optimized/filmshow-crowd.jpg"
          alt="A packed Filmshow audience watching a film projected on a wall."
          fetchPriority="high"
          decoding="async"
        />
        <div>
          <h1 className="logo-heading">
            <img
              className="filmshow-logo filmshow-logo--hero"
              src="/filmshow-logo.png"
              alt="Filmshow"
              fetchPriority="high"
              decoding="async"
            />
          </h1>
          <p className="filmshow-kicker">It&apos;s in the name</p>
          <a className="button" href={site.filmshow} target="_blank" rel="noreferrer">
            Visit Filmshow
          </a>
        </div>
      </section>
      <section className="filmshow-blurb" aria-label="About Filmshow">
        <p>
          Filmshow combines short films from local filmmakers and live
          experimental theater to create a glimpse into the underground scene of
          New York City.
        </p>
      </section>
      {photos.length ? <FilmshowPhotoSequence photos={photos} /> : null}
      <section className="filmshow-closing" aria-label="Filmshow statement">
        <p>This is not a film festival. It&apos;s a filmshow.</p>
      </section>
    </main>
  );
}
