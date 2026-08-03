export const site = {
  url: "https://www.thiskeenan.com",
  email: "thiskeenan@gmail.com",
  location: "Brooklyn, New York City",
  deck: "https://canva.link/keenangraydirectorsdeckk",
  filmshow: "https://www.filmshow.org/",
  lastModified: "2026-07-27",
};

export const socialLinks = [
  { label: "Newsletter", href: "https://keenangray.substack.com/" },
  { label: "Instagram", href: "https://www.instagram.com/thiskeenan/" },
  { label: "YouTube", href: "https://www.youtube.com/@thiskeenan" },
  { label: "Vimeo", href: "https://vimeo.com/user136506337" },
  { label: "IMDb", href: "https://www.imdb.com/name/nm16096261/" },
];

export type ProjectCategory =
  | "Commercial"
  | "Narrative"
  | "Music Video"
  | "Live / Cultural"
  | "Archive";

export type VideoEmbed = {
  provider: "vimeo" | "youtube";
  id: string;
  title: string;
};

export type Project = {
  slug: string;
  title: string;
  eyebrow: string;
  type: string;
  year: string;
  role: string;
  client?: string;
  context: string;
  summary: string;
  description: string;
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  schemaType?: string | string[];
  datePublished?: string;
  dateModified?: string;
  image: string;
  alt: string;
  categories: ProjectCategory[];
  externalUrl?: string;
  externalLabel?: string;
  logo?: string;
  logoAlt?: string;
  featured?: boolean;
  commercial?: boolean;
  film?: boolean;
  laurels?: { src: string; alt: string }[];
  embeds?: VideoEmbed[];
  gallery?: { src: string; alt: string; caption?: string; layout?: "portrait" }[];
  credits?: string[];
  recognition?: string[];
};

