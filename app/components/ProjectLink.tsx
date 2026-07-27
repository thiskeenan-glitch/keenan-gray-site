import Link from "next/link";
import type { Project } from "../data";

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
  return (
    <Link className={`project-link project-link--${size}`} href={`/work/${project.slug}`}>
      <figure>
        <img
          src={project.image}
          alt={project.alt}
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
