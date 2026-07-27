import type { Metadata } from "next";
import Link from "next/link";
import { MobileNav } from "./components/MobileNav";
import { ScrollReveal } from "./components/ScrollReveal";
import { site, socialLinks } from "./data";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Keenan Gray | Film Director",
    template: "%s | Keenan Gray",
  },
  description:
    "Keenan Gray. Director and filmmaker in New York City.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Keenan Gray | Film Director",
    description: "Keenan Gray. Director and filmmaker in New York City.",
    url: site.url,
    siteName: "Keenan Gray",
    images: [
      {
        url: "/media/optimized/hero-donnie-runs.jpg",
        width: 1600,
        height: 900,
        alt: "A cinematic still from Keenan Gray's film work.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Keenan Gray | Film Director",
    description: "Keenan Gray. Director and filmmaker in New York City.",
    images: ["/media/optimized/hero-donnie-runs.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = [
    { label: "Projects", href: "/work" },
    { label: "Me", href: "/about" },
  ];

  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.png" type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href="/favicon.png" />
        <link rel="apple-touch-icon" href="/favicon.png" sizes="512x512" />
      </head>
      <body>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header" aria-label="Site header">
          <Link className="wordmark" href="/" aria-label="Keenan Gray home">
            <img
              className="brand-mark"
              src="/bluebird-cowboy.png"
              alt=""
              aria-hidden="true"
            />
            <span>Keenan Gray</span>
          </Link>
          <nav className="desktop-nav" aria-label="Primary navigation">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <MobileNav navItems={navItems} socialLinks={socialLinks} />
        </header>
        <ScrollReveal />
        {children}
        <footer className="site-footer">
          <Link className="footer-wordmark" href="/" aria-label="Keenan Gray home">
            <img
              className="brand-mark"
              src="/bluebird-cowboy.png"
              alt=""
              aria-hidden="true"
            />
            <span>Keenan Gray</span>
          </Link>
          <div>
            {socialLinks.map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noreferrer">
                {link.label}
              </a>
            ))}
          </div>
        </footer>
      </body>
    </html>
  );
}
