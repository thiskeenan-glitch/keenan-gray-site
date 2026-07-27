import type { Metadata } from "next";
import { WorkGrid } from "../components/WorkGrid";
import { projects } from "../data";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Projects by Keenan Gray.",
  alternates: {
    canonical: "/work",
  },
};

export default function WorkPage() {
  return (
    <main id="main" className="page-shell">
      <section className="page-hero archive-hero">
        <h1>Projects</h1>
        <p>Films, commercials, Filmshow, and personal work.</p>
      </section>
      <WorkGrid projects={projects} />
    </main>
  );
}
