"use client";

import type { CSSProperties } from "react";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../data";
import { getImageDimensions } from "../media";

type FilmshowPhoto = NonNullable<Project["gallery"]>[number];

const clamp = (value: number, min = 0, max = 1) =>
  Math.min(Math.max(value, min), max);

const spiralSteps = [
  { x: -18, y: -9, rotate: -5, scale: 0.94 },
  { x: 14, y: -2, rotate: 4, scale: 0.98 },
  { x: -10, y: 6, rotate: -2, scale: 0.96 },
  { x: 18, y: 12, rotate: 5, scale: 0.92 },
  { x: -17, y: 18, rotate: -4, scale: 0.94 },
  { x: 7, y: 22, rotate: 3, scale: 0.96 },
  { x: -4, y: 27, rotate: -1, scale: 0.92 },
];

export function FilmshowPhotoSequence({ photos }: { photos: FilmshowPhoto[] }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const [progress, setProgress] = useState(-0.05);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateReducedMotion = () => setReducedMotion(media.matches);

    updateReducedMotion();
    media.addEventListener("change", updateReducedMotion);

    return () => media.removeEventListener("change", updateReducedMotion);
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      return;
    }

    const update = () => {
      frameRef.current = null;
      const section = sectionRef.current;

      if (!section) {
        return;
      }

      const rect = section.getBoundingClientRect();
      const travel = Math.max(rect.height - window.innerHeight * 0.86, 1);
      const rawProgress = (window.innerHeight * 0.42 - rect.top) / travel;

      setProgress(rawProgress);
    };

    const requestUpdate = () => {
      if (frameRef.current !== null) {
        return;
      }

      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);

      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [reducedMotion]);

  const boundedProgress = clamp(progress, 0, 1);
  const currentStep = photos.length > 1 ? boundedProgress * (photos.length - 1) : 0;
  const boundaryFade = reducedMotion
    ? 1
    : clamp((progress + 0.08) / 0.16) * clamp((1.08 - progress) / 0.16);

  return (
    <section
      ref={sectionRef}
      className={`filmshow-photos filmshow-photos--sequence${
        reducedMotion ? " filmshow-photos--static" : ""
      }`}
      aria-label="Filmshow photos"
      style={{ "--photo-count": photos.length } as CSSProperties}
    >
      <div className="filmshow-photos-stage">
        {photos.map((photo, index) => {
          const place = spiralSteps[index % spiralSteps.length];
          const dimensions = getImageDimensions(photo.src);
          const distance = Math.abs(currentStep - index);
          const depth = index - currentStep;
          const opacity = reducedMotion
            ? 1
            : clamp(1 - distance * 1.18) * boundaryFade;
          const transform = reducedMotion
            ? undefined
            : `translate(-50%, -50%) translate3d(${place.x}vw, ${
                place.y + depth * 13
              }vh, 0) rotate(${place.rotate + depth * 7}deg) scale(${Math.max(
                0.82,
                place.scale - distance * 0.05,
              )})`;

          return (
            <figure
              key={photo.src}
              className={photo.layout ? `filmshow-photo--${photo.layout}` : undefined}
              style={
                reducedMotion
                  ? undefined
                  : {
                      opacity,
                      transform,
                      zIndex: Math.round(100 - distance * 10),
                    }
              }
            >
              <img
                src={photo.src}
                alt={photo.alt}
                width={dimensions?.width}
                height={dimensions?.height}
                sizes="(max-width: 920px) 90vw, 74vw"
                loading="lazy"
                decoding="async"
              />
            </figure>
          );
        })}
      </div>
    </section>
  );
}
