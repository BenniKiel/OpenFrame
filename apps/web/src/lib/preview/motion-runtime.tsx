"use client";

import dynamic from "next/dynamic";
import type { ReactNode } from "react";

import { isMotionProEnabled } from "./motion-capabilities";
import type { NormalizedBlockMotion } from "./motion-contract";
import { ScrollReveal } from "./motion/scroll-reveal";

const GsapBlockMotion = dynamic(
  () => import("./motion-pro/gsap-block-motion").then((m) => m.GsapBlockMotion),
  { ssr: false },
);

export type BlockMotionProps = NormalizedBlockMotion & {
  children: ReactNode;
};

/**
 * Dispatches between open-core {@link ScrollReveal} and optional GSAP timelines.
 * Pro GSAP code lives under `motion-pro/` and is loaded only when enabled + document opts in.
 */
export function BlockMotion({
  scrollReveal,
  motionEngine,
  timelinePreset,
  scrollTrigger,
  children,
}: BlockMotionProps) {
  const useGsap = isMotionProEnabled() && motionEngine === "gsap" && timelinePreset !== "none";

  if (useGsap) {
    return (
      <GsapBlockMotion
        timelinePreset={timelinePreset as Exclude<typeof timelinePreset, "none">}
        scrollTrigger={scrollTrigger}
      >
        {children}
      </GsapBlockMotion>
    );
  }

  return <ScrollReveal preset={scrollReveal}>{children}</ScrollReveal>;
}
