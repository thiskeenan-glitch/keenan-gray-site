import type { Project, VideoEmbed } from "./data";
import { projects, site, socialLinks } from "./data";
import { getImageDimensions } from "./media";

export const siteTitle = "Keenan Gray | Brooklyn Film Director";
export const siteDescription =
  "Keenan Gray is a Brooklyn and New York based film director making narrative films, cinematic commercials, branded films, and experimental live work.";
export const defaultOgImage = "/media/optimized/hero-donnie-runs.jpg";

export const personId = `${site.url}/#keenan-gray`;
export const websiteId = `${site.url}/#website`;
export const filmshowId = `${site.url}/work/filmshow#filmshow`;

type SchemaValue = Record<string, unknown>;

export function absoluteUrl(pathOrUrl: string) {
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${site.url}${path}`;
}

export function withContext(graph: SchemaValue | SchemaValue[]) {
  return {
    "@context": "https://schema.org",
    "@graph": Array.isArray(graph) ? graph : [graph],
  };
}

export function personSchema(): SchemaValue {
  return {
    "@type": "Person",
    "@id": personId,
    name: "Keenan Gray",
    url: site.url,
    image: absoluteUrl("/media/optimized/about-headshot.jpg"),
    jobTitle: "Film Director",
    description:
      "Keenan Gray is a Brooklyn-based film director and New York filmmaker working across narrative shorts, cinematic commercials, branded films, and experimental live work.",
    email: site.email,
    homeLocation: {
      "@type": "Place",
      name: "Brooklyn, New York",
      address: {
        "@type": "PostalAddress",
        addressLocality: "Brooklyn",
        addressRegion: "NY",
        addressCountry: "US",
      },
    },
    knowsAbout: [
      "Film direction",
      "Commercial direction",
      "Narrative filmmaking",
      "Branded films",
      "Short films",
      "Creative production",
      "Experimental theater",
    ],
    sameAs: [...socialLinks.map((link) => link.href), site.filmshow],
  };
}

export function websiteSchema(): SchemaValue {
  return {
    "@type": "WebSite",
    "@id": websiteId,
    name: "Keenan Gray",
    url: site.url,
    description: siteDescription,
    publisher: { "@id": personId },
    creator: { "@id": personId },
    inLanguage: "en-US",
  };
}

export function filmshowOrganizationSchema(): SchemaValue {
  return {
    "@type": "Organization",
    "@id": filmshowId,
    name: "Filmshow",
    url: site.filmshow,
    founder: { "@id": personId },
    description:
      "Filmshow is a New York live show founded by Keenan Gray that combines short films from local filmmakers and live experimental theater.",
    sameAs: [site.filmshow],
  };
}

export function filmshowEventSeriesSchema(): SchemaValue {
  return {
    "@type": "EventSeries",
    "@id": `${site.url}/work/filmshow#event-series`,
    name: "Filmshow",
    url: absoluteUrl("/work/filmshow"),
    description:
      "Filmshow is a live show that combines short films from local filmmakers and live experimental theater to create a glimpse into the underground scene of New York City.",
    organizer: { "@id": filmshowId },
    founder: { "@id": personId },
    location: {
      "@type": "Place",
      name: "New York City",
      address: {
        "@type": "PostalAddress",
        addressLocality: "New York",
        addressRegion: "NY",
        addressCountry: "US",
      },
    },
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    inLanguage: "en-US",
  };
}

export function webPageSchema({
  path,
  name,
  description,
  type = "WebPage",
  primaryImage,
  mainEntityId,
}: {
  path: string;
  name: string;
  description: string;
  type?: string;
  primaryImage?: string;
  mainEntityId?: string;
}): SchemaValue {
  const url = absoluteUrl(path);

  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    isPartOf: { "@id": websiteId },
    about: { "@id": personId },
    primaryImageOfPage: primaryImage
      ? {
          "@type": "ImageObject",
          url: absoluteUrl(primaryImage),
          ...getImageDimensions(primaryImage),
        }
      : undefined,
    mainEntity: mainEntityId ? { "@id": mainEntityId } : undefined,
    inLanguage: "en-US",
    dateModified: site.lastModified,
  };
}

export function breadcrumbSchema(items: { name: string; path: string }[]): SchemaValue {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function projectItemListSchema(projectList = projects): SchemaValue {
  return {
    "@type": "ItemList",
    "@id": `${site.url}/work#projects`,
    name: "Keenan Gray directing portfolio",
    itemListElement: projectList.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: absoluteUrl(`/work/${project.slug}`),
      name: project.title,
    })),
  };
}

function projectSchemaType(project: Project) {
  if (project.schemaType) return project.schemaType;
  if (project.film) return ["Movie", "CreativeWork"];
  return "CreativeWork";
}

function numericYear(year: string) {
  return /^\d{4}$/.test(year) ? Number(year) : undefined;
}

function projectDate(project: Project) {
  if (project.datePublished) return project.datePublished;
  return /^\d{4}$/.test(project.year) ? `${project.year}-01-01` : undefined;
}

export function projectCreativeWorkSchema(project: Project): SchemaValue {
  const url = absoluteUrl(`/work/${project.slug}`);
  const isFilmshow = project.slug === "filmshow";

  return {
    "@type": projectSchemaType(project),
    "@id": `${url}#creative-work`,
    name: project.title,
    headline: project.metaTitle ?? `${project.title} by Keenan Gray`,
    url,
    description: project.metaDescription ?? project.description,
    abstract: project.description,
    image: {
      "@type": "ImageObject",
      url: absoluteUrl(project.image),
      ...getImageDimensions(project.image),
    },
    genre: project.type,
    keywords: project.keywords,
    creator: { "@id": personId },
    director: project.role.toLowerCase().includes("director") ? { "@id": personId } : undefined,
    author: project.role.toLowerCase().includes("writer") ? { "@id": personId } : undefined,
    editor: project.role.toLowerCase().includes("editor") ? { "@id": personId } : undefined,
    producer: project.role.toLowerCase().includes("producer") ? { "@id": personId } : undefined,
    copyrightYear: numericYear(project.year),
    datePublished: projectDate(project),
    dateModified: project.dateModified ?? site.lastModified,
    inLanguage: "en-US",
    isPartOf: { "@id": websiteId },
    provider: project.client
      ? {
          "@type": "Organization",
          name: project.client,
        }
      : undefined,
    organizer: isFilmshow ? { "@id": filmshowId } : undefined,
    sameAs: project.externalUrl,
  };
}

export function videoObjectSchema(project: Project, embed: VideoEmbed): SchemaValue {
  const url = absoluteUrl(`/work/${project.slug}`);
  const embedUrl =
    embed.provider === "youtube"
      ? `https://www.youtube.com/embed/${embed.id}`
      : `https://player.vimeo.com/video/${embed.id}`;

  return {
    "@type": "VideoObject",
    "@id": `${url}#video-${embed.id}`,
    name: embed.title,
    description: `${embed.title} from ${project.title}, a ${project.type.toLowerCase()} project by Keenan Gray.`,
    thumbnailUrl: [absoluteUrl(project.image)],
    uploadDate: projectDate(project),
    embedUrl,
    url: embedUrl,
    inLanguage: "en-US",
    creator: { "@id": personId },
    director: project.role.toLowerCase().includes("director") ? { "@id": personId } : undefined,
    isPartOf: { "@id": `${url}#creative-work` },
  };
}
