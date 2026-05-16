/**
 * Bounded semantic styling for Phase 1b — maps JSON enums to Tailwind classes.
 * Avoid storing raw class strings on `PageNode.props`.
 */

export type FrameSurface = "default" | "muted" | "transparent" | "inverse" | "accent" | "glass";

export type TextTone = "default" | "muted" | "inverse" | "accent";

/** Length units for responsive / explicit sizing (canonical JSON uses `pct` for `%`). */
export type SizeUnit = "px" | "pct" | "vw" | "vh" | "auto";

export type PointerEventsMode = "auto" | "none";

export type CursorToken = "default" | "pointer" | "text" | "not-allowed" | "move";

export type UserSelectMode = "auto" | "none" | "text" | "all";

export type LeadingToken = "normal" | "snug" | "relaxed" | "loose";

export type TrackingToken = "normal" | "tight" | "wide";

export const FRAME_SURFACE_CLASS: Record<FrameSurface, string> = {
  default: "border border-zinc-200/90 bg-white/95 text-zinc-900 shadow-sm ring-1 ring-black/5",
  muted: "border border-zinc-200 bg-zinc-100/95 text-zinc-900 shadow-sm ring-1 ring-black/5",
  transparent: "border border-transparent bg-transparent text-zinc-900 shadow-none ring-0",
  inverse: "border border-zinc-800 bg-zinc-900 text-zinc-50 shadow-md ring-1 ring-white/10",
  accent: "border border-sky-200/80 bg-sky-50/95 text-sky-950 shadow-sm ring-1 ring-sky-500/20",
  glass: "border-b border-white/40 bg-white/60 backdrop-blur-md text-zinc-900 shadow-none ring-0",
};

/**
 * Frame chrome when a custom `fill` sets `background` via inline styles — no preset `bg-*`
 * so gradients/images are visible.
 */
export const FRAME_SURFACE_FRAME_CHROME: Record<FrameSurface, string> = {
  default: "border border-zinc-200/90 bg-transparent text-zinc-900 shadow-sm ring-1 ring-black/5",
  muted: "border border-zinc-200 bg-transparent text-zinc-900 shadow-sm ring-1 ring-black/5",
  transparent: "border border-transparent bg-transparent text-zinc-900 shadow-none ring-0",
  inverse: "border border-zinc-800 bg-transparent text-zinc-50 shadow-md ring-1 ring-white/10",
  accent: "border border-sky-200/80 bg-transparent text-sky-950 shadow-sm ring-1 ring-sky-500/20",
  glass: "border-b border-white/40 bg-white/60 backdrop-blur-md text-zinc-900 shadow-none ring-0",
};

/** Root `container` shell — spacing + surface (Phase 1b). */
export const CONTAINER_SURFACE_CLASS: Record<FrameSurface, string> = {
  default: "bg-white text-zinc-950",
  muted: "bg-zinc-50 text-zinc-950",
  transparent: "bg-transparent text-zinc-950",
  inverse: "bg-zinc-950 text-zinc-50",
  accent: "bg-sky-50 text-sky-950",
  glass: "bg-transparent text-zinc-950",
};

export const TEXT_TONE_CLASS: Record<TextTone, string> = {
  default: "text-zinc-800",
  muted: "text-zinc-500",
  inverse: "text-white",
  accent: "text-sky-700",
};

export const HEADING_TONE_CLASS: Record<TextTone, string> = {
  default: "text-zinc-950",
  muted: "text-zinc-600",
  inverse: "text-white",
  accent: "text-sky-800",
};

export const LEADING_CLASS: Record<LeadingToken, string> = {
  normal: "leading-normal",
  snug: "leading-snug",
  relaxed: "leading-relaxed",
  loose: "leading-loose",
};

export const TRACKING_CLASS: Record<TrackingToken, string> = {
  normal: "tracking-normal",
  tight: "tracking-tight",
  wide: "tracking-wide",
};

/** Maps token to CSS `cursor` when not default. */
export function cursorToCss(c: CursorToken | null): string | undefined {
  if (c == null || c === "default") {
    return undefined;
  }
  const map: Record<Exclude<CursorToken, "default">, string> = {
    pointer: "pointer",
    text: "text",
    "not-allowed": "not-allowed",
    move: "move",
  };
  return map[c];
}

/** Maps token to CSS `user-select`. */
export function userSelectToCss(u: UserSelectMode): string | undefined {
  const map: Record<UserSelectMode, string> = {
    auto: "auto",
    none: "none",
    text: "text",
    all: "all",
  };
  return map[u];
}

export function formatCssLength(value: number, unit: Exclude<SizeUnit, "auto">): string {
  switch (unit) {
    case "px":
      return `${value}px`;
    case "pct":
      return `${value}%`;
    case "vw":
      return `${value}vw`;
    case "vh":
      return `calc(var(--openframe-vh, 1vh) * ${value})`;
    default:
      return `${value}px`;
  }
}
