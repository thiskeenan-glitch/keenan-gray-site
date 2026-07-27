import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { JsonLd } from "../../components/JsonLd";
import { ProjectLink } from "../../components/ProjectLink";
import { VideoEmbed } from "../../components/VideoEmbed";
import { getProject, nextProject, projects, site } from "../../data";
import { getImageDimensions } from "../../media";
import {
  absoluteUrl,
  breadcrumbSchema,
  filmshowEventSeriesSchema,
  filmshowOrganizationSchema,
  projectCreativeWorkSchema,
  videoObjectSchema,
  webPageSchema,
  withContext,
} from "../../seo";

type ProjectPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  const description = project.metaDescription ?? project.description;
  const imageDimensions = getImageDimensions(project.image);

  return {
    title: {
      absolute: project.metaTitle ?? `${project.title} | Keenan Gray`,
    },
    description,
    alternates: {
      canonical: `/work/${project.slug}`,
    },
    keywords: project.keywords,
    openGraph: {
      title: project.metaTitle ?? `${project.title} | Keenan Gray`,
      description,
      url: `${site.url}/work/${project.slug}`,
      images: [
        {
          url: project.image,
          ...imageDimensions,
          alt: project.alt,
        },
      ],
      type: project.film ? "video.movie" : "article",
    },
    twitter: {
      card: "summary_large_image",
      title: project.metaTitle ?? `${project.title} | Keenan Gray`,
      description,
      images: [project.image],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const isFilmshow = project.slug === "filmshow";
  const isToyGun = project.slug === "toy-gun";
  const next = nextProject(project.slug);
  const projectEmbeds = project.embeds ?? [];
  const heroDimensions = getImageDimensions(project.image);
  const logoDimensions = project.logo ? getImageDimensions(project.logo) : undefined;
  const inlineStillDimensions = getImageDimensions("/media/optimized/toy-gun-staircase.jpg");
  const projectUrl = absoluteUrl(`/work/${project.slug}`);
  const schemaGraph = [
    webPageSchema({
      path: `/work/${project.slug}`,
      name: project.metaTitle ?? `${project.title} | Keenan Gray`,
      description: project.metaDescription ?? project.description,
      primaryImage: project.image,
      mainEntityId: `${projectUrl}#creative-work`,
    }),
    breadcrumbSchema([
      { name: "Home", path: "/" },
      { name: "Projects", path: "/work" },
      { name: project.title, path: `/work/${project.slug}` },
    ]),
    projectCreativeWorkSchema(project),
    ...projectEmbeds.map((embed) => videoObjectSchema(project, embed)),
    ...(isFilmshow ? [filmshowOrganizationSchema(), filmshowEventSeriesSchema()] : []),
  ];
  const toyGunTrailer = isToyGun
    ? projectEmbeds.find((embed) => embed.title.toLowerCase().includes("trailer")) ??
      projectEmbeds[0]
    : null;
  const toyGunFullFilm = isToyGun
    ? projectEmbeds.find((embed) => embed.title.toLowerCase().includes("full film")) ??
      projectEmbeds.find((embed) => embed !== toyGunTrailer) ??
      null
    : null;
  const gallery = isToyGun
    ? project.gallery?.filter((image) => image.src !== "/media/optimized/toy-gun-staircase.jpg")
    : project.gallery;

  return (
    <main id="main" className={`project-page project-page--${project.slug}`}>
      <JsonLd data={withContext(schemaGraph)} />
      <section className="project-hero">
        <img
          src={project.image}
          alt={project.alt}
          width={heroDimensions?.width}
          height={heroDimensions?.height}
          sizes="100vw"
          fetchPriority="high"
          decoding="async"
        />
        <div>
          <p className="scarlet project-eyebrow">{project.eyebrow}</p>
          <h1 className={project.logo ? "project-logo-title" : undefined}>
            {project.logo ? (
              <img
                src={project.logo}
                alt={project.logoAlt ?? project.title}
                width={logoDimensions?.width}
                height={logoDimensions?.height}
                sizes="(max-width: 720px) 64vw, 420px"
              />
            ) : (
              project.title
            )}
          </h1>
          <dl className="project-meta">
            {isFilmshow ? (
              <div className="project-meta-category">
                <dt>Category</dt>
                <dd>{project.eyebrow}</dd>
              </div>
            ) : null}
            <div>
              <dt>Role</dt>
              <dd>{project.role}</dd>
            </div>
            <div>
              <dt>Year</dt>
              <dd>{project.year}</dd>
            </div>
            <div>
              <dt>Context</dt>
              <dd>{project.client ?? project.context}</dd>
            </div>
          </dl>
        </div>
      </section>

      {project.laurels?.length ? (
        <section className="project-laurels" aria-label={`${project.title} laurels`}>
          {project.laurels.map((laurel) => (
            <img
              key={laurel.src}
              src={laurel.src}
              alt={laurel.alt}
              width={getImageDimensions(laurel.src)?.width}
              height={getImageDimensions(laurel.src)?.height}
              sizes="(max-width: 720px) 54vw, 300px"
              loading="lazy"
              decoding="async"
            />
          ))}
        </section>
      ) : null}

      <section className="project-intro">
        <h2 className="project-intro-title">{project.summary}</h2>
        <div>
          <p>{project.description}</p>
          {project.externalUrl ? (
            <a
              className="button button-solid project-external-link"
              href={project.externalUrl}
              target="_blank"
              rel="noreferrer"
            >
              {project.externalLabel ?? "Visit Project"}
            </a>
          ) : null}
        </div>
      </section>

      {isToyGun && (toyGunTrailer || toyGunFullFilm) ? (
        <section className="project-media project-media--toy-gun">
          <p className="scarlet">Watch</p>
          <div className="video-stack">
            {toyGunTrailer ? (
              <VideoEmbed key={`${toyGunTrailer.provider}-${toyGunTrailer.id}`} embed={toyGunTrailer} />
            ) : null}
            <figure className="project-inline-still">
              <img
                src="/media/optimized/toy-gun-staircase.jpg"
                alt="Toy Gun still on a staircase."
                width={inlineStillDimensions?.width}
                height={inlineStillDimensions?.height}
                sizes="(max-width: 920px) 100vw, 76vw"
                loading="lazy"
                decoding="async"
              />
            </figure>
            {toyGunFullFilm ? (
              <VideoEmbed key={`${toyGunFullFilm.provider}-${toyGunFullFilm.id}`} embed={toyGunFullFilm} />
            ) : null}
          </div>
        </section>
      ) : project.embeds?.length ? (
        <section className="project-media">
          <p className="scarlet">Watch</p>
          <div className="video-stack">
            {project.embeds.map((embed) => (
              <VideoEmbed key={`${embed.provider}-${embed.id}`} embed={embed} />
            ))}
          </div>
        </section>
      ) : null}

      {gallery?.length ? (
        <section className="project-gallery">
          {gallery.map((image) => (
            <figure
              key={image.src}
              className={image.layout ? `project-gallery-item--${image.layout}` : undefined}
            >
              <img
                src={image.src}
                alt={image.alt}
                width={getImageDimensions(image.src)?.width}
                height={getImageDimensions(image.src)?.height}
                sizes={
                  image.layout === "portrait"
                    ? "(max-width: 920px) 100vw, 44vw"
                    : "(max-width: 920px) 100vw, 76vw"
                }
                loading="lazy"
                decoding="async"
              />
              {image.caption ? <figcaption>{image.caption}</figcaption> : null}
            </figure>
          ))}
        </section>
      ) : null}

      {project.credits?.length ? (
        <section className="project-details">
          <div>
            <p className="scarlet">Credits</p>
            <ul>
              {project.credits.map((credit) => (
                <li key={credit}>{credit}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <nav className="next-project" aria-label="Next project">
        <Link href="/work">All Work</Link>
        <ProjectLink project={next} size="small" />
      </nav>
    </main>
  );
}
