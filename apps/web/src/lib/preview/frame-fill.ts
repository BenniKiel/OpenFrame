import type { CSSProperties } from "react";

export type FrameFillImageFit = "cover" | "contain" | "fill" | "none";

export type NormalizedFrameFill =
  | { kind: "solid"; color: string; opacity: number }
  | { kind: "linear"; angle: number; stops: { color: string; position: number }[] }
  | { kind: "radial"; stops: { color: string; position: number }[]; shape: "circle" | "ellipse" }
  | { kind: "conic"; angle: number; stops: { color: string; position: number }[] }
  | { kind: "image"; src: string; fit: FrameFillImageFit; position: string };

const IMAGE_FITS: readonly FrameFillImageFit[] = ["cover", "contain", "fill", "none"];

function clamp01(n: number): number {
  return Math.min(1, Math.max(0, n));
}

function clampAngle(n: number): number {
  return Math.min(720, Math.max(-720, n));
}

/** Accepts `#rgb`, `#rrggbb`; returns canonical `#rrggbb` or null. */
export function normalizeHexColor(s: string): string | null {
  const t = s.trim();
  const bare = t.startsWith("#") ? t.slice(1) : t;
  if (!/^[0-9a-fA-F]{3}([0-9a-fA-F]{3})?$/.test(bare)) {
    return null;
  }
  if (bare.length === 3) {
    const r = bare[0];
    const g = bare[1];
    const b = bare[2];
    return `#${r}${r}${g}${g}${b}${b}`.toLowerCase();
  }
  return `#${bare.toLowerCase()}`;
}

export function hexToRgba(hex: string, opacity: number): string {
  const n = normalizeHexColor(hex);
  const a = clamp01(opacity);
  if (!n) {
    return `rgba(0,0,0,${a})`;
  }
  const r = parseInt(n.slice(1, 3), 16);
  const g = parseInt(n.slice(3, 5), 16);
  const b = parseInt(n.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function readOpacity(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return clamp01(Math.abs(v) > 1 ? v / 100 : v);
  }
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v.trim().replace(/%/g, ""));
    if (Number.isFinite(x)) {
      return clamp01(Math.abs(x) > 1 ? x / 100 : x);
    }
  }
  return clamp01(fallback);
}

function parseStops(raw: unknown, colorLoose: boolean): { color: string; position: number }[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    return [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 100 },
    ];
  }
  const out: { color: string; position: number }[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") {
      continue;
    }
    const o = item as Record<string, unknown>;
    const rawC = typeof o.color === "string" ? o.color : "#000000";
    const color = colorLoose ? (rawC.trim() === "" ? "#000000" : rawC.trim()) : (normalizeHexColor(rawC) ?? "#000000");
    let pos = 0;
    if (typeof o.position === "number" && Number.isFinite(o.position)) {
      pos = Math.min(100, Math.max(0, o.position));
    } else if (typeof o.position === "string" && o.position.trim() !== "") {
      const n = Number(o.position.replace(/%/g, ""));
      pos = Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : 0;
    }
    out.push({ color, position: pos });
  }
  if (out.length < 2) {
    return [
      { color: "#000000", position: 0 },
      { color: "#ffffff", position: 100 },
    ];
  }
  return out.sort((a, b) => a.position - b.position);
}

function isSafeBackgroundImageUrl(url: string): boolean {
  const u = url.trim();
  return /^https:\/\//i.test(u) || /^data:image\/(png|jpeg|jpg|gif|webp);base64,/i.test(u);
}

