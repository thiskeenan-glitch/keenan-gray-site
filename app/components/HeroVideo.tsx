"use client";

import { useEffect, useRef, useState } from "react";

export function HeroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.muted = muted;
  }, [muted]);

  useEffect(() => {
    const video = videoRef.current;
    const hero = video?.closest(".hero");

    if (!video || !hero) {
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.2) {
          video.muted = true;
          setMuted(true);
        }
      },
      { threshold: [0, 0.2] },
    );

    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  const toggleSound = () => {
    const video = videoRef.current;

    if (!video) {
      return;
    }

    const nextMuted = !video.muted;
    video.muted = nextMuted;
    setMuted(nextMuted);

    if (!nextMuted) {
      video.play().catch(() => {
        video.muted = true;
        setMuted(true);
      });
    }
  };

  return (
    <>
      <video
        ref={videoRef}
        className="hero-video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        poster="/media/optimized/hero-donnie-runs-centered.jpg"
        aria-label="Toy Gun trailer background"
      >
        <source src="/media/optimized/toy-gun-trailer-home.mp4" type="video/mp4" />
      </video>
      <button
        className="hero-audio-toggle"
        type="button"
        aria-pressed={!muted}
        onClick={toggleSound}
      >
        {muted ? "Unmute" : "Mute"}
      </button>
    </>
  );
}
