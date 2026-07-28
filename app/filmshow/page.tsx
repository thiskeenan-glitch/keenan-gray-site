import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import { getProject, site } from "../data";
import { getImageDimensions } from "../media";
import {
  breadcrumbSchema,
  filmshowEventSeriesSchema,
  filmshowId,
  filmshowOrganizationSchema,
  webPageSchema,
  withContext,
} from "../seo";

const filmshowDescription =
  "Filmshow is a New York live show founded by Keenan Gray that combines short films from local filmmakers and live experimental theater.";
const filmshowHero = "/media/optimized/filmshow-hero-tootsie.jpg";
const filmshowHeroAlt =
  "Black-and-white Filmshow still of a performer under textured light.";
const filmshowHeroDimensions = getImageDimensions(filmshowHero);
const filmshowLogoDimensions = getImageDimensions("/filmshow-logo.png");

export const metadata: Metadata = {
  title: "Filmshow | Short Films and Live Experimental Theater",
  description: filmshowDescription,
  alternates: {
    canonical: "/filmshow",
  },
  keywords: [
    "Filmshow",
    "New York short films",
    "live experimental theater",
    "underground New York film scene",
    "Keenan Gray Filmshow",
  ],
  openGraph: {
    title: "Filmshow | Keenan Gray",
    description: filmshowDescription,
    url: `${site.url}/filmshow`,
    images: [
      {
        url: filmshowHero,
        ...filmshowHeroDimensions,
        alt: filmshowHeroAlt,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Filmshow | Keenan Gray",
    description: filmshowDescription,
    images: [filmshowHero],
  },
};

export default function FilmshowPage() {
  const filmshow = getProject("filmshow");
  const photos = filmshow?.gallery ?? [];

  return (
    <main id="main" className="page-shell filmshow-page">
      <JsonLd
        data={withContext([
          webPageSchema({
            path: "/filmshow",
            name: "Filmshow | Keenan Gray",
            description: filmshowDescription,
            primaryImage: filmshowHero,
            mainEntityId: filmshowId,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Filmshow", path: "/filmshow" },
          ]),
          filmshowOrganizationSchema(),
          filmshowEventSeriesSchema(),
        ])}
      />
      <section className="filmshow-hero">
        <img
          src={filmshowHero}
          alt={filmshowHeroAlt}
          width={filmshowHeroDimensions?.width}
          height={filmshowHeroDimensions?.height}
          sizes="100vw"
          fetchPriority="high"
          decoding="async"
        />
        <div>
          <h1 className="logo-heading">
            <img
              className="filmshow-logo filmshow-logo--hero"
              src="/filmshow-logo.png"
              alt="Filmshow"
              width={filmshowLogoDimensions?.width}
              height={filmshowLogoDimensions?.height}
              sizes="(max-width: 720px) 64vw, 360px"
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
          Filmshow is a live show that combines short films from local
          filmmakers and live experimental theater to create a glimpse into the
          underground scene of New York City.
        </p>
      </section>
      {photos.length ? (
        <section className="project-gallery" aria-label="Filmshow photos">
          {photos.map((photo, index) => {
            const photoFigure = (
              <figure
                key={photo.src}
                className={photo.layout ? `project-gallery-item--${photo.layout}` : undefined}
              >
                <img
                  src={photo.src}
                  alt={photo.alt}
                  width={getImageDimensions(photo.src)?.width}
                  height={getImageDimensions(photo.src)?.height}
                  sizes={
                    photo.layout === "portrait"
                      ? "(max-width: 920px) 100vw, 44vw"
                      : "(max-width: 920px) 100vw, 76vw"
                  }
                  loading="lazy"
                  decoding="async"
                />
                {photo.caption ? <figcaption>{photo.caption}</figcaption> : null}
              </figure>
            );

            if (index !== 0) {
              return photoFigure;
            }

            return [
              photoFigure,
              <figure key="filmshow-gallery-video" className="project-gallery-item--video">
                <video
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  aria-label="Filmshow video preview"
                >
                  <source src="/media/optimized/filmshow-thumb-video.mp4?v=20260728" type="video/mp4" />
                </video>
              </figure>,
            ];
          })}
        </section>
      ) : null}
      <section className="filmshow-closing" aria-label="Filmshow statement">
        <p>This is not a film festival. It&apos;s a filmshow.</p>
      </section>
    </main>
  );
}
