/** Phase 4 — bounded scroll-reveal presets (canonical JSON on `section` / `frame`). */
export const SCROLL_REVEAL_PRESETS = ["none", "fade-up", "fade-in", "slide-left"];
export function readScrollReveal(raw) {
    const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
    return SCROLL_REVEAL_PRESETS.includes(s) ? s : "none";
}
