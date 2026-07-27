export const site = {
  url: "https://www.thiskeenan.com",
  email: "thiskeenan@gmail.com",
  location: "New York City",
  deck: "https://canva.link/keenangraydirectorsdeckk",
  filmshow: "https://www.filmshow.org/",
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
      "Toy Gun premiered in a warehouse with 130 people, built as a live event around the film.",
    image: "/media/optimized/toy-gun-thumb.jpg",
    alt: "A red-lit still from Toy Gun.",
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
      { provider: "vimeo", id: "1198839445", title: "Toy Gun full film" },
      { provider: "vimeo", id: "1184852787", title: "Toy Gun" },
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
      {
        src: "/media/optimized/toy-gun-mingling.jpg",
        alt: "Guests mingling at the Toy Gun screening.",
        layout: "portrait",
      },
      {
        src: "/media/optimized/toy-gun-poster-event.jpg",
        alt: "Toy Gun poster displayed at the screening.",
        layout: "portrait",
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
      "Story, visual development, concepts, test shoots, and previs.",
    description:
      "Keenan collaborated closely with director Bennett Johnson on story and visual development, contributing to key concepts, test shoots, and previs that shaped the film's final tone and perspective.",
    image: "/media/optimized/fenty-puma.jpg",
    alt: "Thumbnail for FENTY x PUMA.",
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
    summary: "Jim Beam.",
    description: "A Jim Beam commercial.",
    image: "/media/optimized/jim-beam-thumb.jpg",
    alt: "Jim Beam commercial still with a man holding a bottle.",
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
      {
        src: "/media/optimized/jim-beam-tootsie-wide.jpg",
        alt: "Black-and-white Jim Beam still with two performers.",
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
      "A passenger ropes an Uber driver into a rescue mission. Shot by Saturday Night Live cinematographer Andy Kugler and colored by Primetime Emmy Award-winning colorist Elias Nousiopoulos.",
    image: "/media/optimized/seedless-thumb.jpg",
    alt: "A close-up still from Seedless.",
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
      "Filmshow combines short films from local filmmakers and live experimental theater to create a glimpse into the underground scene of New York City.",
    image: "/media/optimized/filmshow-lots-of-people.jpg",
    alt: "Audience seated for Filmshow in a warehouse screening space.",
    categories: ["Live / Cultural"],
    externalUrl: site.filmshow,
    externalLabel: "Visit Filmshow",
    logo: "/filmshow-logo.png",
    logoAlt: "Filmshow",
    gallery: [
      {
        src: "/media/optimized/filmshow-space-live.jpg",
        alt: "The Filmshow space before an event.",
      },
      {
        src: "/media/optimized/filmshow-ladder.jpg",
        alt: "Filmshow performers on and around a ladder.",
      },
      {
        src: "/media/optimized/filmshow-high-five.jpg",
        alt: "Filmshow performers high-fiving beside a ladder.",
        layout: "portrait",
      },
      {
        src: "/media/optimized/filmshow-poster-vol-1.jpg",
        alt: "Filmshow Vol. 1 poster.",
      },
      {
        src: "/media/optimized/filmshow-three-people.jpg",
        alt: "Three Filmshow performers on stage.",
      },
      {
        src: "/media/optimized/filmshow-lots-of-people.jpg",
        alt: "Audience watching Filmshow in a warehouse space.",
      },
      {
        src: "/media/optimized/filmshow-crowd.jpg",
        alt: "A packed Filmshow audience watching a film projected on a wall.",
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
      "A documentary crew takes an in-depth look into the lifestyle of a circus artist.",
    image: "/media/optimized/diabolo-thumb.jpg",
    alt: "A performer concentrating in a still from Diabolo Tamer.",
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
      "After a fight breaks out at their favorite skate park, a group of three friends starts to implode.",
    image: "/media/optimized/sorta-thumb.jpg",
    alt: "A dark still from Sorta Kinda True.",
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
      "Keenan went to circus school. Graduates are supposed to make a demo reel of their skills, so he made a documentary about how bad he was.",
    image: "/media/optimized/archives-cat.jpg",
    alt: "A cat-themed thumbnail from The Archives.",
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