/** Escape for use inside CSS `url("...")`. */
function cssUrlValue(url: string): string {
  return url.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function stopsToCssLinear(stops: { color: string; position: number }[]): string {
  return stops.map((s) => `${hexToRgba(s.color, 1)} ${s.position}%`).join(", ");
}

function stopsToCssConic(stops: { color: string; position: number }[]): string {
  return stops.map((s) => `${hexToRgba(s.color, 1)} ${(s.position / 100) * 360}deg`).join(", ");
}

export type NormalizeFrameFillOptions = {
  /**
   * When true, keep partial hex colors, incomplete https URLs, etc. — for editor bound inputs.
   * Preview/render should use strict (default) normalization.
   */
  editor?: boolean;
};

/**
 * Parses `props.fill` from page JSON. Returns `null` = use preset `surface` background only.
 */
export function normalizeFrameFill(raw: unknown, options?: NormalizeFrameFillOptions): NormalizedFrameFill | null {
  const editor = options?.editor === true;

  if (raw == null || typeof raw !== "object") {
    return null;
  }
  const o = raw as Record<string, unknown>;
  const t = typeof o.type === "string" ? o.type.trim().toLowerCase() : "";

  switch (t) {
    case "solid": {
      const colorRaw = typeof o.color === "string" ? o.color : "#000000";
      const trimmed = colorRaw.trim();
      const color = editor ? (trimmed === "" ? "#000000" : trimmed) : (normalizeHexColor(colorRaw) ?? "#000000");
      const opacity = readOpacity(o.opacity, 1);
      return { kind: "solid", color, opacity };
    }
    case "linear": {
      const angle = typeof o.angle === "number" && Number.isFinite(o.angle) ? clampAngle(o.angle) : 180;
      const stops = parseStops(o.stops, editor);
      return { kind: "linear", angle, stops };
    }
    case "radial": {
      const shape =
        typeof o.shape === "string" && o.shape.trim().toLowerCase() === "ellipse" ? "ellipse" : "circle";
      const stops = parseStops(o.stops, editor);
      return { kind: "radial", stops, shape };
    }
    case "conic":
    case "angular": {
      const angle = typeof o.angle === "number" && Number.isFinite(o.angle) ? clampAngle(o.angle) : 0;
      const stops = parseStops(o.stops, editor);
      return { kind: "conic", angle, stops };
    }
    case "image": {
      const src = typeof o.src === "string" ? o.src : "";
      if (editor) {
        const fitRaw = typeof o.fit === "string" ? o.fit.trim().toLowerCase() : "";
        const fit = (IMAGE_FITS as readonly string[]).includes(fitRaw) ? (fitRaw as FrameFillImageFit) : "cover";
        const position = typeof o.position === "string" && o.position.trim() !== "" ? o.position.trim() : "center";
        return { kind: "image", src, fit, position };
      }
      if (!src || !isSafeBackgroundImageUrl(src)) {
        return null;
      }
      const fitRaw = typeof o.fit === "string" ? o.fit.trim().toLowerCase() : "";
      const fit = (IMAGE_FITS as readonly string[]).includes(fitRaw) ? (fitRaw as FrameFillImageFit) : "cover";
      const position = typeof o.position === "string" && o.position.trim() !== "" ? o.position.trim() : "center";
      return { kind: "image", src, fit, position };
    }
    default:
      return null;
  }
}

const BG_SIZE: Record<FrameFillImageFit, string> = {
  cover: "cover",
  contain: "contain",
  fill: "100% 100%",
  none: "auto",
};

/**
 * Writes `background*` properties. Call after base layout styles; clears conflicting props.
 */
export function applyFrameFillToStyle(style: CSSProperties, fill: NormalizedFrameFill | null): void {
  if (!fill) {
    return;
  }

  style.backgroundRepeat = "no-repeat";
  style.backgroundClip = "padding-box";

  switch (fill.kind) {
    case "solid":
      style.backgroundColor = hexToRgba(fill.color, fill.opacity);
      style.backgroundImage = "none";
      return;
    case "linear": {
      style.backgroundColor = "transparent";
      const s = stopsToCssLinear(fill.stops);
      style.backgroundImage = `linear-gradient(${fill.angle}deg, ${s})`;
      style.backgroundSize = "auto";
      return;
    }
    case "radial": {
      style.backgroundColor = "transparent";
      const s = stopsToCssLinear(fill.stops);
      style.backgroundImage = `radial-gradient(${fill.shape}, ${s})`;
      style.backgroundSize = "auto";
      return;
    }
    case "conic": {
      style.backgroundColor = "transparent";
      const parts = stopsToCssConic(fill.stops);
      style.backgroundImage = `conic-gradient(from ${fill.angle}deg, ${parts})`;
      style.backgroundSize = "auto";
      return;
    }
    case "image": {
      if (!isSafeBackgroundImageUrl(fill.src)) {
        return;
      }
      style.backgroundColor = "transparent";
      style.backgroundImage = `url("${cssUrlValue(fill.src)}")`;
      style.backgroundSize = BG_SIZE[fill.fit];
      style.backgroundPosition = fill.position;
      return;
    }
    default:
      return;
  }
}
