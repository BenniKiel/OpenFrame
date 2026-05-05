/**
 * Canonical motion fields on `section` / `frame` (Phase 4).
 * Open-core uses `scrollReveal` + `motionEngine: "core"`.
 * GSAP timelines are gated by {@link isMotionProEnabled} + `motionEngine: "gsap"`.
 */
import { type ScrollRevealPreset } from "./motion-presets";
export declare const MOTION_ENGINES: readonly ["core", "gsap"];
export type MotionEngine = (typeof MOTION_ENGINES)[number];
/** GSAP ScrollTrigger-driven presets (Pro runtime). */
export declare const TIMELINE_PRESETS: readonly ["none", "revealStagger", "heroSequence"];
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
export declare function readMotionEngine(raw: unknown): MotionEngine;
export declare function readTimelinePreset(raw: unknown): TimelinePreset;
export declare function readScrollTrigger(raw: unknown): NormalizedScrollTrigger;
/** Normalizes all motion-related props shared by section and frame blocks. */
export declare function normalizeBlockMotion(props: Record<string, unknown>): NormalizedBlockMotion;
