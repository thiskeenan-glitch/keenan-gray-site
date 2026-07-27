import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import { WorkGrid } from "../components/WorkGrid";
import { projects, site } from "../data";
import { getImageDimensions } from "../media";
import {
  breadcrumbSchema,
  projectItemListSchema,
  webPageSchema,
  withContext,
} from "../seo";

const workDescription =
  "Explore films, commercials, branded films, Filmshow, and personal work from Keenan Gray, a Brooklyn and New York based film director.";
const workImage = "/media/optimized/toy-gun-thumb.jpg";
const workImageDimensions = getImageDimensions(workImage);

export const metadata: Metadata = {
  title: "Projects | Films, Commercials, and Filmshow",
  description: workDescription,
  alternates: {
    canonical: "/work",
  },
  keywords: [
    "Keenan Gray projects",
    "Brooklyn director portfolio",
    "New York filmmaker work",
    "commercial director portfolio",
    "narrative short films",
    "branded films",
  ],
  openGraph: {
    title: "Projects | Keenan Gray",
    description: workDescription,
    url: `${site.url}/work`,
    images: [
      {
        url: workImage,
        ...workImageDimensions,
        alt: "Toy Gun, a short film directed by Keenan Gray.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Projects | Keenan Gray",
    description: workDescription,
    images: [workImage],
  },
};

export default function WorkPage() {
  return (
    <main id="main" className="page-shell">
      <JsonLd
        data={withContext([
          webPageSchema({
            path: "/work",
            name: "Projects | Keenan Gray",
            description: workDescription,
            type: "CollectionPage",
            primaryImage: workImage,
            mainEntityId: `${site.url}/work#projects`,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Projects", path: "/work" },
          ]),
          projectItemListSchema(projects),
        ])}
      />
      <section className="page-hero archive-hero">
        <h1>Projects</h1>
        <p>Films, commercials, Filmshow, and personal work.</p>
      </section>
      <WorkGrid projects={projects} />
    </main>
  );
}
