import type { Metadata } from "next";
import { JsonLd } from "../components/JsonLd";
import { site, socialLinks } from "../data";
import {
  breadcrumbSchema,
  personId,
  webPageSchema,
  withContext,
} from "../seo";

const contactDescription =
  "Contact Keenan Gray for directing inquiries, commercials, branded films, narrative projects, Filmshow, and creative work in Brooklyn and New York.";

export const metadata: Metadata = {
  title: "Contact | Directing Inquiries",
  description: contactDescription,
  alternates: {
    canonical: "/contact",
  },
  keywords: [
    "contact Keenan Gray",
    "director inquiries",
    "commercial director Brooklyn",
    "New York film director",
    "branded film director",
  ],
  openGraph: {
    title: "Contact | Keenan Gray",
    description: contactDescription,
    url: `${site.url}/contact`,
  },
};

export default function ContactPage() {
  const instagram = socialLinks.find((link) => link.label === "Instagram");
  const inquiryHref = `mailto:${site.email}?subject=${encodeURIComponent("Website Inquiry")}`;

  return (
    <main id="main" className="page-shell contact-page">
      <JsonLd
        data={withContext([
          webPageSchema({
            path: "/contact",
            name: "Contact | Keenan Gray",
            description: contactDescription,
            type: "ContactPage",
            mainEntityId: personId,
          }),
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Contact", path: "/contact" },
          ]),
        ])}
      />
      <section className="page-hero contact-hero">
        <p className="scarlet">Contact</p>
        <h1>Contact</h1>
        <p>{site.location}</p>
        <div className="contact-actions">
          <a className="button button-solid" href={inquiryHref}>
            {site.email}
          </a>
          {instagram ? (
            <a className="button" href={instagram.href} target="_blank" rel="noreferrer">
              Instagram
            </a>
          ) : null}
        </div>
      </section>
      <form
        className="contact-form"
        action={inquiryHref}
        method="post"
        encType="text/plain"
      >
        <label>
          <span>Name</span>
          <input name="name" type="text" autoComplete="name" required />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" autoComplete="email" required />
        </label>
        <label>
          <span>What are you making?</span>
          <input name="project" type="text" required />
        </label>
        <label>
          <span>Budget range, optional</span>
          <input name="budget" type="text" />
        </label>
        <label className="full">
          <span>Message</span>
          <textarea name="message" rows={7} required />
        </label>
        <button className="button button-solid" type="submit">
          Send
        </button>
      </form>
    </main>
  );
}
