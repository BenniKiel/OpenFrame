/**
 * Canonical motion fields on `section` / `frame` (Phase 4).
 * Open-core uses `scrollReveal` + `motionEngine: "core"`.
 * GSAP timelines are gated by {@link isMotionProEnabled} + `motionEngine: "gsap"`.
 */

import { readScrollReveal, type ScrollRevealPreset } from "./motion-presets";

export const MOTION_ENGINES = ["core", "gsap"] as const;
export type MotionEngine = (typeof MOTION_ENGINES)[number];

/** GSAP ScrollTrigger-driven presets (Pro runtime). */
export const TIMELINE_PRESETS = ["none", "revealStagger", "heroSequence"] as const;
export type TimelinePreset = (typeof TIMELINE_PRESETS)[number];

export type NormalizedScrollTrigger = {
  /** Passed to ScrollTrigger `start` (e.g. `"top 85%"`). */
  start: string;
  /** Passed to ScrollTrigger `end` (e.g. `"bottom 20%"`). */
  end: string;
  /** `false` = one-shot on enter; number = scrub lag in seconds. */
  scrub: boolean | number;
  /** If true, animation does not reset when scrolling back up. */
  once: boolean;
};

export type NormalizedBlockMotion = {
  scrollReveal: ScrollRevealPreset;
  motionEngine: MotionEngine;
  timelinePreset: TimelinePreset;
  scrollTrigger: NormalizedScrollTrigger;
};

export function readMotionEngine(raw: unknown): MotionEngine {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return s === "gsap" ? "gsap" : "core";
}

export function readTimelinePreset(raw: unknown): TimelinePreset {
  const s = typeof raw === "string" ? raw.trim() : "";
  return (TIMELINE_PRESETS as readonly string[]).includes(s) ? (s as TimelinePreset) : "none";
}

const DEFAULT_SCROLL_TRIGGER: NormalizedScrollTrigger = {
  start: "top 85%",
  end: "bottom 20%",
  scrub: false,
  once: true,
};

export function readScrollTrigger(raw: unknown): NormalizedScrollTrigger {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_SCROLL_TRIGGER };
  }
  const o = raw as Record<string, unknown>;
  const start =
    typeof o.start === "string" && o.start.trim() ? o.start.trim() : DEFAULT_SCROLL_TRIGGER.start;
  const end = typeof o.end === "string" && o.end.trim() ? o.end.trim() : DEFAULT_SCROLL_TRIGGER.end;

  let scrub: boolean | number = DEFAULT_SCROLL_TRIGGER.scrub;
  if (typeof o.scrub === "boolean") {
    scrub = o.scrub;
  } else if (typeof o.scrub === "number" && Number.isFinite(o.scrub)) {
    scrub = o.scrub;
  }

  const once = typeof o.once === "boolean" ? o.once : DEFAULT_SCROLL_TRIGGER.once;

  return { start, end, scrub, once };
}

/** Normalizes all motion-related props shared by section and frame blocks. */
export function normalizeBlockMotion(props: Record<string, unknown>): NormalizedBlockMotion {
  return {
    scrollReveal: readScrollReveal(props.scrollReveal),
    motionEngine: readMotionEngine(props.motionEngine),
    timelinePreset: readTimelinePreset(props.timelinePreset),
    scrollTrigger: readScrollTrigger(props.scrollTrigger),
  };
}
