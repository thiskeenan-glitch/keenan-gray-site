import type { MetadataRoute } from "next";
import { projects, site } from "./data";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes: {
    route: string;
    changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
    priority: number;
  }[] = [
    { route: "", changeFrequency: "weekly", priority: 1 },
    { route: "/work", changeFrequency: "weekly", priority: 0.95 },
    { route: "/about", changeFrequency: "monthly", priority: 0.82 },
    { route: "/filmshow", changeFrequency: "monthly", priority: 0.82 },
    { route: "/contact", changeFrequency: "yearly", priority: 0.55 },
  ];

  return [
    ...staticRoutes.map(({ route, changeFrequency, priority }) => ({
      url: `${site.url}${route}`,
      lastModified: new Date(site.lastModified),
      changeFrequency,
      priority,
    })),
    ...projects.map((project) => ({
      url: `${site.url}/work/${project.slug}`,
      lastModified: new Date(
        project.dateModified ?? project.datePublished ?? site.lastModified,
      ),
      changeFrequency: "monthly" as const,
      priority: project.featured ? 0.88 : 0.76,
    })),
  ];
}
