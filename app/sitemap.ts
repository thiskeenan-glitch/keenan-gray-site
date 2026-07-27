import type { MetadataRoute } from "next";
import { projects, site } from "./data";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = ["", "/work", "/about", "/filmshow", "/contact"];
  const projectRoutes = projects.map((project) => `/work/${project.slug}`);

  return [...staticRoutes, ...projectRoutes].map((route) => ({
    url: `${site.url}${route}`,
    lastModified: new Date("2026-07-17"),
    changeFrequency: route.startsWith("/work") ? "monthly" : "yearly",
    priority: route === "" ? 1 : 0.7,
  }));
}
