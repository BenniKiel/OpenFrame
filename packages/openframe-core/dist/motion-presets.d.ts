/** Phase 4 — bounded scroll-reveal presets (canonical JSON on `section` / `frame`). */
export declare const SCROLL_REVEAL_PRESETS: readonly ["none", "fade-up", "fade-in", "slide-left"];
export type ScrollRevealPreset = (typeof SCROLL_REVEAL_PRESETS)[number];
export declare function readScrollReveal(raw: unknown): ScrollRevealPreset;
