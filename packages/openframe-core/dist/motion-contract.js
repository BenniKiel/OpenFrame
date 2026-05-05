/**
 * Canonical motion fields on `section` / `frame` (Phase 4).
 * Open-core uses `scrollReveal` + `motionEngine: "core"`.
 * GSAP timelines are gated by {@link isMotionProEnabled} + `motionEngine: "gsap"`.
 */
import { readScrollReveal } from "./motion-presets";
export const MOTION_ENGINES = ["core", "gsap"];
/** GSAP ScrollTrigger-driven presets (Pro runtime). */
export const TIMELINE_PRESETS = ["none", "revealStagger", "heroSequence"];
export function readMotionEngine(raw) {
    const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    return s === "gsap" ? "gsap" : "core";
}
export function readTimelinePreset(raw) {
    const s = typeof raw === "string" ? raw.trim() : "";
    return TIMELINE_PRESETS.includes(s) ? s : "none";
}
const DEFAULT_SCROLL_TRIGGER = {
    start: "top 85%",
    end: "bottom 20%",
    scrub: false,
    once: true,
};
export function readScrollTrigger(raw) {
    if (!raw || typeof raw !== "object") {
        return { ...DEFAULT_SCROLL_TRIGGER };
    }
    const o = raw;
    const start = typeof o.start === "string" && o.start.trim() ? o.start.trim() : DEFAULT_SCROLL_TRIGGER.start;
    const end = typeof o.end === "string" && o.end.trim() ? o.end.trim() : DEFAULT_SCROLL_TRIGGER.end;
    let scrub = DEFAULT_SCROLL_TRIGGER.scrub;
    if (typeof o.scrub === "boolean") {
        scrub = o.scrub;
    }
    else if (typeof o.scrub === "number" && Number.isFinite(o.scrub)) {
        scrub = o.scrub;
    }
    const once = typeof o.once === "boolean" ? o.once : DEFAULT_SCROLL_TRIGGER.once;
    return { start, end, scrub, once };
}
/** Normalizes all motion-related props shared by section and frame blocks. */
export function normalizeBlockMotion(props) {
    return {
        scrollReveal: readScrollReveal(props.scrollReveal),
        motionEngine: readMotionEngine(props.motionEngine),
        timelinePreset: readTimelinePreset(props.timelinePreset),
        scrollTrigger: readScrollTrigger(props.scrollTrigger),
    };
}
