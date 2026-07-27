"use client";

import { useMemo, useState } from "react";
import { filters, type Project, type ProjectCategory } from "../data";
import { ProjectLink } from "./ProjectLink";

type Filter = ProjectCategory | "All";

export function WorkGrid({ projects }: { projects: Project[] }) {
  const [active, setActive] = useState<Filter>("All");
  const visible = useMemo(
    () =>
      active === "All"
        ? projects
        : projects.filter((project) => project.categories.includes(active)),
    [active, projects],
  );

  return (
    <section className="archive-section" aria-label="Project archive">
      <div className="filter-bar" role="tablist" aria-label="Filter work">
        {filters.map((filter) => (
          <button
            key={filter}
            type="button"
            className={filter === active ? "is-active" : ""}
            aria-pressed={filter === active}
            onClick={() => setActive(filter)}
          >
            {filter}
          </button>
        ))}
      </div>
      <div className="archive-grid">
        {visible.map((project, index) => (
          <ProjectLink
            key={project.slug}
            project={project}
            priority={index < 2}
          />
        ))}
      </div>
    </section>
  );
}
