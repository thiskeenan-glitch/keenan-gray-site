import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd } from "./components/JsonLd";
import { MobileNav } from "./components/MobileNav";
import { ScrollReveal } from "./components/ScrollReveal";
import { site, socialLinks } from "./data";
import { getImageDimensions } from "./media";
import {
  defaultOgImage,
  filmshowOrganizationSchema,
  personSchema,
  siteDescription,
  siteTitle,
  websiteSchema,
  withContext,
} from "./seo";
import "./globals.css";

const defaultOgDimensions = getImageDimensions(defaultOgImage);
const brandMarkDimensions = getImageDimensions("/bluebird-cowboy.png");
const faviconHref = "/favicon-cowboy.png?v=20260728";
const googleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;
const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: siteTitle,
    template: "%s | Keenan Gray",
  },
  description: siteDescription,
  applicationName: "Keenan Gray",
  category: "film portfolio",
  creator: "Keenan Gray",
  publisher: "Keenan Gray",
  keywords: [
    "Keenan Gray",
    "film director",
    "commercial director",
    "Brooklyn director",
    "New York filmmaker",
    "narrative director",
    "cinematic commercials",
    "branded films",
    "Filmshow",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: googleVerification
    ? {
        google: googleVerification,
      }
    : undefined,
  openGraph: {
    title: siteTitle,
    description: siteDescription,
    url: site.url,
    siteName: "Keenan Gray",
    images: [
      {
        url: defaultOgImage,
        ...defaultOgDimensions,
        alt: "A cinematic still from Keenan Gray's film work.",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
    images: [defaultOgImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const navItems = [
    { label: "Projects", href: "/work" },
    { label: "Filmshow", href: "/filmshow" },
    { label: "Me", href: "/about" },
  ];

  return (
    <html lang="en">
      <head>
        <link rel="icon" href={faviconHref} type="image/png" sizes="512x512" />
        <link rel="shortcut icon" href={faviconHref} />
        <link rel="apple-touch-icon" href={faviconHref} sizes="512x512" />
        {gaMeasurementId ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
window.dataLayer = window.dataLayer || [];
function gtag(){window.dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${JSON.stringify(gaMeasurementId)});
`,
              }}
            />
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
                gaMeasurementId,
              )}`}
            />
          </>
        ) : null}
      </head>
      <body>
        <JsonLd
          data={withContext([
            personSchema(),
            websiteSchema(),
            filmshowOrganizationSchema(),
          ])}
        />
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="site-header" aria-label="Site header">
          <Link className="wordmark" href="/" aria-label="Keenan Gray home">
            <span>Keenan Gray</span>
          </Link>
          <Link className="header-cowboy-link" href="/" aria-label="Keenan Gray home">
            <img
              className="brand-mark"
              src="/bluebird-cowboy.png"
              alt=""
              width={brandMarkDimensions?.width}
              height={brandMarkDimensions?.height}
              aria-hidden="true"
            />
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
              width={brandMarkDimensions?.width}
              height={brandMarkDimensions?.height}
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
