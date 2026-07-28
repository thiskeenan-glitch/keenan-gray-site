import Link from "next/link";
import type { Project } from "../data";
import { getImageDimensions } from "../media";

type ProjectLinkProps = {
  project: Project;
  size?: "large" | "small" | "wide";
  priority?: boolean;
};

export function ProjectLink({
  project,
  size = "large",
  priority = false,
}: ProjectLinkProps) {
  const dimensions = getImageDimensions(project.image);
  const mp4 = "video/mp4";
  const videoThumbnailSources =
    project.slug === "toy-gun"
      ? [
          { src: "/media/optimized/toy-gun-thumb-video.mp4?v=20260728", type: mp4 },
        ]
      : project.slug === "fenty-puma"
        ? [{ src: "/media/optimized/fenty-puma-thumb-video.mp4?v=20260728", type: mp4 }]
        : project.slug === "jim-beam"
          ? [{ src: "/media/optimized/jim-beam-thumb-video.mp4?v=20260728", type: mp4 }]
        : project.slug === "seedless"
          ? [{ src: "/media/optimized/seedless-thumb-video.mp4?v=20260728", type: mp4 }]
        : project.slug === "diabolo-tamer"
          ? [{ src: "/media/optimized/diabolo-tamer-thumb-video.mp4?v=20260728", type: mp4 }]
        : project.slug === "sorta-kinda-true"
          ? [{ src: "/media/optimized/sorta-kinda-true-thumb-video.mp4?v=20260728", type: mp4 }]
          : project.slug === "filmshow"
            ? [{ src: "/media/optimized/filmshow-thumb-video.mp4?v=20260728", type: mp4 }]
            : project.slug === "the-archives"
              ? [{ src: "/media/optimized/archives-thumb-video.mp4?v=20260728", type: mp4 }]
          : null;

  return (
    <Link
      className={`project-link project-link--${size} project-link--${project.slug}`}
      href={`/work/${project.slug}`}
    >
      <figure>
        {videoThumbnailSources ? (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            poster={project.image}
            width={dimensions?.width}
            height={dimensions?.height}
            aria-label={project.alt}
          >
            {videoThumbnailSources.map((source) => (
              <source
                key={source.src}
                src={source.src}
                type={source.type}
                media={source.media}
              />
            ))}
          </video>
        ) : (
          <img
            src={project.image}
            alt={project.alt}
            width={dimensions?.width}
            height={dimensions?.height}
            sizes={size === "small" ? "(max-width: 920px) 100vw, 33vw" : "(max-width: 920px) 100vw, 50vw"}
            loading={priority ? "eager" : "lazy"}
            decoding="async"
            fetchPriority={priority ? "high" : "auto"}
          />
        )}
        <figcaption>
          <span>{project.title}</span>
          <small>
            {project.type} / {project.year} / {project.role}
          </small>
        </figcaption>
      </figure>
    </Link>
  );
}
