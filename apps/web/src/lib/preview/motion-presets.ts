/** Phase 4 — bounded scroll-reveal presets (canonical JSON on `section` / `frame`). */

export const SCROLL_REVEAL_PRESETS = ["none", "fade-up", "fade-in", "slide-left"] as const;

export type ScrollRevealPreset = (typeof SCROLL_REVEAL_PRESETS)[number];

export function readScrollReveal(raw: unknown): ScrollRevealPreset {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return (SCROLL_REVEAL_PRESETS as readonly string[]).includes(s) ? (s as ScrollRevealPreset) : "none";
}
