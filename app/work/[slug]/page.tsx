import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectLink } from "../../components/ProjectLink";
import { VideoEmbed } from "../../components/VideoEmbed";
import { getProject, nextProject, projects, site } from "../../data";

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

  return {
    title: project.title,
    description: project.summary,
    alternates: {
      canonical: `/work/${project.slug}`,
    },
    openGraph: {
      title: `${project.title} | Keenan Gray`,
      description: project.summary,
      url: `${site.url}/work/${project.slug}`,
      images: [
        {
          url: project.image,
          alt: project.alt,
        },
      ],
    },
  };
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const next = nextProject(project.slug);

  return (
    <main id="main" className={`project-page project-page--${project.slug}`}>
      <section className="project-hero">
        <img src={project.image} alt={project.alt} fetchPriority="high" decoding="async" />
        <div>
          <p className="scarlet">{project.eyebrow}</p>
          <h1 className={project.logo ? "project-logo-title" : undefined}>
            {project.logo ? (
              <img src={project.logo} alt={project.logoAlt ?? project.title} />
            ) : (
              project.title
            )}
          </h1>
          <dl className="project-meta">
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
            <img key={laurel.src} src={laurel.src} alt={laurel.alt} loading="lazy" decoding="async" />
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

      {project.embeds?.length ? (
        <section className="project-media">
          <p className="scarlet">Watch</p>
          <div className="video-stack">
            {project.embeds.map((embed) => (
              <VideoEmbed key={`${embed.provider}-${embed.id}`} embed={embed} />
            ))}
          </div>
        </section>
      ) : null}

      {project.gallery?.length ? (
        <section className="project-gallery">
          {project.gallery.map((image) => (
            <figure
              key={image.src}
              className={image.layout ? `project-gallery-item--${image.layout}` : undefined}
            >
              <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
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
