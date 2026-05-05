"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useLayoutEffect, useRef, type ReactNode } from "react";

import type { NormalizedScrollTrigger, TimelinePreset } from "../motion-contract";

gsap.registerPlugin(ScrollTrigger);

export type GsapBlockMotionProps = {
  timelinePreset: Exclude<TimelinePreset, "none">;
  scrollTrigger: NormalizedScrollTrigger;
  children: ReactNode;
};

/**
 * GSAP + ScrollTrigger timelines — only loaded when Motion Pro is enabled and blocks opt into `motionEngine: "gsap"`.
 * Keep all `gsap` imports inside `motion-pro/` so open-core bundles can omit this chunk when Pro is disabled at runtime.
 */
export function GsapBlockMotion({ timelinePreset, scrollTrigger, children }: GsapBlockMotionProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = rootRef.current;
    if (!el || typeof window === "undefined") {
      return;
    }

    const reduced =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      return;
    }

    if (typeof ScrollTrigger === "undefined") {
      return;
    }

    const scrub =
      scrollTrigger.scrub === false ? false : scrollTrigger.scrub === true ? true : scrollTrigger.scrub;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: scrollTrigger.start,
        end: scrollTrigger.end,
        scrub,
        once: scrollTrigger.once,
      },
    });

    if (timelinePreset === "revealStagger") {
      const kids = Array.from(el.children);
      if (kids.length > 0) {
        tl.from(kids, {
          opacity: 0,
          y: 24,
          stagger: 0.08,
          duration: 0.55,
          ease: "power2.out",
        });
      } else {
        tl.from(el, { opacity: 0, y: 20, duration: 0.5, ease: "power2.out" });
      }
    } else {
      /* heroSequence */
      tl.from(el, { opacity: 0, y: 40, duration: 0.65, ease: "power3.out" });
    }

    return () => {
      tl.scrollTrigger?.kill();
      tl.kill();
    };
  }, [
    timelinePreset,
    scrollTrigger.start,
    scrollTrigger.end,
    scrollTrigger.scrub,
    scrollTrigger.once,
  ]);

  return (
    <div ref={rootRef} className="max-w-full min-w-0" data-of-gsap-motion={timelinePreset}>
      {children}
    </div>
  );
}
