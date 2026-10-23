"use client";
import { useEffect, useRef, useState } from "react";
import styles from "./FilmshowProject.module.css";

export function FilmshowRecap() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const interacted = useRef(false);
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    // Browsers may require muted autoplay until the visitor interacts.
    void video.play().catch(() => {
      if (cancelled || interacted.current) return;
      video.muted = true;
      setMuted(true);
      void video.play().catch(() => {});
    });
    return () => { cancelled = true; };
  }, []);
  async function toggleSound() {
    const video = videoRef.current;
    if (!video) return;
    interacted.current = true;
    video.muted = !video.muted;
    setMuted(video.muted);
    if (video.paused) {
      try { await video.play(); } catch {
        video.muted = true;
        setMuted(true);
      }
    }
  }
  return (
    <div className={styles.recap}>
      <video ref={videoRef} autoPlay muted={muted} loop playsInline preload="auto"
        poster="/media/filmshow-v1/shadows.jpg" aria-label="Filmshow Volume 1 recap"
        onVolumeChange={(event) => setMuted(event.currentTarget.muted)}>
        <source src="/media/optimized/filmshow-v1-recap.mp4" type="video/mp4" />
      </video>
      <span className={styles.recapTag}>Inside Volume 1</span>
      <button type="button" className={styles.soundToggle} onClick={toggleSound}
        aria-label={muted ? "Unmute video" : "Mute video"}>
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
          <path d="M11 4 5 9H2v6h3l6 5V4Z" />
          {muted ? <path d="m16 9 6 6m0-6-6 6" /> : <><path d="M15 8a6 6 0 0 1 0 8" /><path d="M18 5a10 10 0 0 1 0 14" /></>}
        </svg>
        <span>{muted ? "Sound on" : "Mute"}</span>
      </button>
    </div>
  );
}
