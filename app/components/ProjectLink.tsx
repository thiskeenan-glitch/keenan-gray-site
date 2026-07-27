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

  return (
    <Link
      className={`project-link project-link--${size} project-link--${project.slug}`}
      href={`/work/${project.slug}`}
    >
      <figure>
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
