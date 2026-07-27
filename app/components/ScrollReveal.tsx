"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const revealSelector = [
  ".section-heading",
  ".selected-grid .project-link",
  ".archive-grid .project-link",
  ".film-list .project-link",
  ".personal-statement > *",
  ".commercial-callout > *",
  ".filmshow-band > *",
  ".contact-close > *",
  ".page-hero > *",
  ".filter-bar",
  ".commercial-feature",
  ".capabilities > *",
  ".project-hero > div",
  ".project-laurels img",
  ".project-intro > *",
  ".project-media",
  ".project-gallery figure",
  ".project-details",
  ".next-project > *",
  ".filmshow-hero > div",
  ".filmshow-blurb > *",
  ".filmshow-closing > *",
  ".about-hero > *",
  ".about-strip > *",
  ".contact-form > *",
].join(", ");

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1);

export function ScrollReveal() {
  const pathname = usePathname();

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      return;
    }

    const body = document.body;
    const maxPull = 46;
    let pull = 0;
    let touchY: number | null = null;
    let releaseTimer: number | null = null;

    const maxScroll = () =>
      Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);

    const atTop = () => window.scrollY <= 0;
    const atBottom = () => window.scrollY >= maxScroll() - 1;

    const clearReleaseTimer = () => {
      if (releaseTimer !== null) {
        window.clearTimeout(releaseTimer);
        releaseTimer = null;
      }
    };

    const applyPull = (value: number) => {
      pull = Math.sign(value) * Math.min(Math.abs(value), maxPull);
      body.classList.add("scroll-edge-pulling");
      body.classList.remove("scroll-edge-release");
      body.style.setProperty("--scroll-edge-pull", `${pull.toFixed(2)}px`);
    };

    const releasePull = () => {
      if (Math.abs(pull) < 0.1) {
        return;
      }

      pull = 0;
      body.classList.remove("scroll-edge-pulling");
      body.classList.add("scroll-edge-release");
      body.style.setProperty("--scroll-edge-pull", "0px");
      clearReleaseTimer();
      releaseTimer = window.setTimeout(() => {
        body.classList.remove("scroll-edge-release");
        releaseTimer = null;
      }, 560);
    };

    const pullToward = (direction: 1 | -1, force: number) => {
      const nextPull = direction * Math.min(maxPull, Math.abs(pull) * 0.72 + force);
      applyPull(nextPull);
      clearReleaseTimer();
      releaseTimer = window.setTimeout(releasePull, 120);
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey) {
        return;
      }

      const pullingTop = atTop() && event.deltaY < 0;
      const pullingBottom = atBottom() && event.deltaY > 0;

      if (!pullingTop && !pullingBottom) {
        releasePull();
        return;
      }

      pullToward(pullingTop ? 1 : -1, Math.min(Math.abs(event.deltaY) * 0.18, 14));
    };

    const handleTouchStart = (event: TouchEvent) => {
      touchY = event.touches.length === 1 ? event.touches[0].clientY : null;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (touchY === null || event.touches.length !== 1) {
        return;
      }

      const nextY = event.touches[0].clientY;
      const delta = nextY - touchY;
      touchY = nextY;

      const pullingTop = atTop() && delta > 0;
      const pullingBottom = atBottom() && delta < 0;

      if (!pullingTop && !pullingBottom) {
        releasePull();
        return;
      }

      pullToward(pullingTop ? 1 : -1, Math.min(Math.abs(delta) * 0.46, 12));
    };

    const handleTouchEnd = () => {
      touchY = null;
      releasePull();
    };

    const handleScroll = () => {
      if (pull !== 0 && !atTop() && !atBottom()) {
        releasePull();
      }
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });
    window.addEventListener("touchcancel", handleTouchEnd, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
      window.removeEventListener("touchcancel", handleTouchEnd);
      window.removeEventListener("scroll", handleScroll);
      clearReleaseTimer();
      body.classList.remove("scroll-edge-pulling", "scroll-edge-release");
      body.style.removeProperty("--scroll-edge-pull");
    };
  }, [pathname]);

  useEffect(() => {
    const mark = document.querySelector<HTMLElement>(".wordmark .brand-mark");
    if (!mark) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      mark.style.removeProperty("--cowboy-shift");
      mark.style.removeProperty("--cowboy-rotate");
      mark.style.removeProperty("--cowboy-scale");
      return;
    }

    let frame = 0;

    const updateLogo = () => {
      frame = 0;
      const scroll = window.scrollY;
      const progress = Math.min(scroll / 900, 1);
      const bob = Math.sin(scroll / 42) * 2.8;
      const rotate = Math.sin(scroll / 68) * 8 + progress * 4;
      const scale = 1 + progress * 0.06;

      mark.style.setProperty("--cowboy-shift", `${bob.toFixed(2)}px`);
      mark.style.setProperty("--cowboy-rotate", `${rotate.toFixed(2)}deg`);
      mark.style.setProperty("--cowboy-scale", scale.toFixed(3));
    };

    const handleScroll = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateLogo);
    };

    updateLogo();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, [pathname]);

  useEffect(() => {
    const hero = document.querySelector<HTMLElement>(".hero");
    if (!hero) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const heroVars = [
      "--hero-copy-opacity",
      "--hero-copy-y",
      "--hero-copy-scale",
      "--hero-matte-height",
      "--hero-matte-y",
      "--hero-scrim-opacity",
      "--hero-video-scale",
    ];

    if (prefersReducedMotion) {
      heroVars.forEach((property) => hero.style.removeProperty(property));
      return;
    }

    let frame = 0;

    const updateHero = () => {
      frame = 0;
      const rect = hero.getBoundingClientRect();
      const travel = Math.max(hero.offsetHeight * 0.86, 1);
      const progress = clamp01(-rect.top / travel);
      const eased = progress * progress * (3 - 2 * progress);

      hero.style.setProperty("--hero-copy-opacity", Math.max(0, 1 - progress * 1.34).toFixed(3));
      hero.style.setProperty("--hero-copy-y", `${(-116 * eased).toFixed(2)}px`);
      hero.style.setProperty("--hero-copy-scale", (1 - progress * 0.055).toFixed(3));
      hero.style.setProperty("--hero-matte-height", `${(18 + eased * 78).toFixed(2)}vh`);
      hero.style.setProperty("--hero-matte-y", `${((1 - eased) * 40).toFixed(2)}%`);
      hero.style.setProperty("--hero-scrim-opacity", (0.72 + eased * 0.28).toFixed(3));
      hero.style.setProperty("--hero-video-scale", (1 + eased * 0.035).toFixed(4));
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateHero);
    };

    updateHero();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      heroVars.forEach((property) => hero.style.removeProperty(property));
    };
  }, [pathname]);

  useEffect(() => {
    const targets = Array.from(
      document.querySelectorAll<HTMLElement>(".about-me-section h1, .personal-statement h2 a"),
    );

    if (!targets.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const variableNames = [
      "--me-jiggle-x",
      "--me-jiggle-y",
      "--me-jiggle-rotate",
      "--me-jiggle-scale",
    ];

    if (prefersReducedMotion) {
      targets.forEach((target) => {
        variableNames.forEach((property) => target.style.removeProperty(property));
      });
      return;
    }

    let frame = 0;

    const updateMeMotion = () => {
      frame = 0;

      targets.forEach((target, index) => {
        const rect = target.getBoundingClientRect();
        const center = rect.top + rect.height / 2;
        const proximity = clamp01(
          1 - Math.abs(center - window.innerHeight * 0.48) / Math.max(window.innerHeight * 0.62, 1),
        );
        const phase = (window.scrollY + index * 91) / 38;
        const wobble = Math.sin(phase) * proximity;
        const counterWobble = Math.sin(phase * 0.67 + 1.8) * proximity;
        const baseTilt = target.matches(".about-me-section h1") ? -2.6 : 0;
        const baseX = target.matches(".about-me-section h1") ? -5 : 0;

        target.style.setProperty("--me-jiggle-x", `${(baseX + counterWobble * 4.5).toFixed(2)}px`);
        target.style.setProperty("--me-jiggle-y", `${(wobble * 6).toFixed(2)}px`);
        target.style.setProperty(
          "--me-jiggle-rotate",
          `${(baseTilt + wobble * 1.7 + counterWobble * 0.8).toFixed(2)}deg`,
        );
        target.style.setProperty("--me-jiggle-scale", (1 + Math.sin(phase * 1.2) * proximity * 0.014).toFixed(3));
      });
    };

    const requestUpdate = () => {
      if (frame) {
        return;
      }

      frame = window.requestAnimationFrame(updateMeMotion);
    };

    updateMeMotion();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      if (frame) {
        window.cancelAnimationFrame(frame);
      }

      targets.forEach((target) => {
        variableNames.forEach((property) => target.style.removeProperty(property));
      });
    };
  }, [pathname]);

  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(revealSelector));

    if (!elements.length) {
      return;
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      elements.forEach((element) => element.classList.add("is-revealed"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) {
            return;
          }

          entry.target.classList.add("is-revealed");
          observer.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -12% 0px",
        threshold: 0.12,
      },
    );

    elements.forEach((element, index) => {
      const laurelIndex = element.matches(".project-laurels img")
        ? Array.from(element.parentElement?.querySelectorAll<HTMLElement>("img") ?? []).indexOf(element)
        : -1;

      element.classList.add("reveal-on-scroll");
      element.style.setProperty(
        "--reveal-delay",
        `${laurelIndex >= 0 ? laurelIndex * 150 : Math.min(index % 6, 5) * 70}ms`,
      );
      observer.observe(element);
    });

    return () => observer.disconnect();
  }, [pathname]);

  return null;
}
