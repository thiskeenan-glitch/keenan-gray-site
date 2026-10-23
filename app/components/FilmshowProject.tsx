import Link from "next/link";
import { FilmshowRecap } from "./FilmshowRecap";
import styles from "./FilmshowProject.module.css";

const root = "/media/filmshow-v1";

export function FilmshowProject() {
  return (
    <div className={styles.page}>
      <section className={styles.hero} aria-labelledby="filmshow-title">
        <div className={styles.topline}><span>Independent films. Live performance.</span><span>Brooklyn, New York</span></div>
        <h1 id="filmshow-title" className={styles.title}><span>FILM</span><span>SHOW</span></h1>
        <FilmshowRecap />
        <div className={styles.credits}><p><span>A project by</span>Keenan Gray</p><p><span>Role</span>Founder / Director</p><p><span>Latest show</span>October 3, 2026</p><a href="https://www.filmshow.org/">Enter Filmshow <span aria-hidden="true">↗</span></a></div>
      </section>

      <section className={styles.manifesto} aria-labelledby="filmshow-idea">
        <p className={styles.kicker}>01 / The idea</p>
        <div className={styles.manifestoGrid}>
          <h2 id="filmshow-idea">A NIGHT<br />OFFLINE.</h2>
          <div className={styles.copy}><p>Short films. Live theater. A little circus. One room in Brooklyn.</p><p>I founded Filmshow to bring films and live performance into the same space. Screenings give way to experimental theater, then back again. The show happens on the screen, on the floor, and in the room around you.</p><a href="https://www.filmshow.org/#experience">Explore the experience <span aria-hidden="true">↗</span></a></div>
        </div>
      </section>

      <section className={styles.room} aria-labelledby="filmshow-room">
        <header className={styles.sectionHead}><div><p className={styles.kicker}>02 / From the latest show</p><h2 id="filmshow-room">IN THE ROOM.</h2></div><p>Volume 1<br />03 October 2026 · Brooklyn<br />225 people came to V1.</p></header>
        <div className={styles.photos}>
          <figure className={styles.screen}><img src={`${root}/screen.jpg`} alt="Audience silhouettes watching a short film on Filmshow's enormous screen" width="1800" height="1199" loading="lazy" /><figcaption><span>01 / On screen</span><span>Short films, seen together.</span></figcaption></figure>
          <figure className={styles.performer}><img src={`${root}/performer.jpg`} alt="A performer with an accordion and camera, his face projected behind him at Volume 1" width="1800" height="1350" loading="lazy" /><figcaption>02 / Off screen</figcaption></figure>
          <figure className={styles.acrobatics}><img src={`${root}/acrobatics.jpg`} alt="Two performers in red balancing on each other's shoulders at Filmshow Volume 1" width="1800" height="1350" loading="lazy" /><figcaption>03 / A little circus</figcaption></figure>
          <div className={styles.photoNote}><p className={styles.kicker}>The space between films</p><p>THE SHOW<br />DOESN’T<br /><em>STOP.</em></p><span>Live performance is part of the program.</span></div>
          <figure className={styles.audience}><img src={`${root}/audience.jpg`} alt="The Volume 1 audience watching the show in a Brooklyn warehouse" width="1800" height="1199" loading="lazy" /><figcaption>04 / All eyes forward</figcaption></figure>
          <figure className={styles.vote}><img src={`${root}/marble-vote.jpg`} alt="An audience member dropping a marble into a tin to vote for their favorite film" width="1800" height="1350" loading="lazy" /><figcaption>05 / The audience decides</figcaption></figure>
        </div>
      </section>

      <section className={styles.format} aria-labelledby="filmshow-format">
        <p className={styles.kicker}>03 / The rhythm of the night</p>
        <h2 id="filmshow-format" className={styles.formatTitle}>SHOW. FILM.<br />SHOW. FILM. <em>VOTE.</em></h2>
        <div className={styles.formatBottom}><p>Theater and circus between short films. At the end, the audience votes for their favorite film with marbles.</p><a href="https://www.filmshow.org/archive/v1">Explore the V1 program <span aria-hidden="true">↗</span></a></div>
      </section>

      <figure className={styles.finalPhoto}><img src={`${root}/applause.jpg`} alt="A packed Filmshow audience smiling and applauding after a performance" width="1800" height="1013" loading="lazy" /><figcaption>Volume 1. A room full of people, a shared experience.</figcaption></figure>
      <section className={styles.closing} aria-labelledby="filmshow-next"><p className={styles.kicker}>The story keeps going</p><h2 id="filmshow-next">BE AT<br />THE NEXT ONE.</h2><div><a className={styles.primaryLink} href="https://www.filmshow.org/">Visit Filmshow <span aria-hidden="true">↗</span></a><a href="https://www.filmshow.org/archive/v1">Revisit Volume 1 <span aria-hidden="true">↗</span></a></div></section>
      <nav className={styles.bottomNav} aria-label="Project navigation"><Link href="/work">← All projects</Link><Link href="/work/diabolo-tamer">Next / Diabolo Tamer →</Link></nav>
    </div>
  );
}
