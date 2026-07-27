import Link from "next/link";

export default function NotFound() {
  return (
    <main id="main" className="page-shell">
      <section className="page-hero">
        <p className="scarlet">404</p>
        <h1>This frame is missing.</h1>
        <Link className="button button-solid" href="/work">
          Back to Work
        </Link>
      </section>
    </main>
  );
}