export const projects: Project[] = [
  {
    slug: "toy-gun",
    title: "Toy Gun",
    eyebrow: "Comedic Thriller",
    type: "Comedic Thriller",
    year: "2026",
    role: "Director / Writer / Editor",
    context: "Short film",
    summary: "A family celebrates a birthday while the world ends.",
    description:
      "Toy Gun is a 2026 comedic thriller short directed, written, and edited by Keenan Gray. It premiered in a New York warehouse with 130 people, built as a live event around the film.",
    metaTitle: "Toy Gun Short Film | Keenan Gray Director",
    metaDescription:
      "Toy Gun is a 2026 comedic thriller short film directed, written, and edited by Brooklyn and New York filmmaker Keenan Gray.",
    keywords: [
      "Keenan Gray director",
      "short film director",
      "Brooklyn filmmaker",
      "comedic thriller",
    ],
    schemaType: ["Movie", "CreativeWork"],
    datePublished: "2026-01-01",
    image: "/media/optimized/toy-gun-thumb.jpg",
    alt: "A red-lit Toy Gun short film still directed by Keenan Gray.",
    categories: ["Narrative"],
    featured: true,
    film: true,
    laurels: [
      {
        src: "/media/optimized/toy-gun-laurel-hollyshorts.png",
        alt: "HollyShorts Film Festival official selection 2026.",
      },
      {
        src: "/media/optimized/toy-gun-laurel-riiff.png",
        alt: "Rhode Island International Film Festival official competition 2026.",
      },
      {
        src: "/media/optimized/toy-gun-laurel-omeleto.png",
        alt: "Omeleto official selection 2026.",
      },
    ],
    embeds: [
      { provider: "vimeo", id: "1184852787", title: "Toy Gun Trailer" },
      { provider: "vimeo", id: "1198839445", title: "Toy Gun full film" },
    ],
    gallery: [
      {
        src: "/media/optimized/toy-gun-staircase.jpg",
        alt: "Toy Gun still on a staircase.",
      },
      {
        src: "/media/optimized/toy-gun-three-shot.jpg",
        alt: "Toy Gun still with three characters looking toward a window.",
      },
      {
        src: "/media/optimized/toy-gun-phone-call.jpg",
        alt: "Toy Gun still with characters gathered around a phone call.",
      },
      {
        src: "/media/optimized/toy-gun-chaos.jpg",
        alt: "Toy Gun still with characters moving through outdoor chaos.",
      },
    ],
    recognition: ["HollyShorts", "RIIFF official competition"],
  },
  {
    slug: "fenty-puma",
    title: "FENTY x PUMA",
    eyebrow: "Commercial",
    type: "Commercial",
    year: "2026",
    role: "Story and visual development",
    client: "FENTY x PUMA",
    context: "Commercial development with director Bennett Johnson",
    summary:
      "Cinematic commercial development for FENTY x PUMA.",
    description:
      "Keenan Gray contributed story and visual development for FENTY x PUMA, shaping cinematic commercial concepts, test shoots, and previs with director Bennett Johnson.",
    metaTitle: "FENTY x PUMA Commercial Development | Keenan Gray",
    metaDescription:
      "FENTY x PUMA commercial development by Keenan Gray, a New York filmmaker working on cinematic branded films, concepts, test shoots, and previs.",
    keywords: [
      "commercial director",
      "branded films",
      "cinematic commercials",
      "Keenan Gray",
    ],
    schemaType: "CreativeWork",
    datePublished: "2026-01-01",
    image: "/media/optimized/fenty-puma.jpg",
    alt: "Cinematic still from FENTY x PUMA commercial development by Keenan Gray.",
    categories: ["Commercial"],
    featured: true,
    commercial: true,
    embeds: [{ provider: "vimeo", id: "1098041179", title: "FENTY x PUMA" }],
  },
  {
    slug: "jim-beam",
    title: "Jim Beam",
    eyebrow: "Commercial",
    type: "Commercial",
    year: "2026",
    role: "Director",
    client: "Jim Beam",
    context: "Commercial",
    summary: "Cinematic branded film for Jim Beam.",
    description:
      "A 2026 Jim Beam commercial directed by Keenan Gray, built around a moody cinematic world for the bourbon brand.",
    metaTitle: "Jim Beam Commercial | Keenan Gray Director",
    metaDescription:
      "Jim Beam commercial directed by Keenan Gray, a Brooklyn and New York commercial director creating cinematic branded films.",
    keywords: [
      "Jim Beam commercial",
      "commercial director",
      "branded film director",
      "New York director",
    ],
    schemaType: "CreativeWork",
    datePublished: "2026-01-01",
    image: "/media/optimized/jim-beam-thumb.jpg",
    alt: "Jim Beam commercial still directed by Keenan Gray with a man holding a bottle.",
    categories: ["Commercial"],
    commercial: true,
    embeds: [{ provider: "vimeo", id: "1199512466", title: "Jim Beam" }],
    gallery: [
      {
        src: "/media/optimized/jim-beam-tootsie-close.jpg",
        alt: "Black-and-white Jim Beam still of a man leaning forward.",
      },
      {
        src: "/media/optimized/jim-beam-thumb.jpg",
        alt: "Jim Beam commercial still with a man drinking from a bottle.",
      },
      {
        src: "/media/optimized/jim-beam-logo-still.jpg",
        alt: "Black-and-white Jim Beam commercial still in an alley.",
      },
    ],
  },
  {
    slug: "seedless",
    title: "Seedless",
    eyebrow: "Comedy",
    type: "Comedy",
    year: "2025",
    role: "Director / Writer / Editor",
    context: "Independent short film",
    summary: "A deranged Uber ride. A reckless rescue mission.",
    description:
      "Seedless is a 2025 comedy short directed, written, and edited by Brooklyn filmmaker Keenan Gray. A passenger ropes an Uber driver into a rescue mission. Shot by Saturday Night Live cinematographer Andy Kugler and colored by Primetime Emmy Award-winning colorist Elias Nousiopoulos.",
    metaTitle: "Seedless Comedy Short | Keenan Gray Director",
    metaDescription:
      "Seedless is a 2025 comedy short directed, written, and edited by Brooklyn and New York filmmaker Keenan Gray.",
    keywords: [
      "Keenan Gray director",
      "comedy short film",
      "Brooklyn filmmaker",
      "New York filmmaker",
    ],
    schemaType: ["Movie", "CreativeWork"],
    datePublished: "2025-01-01",
    image: "/media/optimized/seedless-thumb.jpg",
    alt: "Close-up still from Seedless, a comedy short directed by Keenan Gray.",
    categories: ["Narrative"],
    featured: true,
    film: true,
    embeds: [
      { provider: "vimeo", id: "1063261075", title: "Seedless" },
      { provider: "vimeo", id: "1035287546", title: "Seedless trailer" },
    ],
    gallery: [
      { src: "/media/optimized/seedless-thumb.jpg", alt: "Seedless close-up still." },
      { src: "/media/optimized/seedless-wide.jpg", alt: "Wide still from Seedless." },
    ],
    credits: [
      "Directed by Keenan Gray",
      "Cinematography by Andy Kugler",
      "Written by Pete Zipf and Keenan Gray",
      "Starring Joey Lebere, Pete Zipf, and Scarlett Sperduto",
      "Produced by Jonah Biblowitz and Keenan Gray",
      "Sound design by Alex Thiel / Bluebird Studios",
    ],
    recognition: [
      "BAFF official selection",
      "Red Movie Awards - Best Director - France 2026",
      "Flickers semi-finalist",
    ],
  },
  {
    slug: "filmshow",
    title: "Filmshow",
    eyebrow: "Live / Cultural",
    type: "Live / Cultural",
    year: "2026",
    role: "Founder / Director",
    context: "Live short-film show",
    summary: "This is not a festival.",
    description:
      "Filmshow is a live show founded by Keenan Gray that combines short films from local filmmakers and live experimental theater to create a glimpse into the underground scene of New York City.",
    metaTitle: "Filmshow | Keenan Gray Founder and Director",
    metaDescription:
      "Filmshow is Keenan Gray's New York live show combining short films from local filmmakers with live experimental theater.",
    keywords: [
      "Filmshow",
      "New York short films",
      "experimental theater",
      "Keenan Gray",
    ],
    schemaType: "CreativeWork",
    datePublished: "2026-01-01",
    image: "/media/optimized/filmshow-space.jpg",
    alt: "Empty Filmshow warehouse space with a lit projection wall.",
    categories: ["Live / Cultural"],
    externalUrl: site.filmshow,
    externalLabel: "Visit Filmshow",
    logo: "/filmshow-logo.png",
    logoAlt: "Filmshow",
    gallery: [
      {
        src: "/media/optimized/filmshow-ladder.jpg",
        alt: "Filmshow performers on and around a ladder.",
        layout: "portrait",
      },
      {
        src: "/media/optimized/filmshow-crowd.jpg",
        alt: "A packed Filmshow audience watching a film projected on a wall.",
        layout: "portrait",
      },
      {
        src: "/media/optimized/filmshow-high-five.jpg",
        alt: "Filmshow performers high-fiving beside a ladder.",
        layout: "portrait",
      },
      {
        src: "/media/optimized/filmshow-lots-of-people.jpg",
        alt: "Audience watching Filmshow in a warehouse space.",
      },
      {
        src: "/media/optimized/filmshow-three-people.jpg",
        alt: "Three Filmshow performers on stage.",
      },
    ],
  },
  {
    slug: "diabolo-tamer",
    title: "Diabolo Tamer",
    eyebrow: "Mockumentary",
    type: "Mockumentary",
    year: "2025",
    role: "Director / Writer / Editor",
    context: "Independent short film",
    summary:
      "A documentary crew studies the life of a delusional circus artist.",
    description:
      "Diabolo Tamer is a 2025 mockumentary short directed, written, and edited by Keenan Gray, following a documentary crew studying the lifestyle of a delusional circus artist.",
    metaTitle: "Diabolo Tamer Mockumentary | Keenan Gray Director",
    metaDescription:
      "Diabolo Tamer is a 2025 mockumentary short directed, written, and edited by New York filmmaker Keenan Gray.",
    keywords: [
      "mockumentary short",
      "Keenan Gray director",
      "circus film",
      "New York filmmaker",
    ],
    schemaType: ["Movie", "CreativeWork"],
    datePublished: "2025-01-01",
    image: "/media/optimized/diabolo-thumb.jpg",
    alt: "Still from Diabolo Tamer, a mockumentary short directed by Keenan Gray.",
    categories: ["Narrative"],
    featured: true,
    film: true,
    embeds: [
      { provider: "vimeo", id: "955030891", title: "Diabolo Tamer" },
      { provider: "vimeo", id: "935531974", title: "Diabolo Tamer trailer" },
    ],
    gallery: [
      { src: "/media/optimized/diabolo-thumb.jpg", alt: "Still from Diabolo Tamer." },
      { src: "/media/optimized/diabolo-poster.jpg", alt: "Diabolo Tamer poster." },
      { src: "/media/optimized/diabolo-still.jpg", alt: "Behind-the-scenes Diabolo Tamer image." },
    ],
    recognition: ["STTP winner", "CIFF audience award"],
  },
  {
    slug: "sorta-kinda-true",
    title: "Sorta Kinda True",
    eyebrow: "Comedy Short",
    type: "Comedy Short",
    year: "2024",
    role: "Director / Writer / Editor / Producer",
    context: "First major short film",
    summary:
      "A fight at a skate park starts to fracture a once-impenetrable group of friends.",
    description:
      "Sorta Kinda True is a 2024 comedy short directed, written, edited, and produced by Keenan Gray. After a fight breaks out at their favorite skate park, a group of friends starts to implode.",
    metaTitle: "Sorta Kinda True Comedy Short | Keenan Gray",
    metaDescription:
      "Sorta Kinda True is a 2024 comedy short directed, written, edited, and produced by Brooklyn filmmaker Keenan Gray.",
    keywords: [
      "comedy short",
      "Keenan Gray director",
      "writer director editor",
      "Brooklyn filmmaker",
    ],
    schemaType: ["Movie", "CreativeWork"],
    datePublished: "2024-01-01",
    image: "/media/optimized/sorta-thumb.jpg",
    alt: "Dark close-up still from Sorta Kinda True, a comedy short by Keenan Gray.",
    categories: ["Narrative"],
    featured: true,
    film: true,
    embeds: [
      { provider: "vimeo", id: "864041382", title: "Sorta Kinda True" },
      { provider: "vimeo", id: "922684501", title: "Sorta Kinda True trailer" },
    ],
    gallery: [
      { src: "/media/optimized/sorta-thumb.jpg", alt: "Still from Sorta Kinda True." },
      { src: "/media/optimized/sorta-wide.jpg", alt: "Exterior still from Sorta Kinda True." },
      { src: "/media/optimized/sorta-joey.jpg", alt: "Close-up from Sorta Kinda True." },
      { src: "/media/optimized/sorta-beer.jpg", alt: "Beer can still from Sorta Kinda True." },
    ],
    recognition: ["QWFF official selection"],
  },
  {
    slug: "the-archives",
    title: "The Archives",
    eyebrow: "Personal archive",
    type: "Archive",
    year: "Various",
    role: "Filmmaker",
    context: "Early and personal work",
    summary: "Early films and personal work.",
    description:
      "The Archives collect early films, personal work, and circus-school experiments from Keenan Gray, tracing the Brooklyn director's path into narrative filmmaking and creative production.",
    metaTitle: "The Archives | Early Films by Keenan Gray",
    metaDescription:
      "The Archives collect early films and personal work by Keenan Gray, showing the New York director's circus background and filmmaking experiments.",
    keywords: [
      "Keenan Gray filmmaker",
      "personal films",
      "early films",
      "creative production",
    ],
    schemaType: "CreativeWork",
    image: "/media/optimized/archives-cat.jpg",
    alt: "Frame from The Archives, Keenan Gray's early and personal film work.",
    categories: ["Archive"],
    embeds: [
      { provider: "vimeo", id: "555914526", title: "The Climb" },
      { provider: "vimeo", id: "546923327", title: "Miller High Life" },
      { provider: "vimeo", id: "864849826", title: "You're a Cat" },
      { provider: "vimeo", id: "530140070", title: "Bluebird" },
    ],
  },
];

export const filters: (ProjectCategory | "All")[] = [
  "All",
  "Narrative",
  "Commercial",
  "Live / Cultural",
];

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}

export function nextProject(slug: string) {
  const index = projects.findIndex((project) => project.slug === slug);
  if (index === -1) return projects[0];
  return projects[(index + 1) % projects.length];
}
