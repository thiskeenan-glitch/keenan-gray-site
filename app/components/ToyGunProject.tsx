import Link from "next/link";
import type { Project } from "../data";
import { getImageDimensions } from "../media";
import { VideoEmbed } from "./VideoEmbed";
import shared from "./FilmshowProject.module.css";
import styles from "./ToyGunProject.module.css";

export function ToyGunProject({ project }: { project: Project }) {
  const [trailer, film] = project.embeds ?? [];
  return (
    <div className="project-page project-page--toy-gun">
      <section className="project-hero" aria-labelledby="toy-gun-title">
        <img src={project.image} alt={project.alt} {...getImageDimensions(project.image)} sizes="100vw" fetchPriority="high" decoding="async" />
        <div>
          <p className="scarlet project-eyebrow">{project.eyebrow}</p>
          <h1 id="toy-gun-title">{project.title}</h1>
          <dl className="project-meta">
            <div><dt>Role</dt><dd>{project.role}</dd></div>
            <div><dt>Year</dt><dd>{project.year}</dd></div>
            <div><dt>Context</dt><dd>{project.context}</dd></div>
          </dl>
        </div>
      </section>
      <div className={shared.page}>
      <section className={styles.laurels} aria-label="Toy Gun festival selections">
        {project.laurels?.map(laurel => <img key={laurel.src} src={laurel.src} alt={laurel.alt} {...getImageDimensions(laurel.src)} loading="lazy" />)}
      </section>
      {trailer ? <section className={styles.trailerSection} aria-label="Toy Gun trailer"><div className={`${shared.recap} ${styles.trailer}`}><VideoEmbed embed={trailer} /><p className={styles.caption}>01 / The trailer</p></div></section> : null}
      <section className={shared.manifesto} aria-labelledby="toy-gun-story">
        <p className={shared.kicker}>02 / The story</p>
        <div className={shared.manifestoGrid}>
          <h2 id="toy-gun-story">MAKE<br />A WISH.</h2>
          <div className={shared.copy}><p>{project.summary}</p><p>A comedic thriller written, directed, and edited by Keenan Gray.</p><a href="#full-film">Watch Toy Gun <span aria-hidden="true">↓</span></a></div>
        </div>
      </section>
      <figure className={styles.wideStill}><img src="/media/optimized/toy-gun-staircase.jpg" alt="A still from Toy Gun on a staircase" width="1800" height="902" loading="lazy" /></figure>
      {film ? <section id="full-film" className={`${shared.room} ${styles.watch}`} aria-labelledby="toy-gun-watch">
        <header className={shared.sectionHead}><div><p className={shared.kicker}>03 / The full film</p><h2 id="toy-gun-watch">TOY GUN.</h2></div><p>A film by Keenan Gray<br />Comedic thriller · 2026</p></header>
        <div className={styles.fullFilm}><VideoEmbed embed={film} /></div>
      </section> : null}
      <section className={shared.room} aria-labelledby="toy-gun-stills">
        <header className={shared.sectionHead}><div><p className={shared.kicker}>04 / Inside the film</p><h2 id="toy-gun-stills">FAMILY.<br />AT THE END.</h2></div><p>Selected frames<br />Toy Gun / 2026</p></header>
        <div className={styles.stills}>
          {project.gallery?.filter(photo => !photo.src.endsWith("toy-gun-staircase.jpg")).map((photo,index) => <figure key={photo.src}>
            <img src={photo.src} alt={photo.alt} {...getImageDimensions(photo.src)} loading="lazy" />
            <figcaption>0{index + 1} / Toy Gun</figcaption>
          </figure>)}
        </div>
      </section>
      <section className={shared.closing} aria-labelledby="toy-gun-premiere"><p className={shared.kicker}>Off the screen / The premiere</p><div className={styles.premiere}><h2 id="toy-gun-premiere">130 PEOPLE.<br />ONE ROOM.</h2><p>Toy Gun premiered in a New York warehouse with 130 people. A live event built around the film.</p></div><div><a className={shared.primaryLink} href="#full-film">Watch the film <span aria-hidden="true">↑</span></a><Link href="/work/filmshow">Explore Filmshow <span aria-hidden="true">↗</span></Link></div></section>
      <nav className={shared.bottomNav} aria-label="Project navigation"><Link href="/work">← All projects</Link><Link href="/work/jim-beam">Next / Jim Beam →</Link></nav>
      </div>
    </div>
  );
}
