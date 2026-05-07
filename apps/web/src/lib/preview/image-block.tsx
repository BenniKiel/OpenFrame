import type { CSSProperties } from "react";

import { type AxisSizeMode, readAxisSizeMode } from "./axis-size-mode";
import type { BlockProps } from "./block-shared";
import { formatCssLength, type SizeUnit } from "./design-tokens";

export type ImageFit = "cover" | "contain" | "fill" | "none";

/** Units allowed for width/height on images (`auto` not used — omit dimension instead). */
export type ImageDimensionUnit = Exclude<SizeUnit, "auto">;

export type NormalizedImageProps = {
  src: string;
  alt: string;
  /** Corner radius in px (`null` = default ~8px rounded card look). */
  radiusPx: number | null;
  widthSizeMode: AxisSizeMode;
  heightSizeMode: AxisSizeMode;
  width: number | null;
  widthUnit: ImageDimensionUnit;
  height: number | null;
  heightUnit: ImageDimensionUnit;
  fit: ImageFit;
};

const FITS: readonly ImageFit[] = ["cover", "contain", "fill", "none"];

const DIM_UNITS: readonly ImageDimensionUnit[] = ["px", "pct", "vw", "vh"];

function readDim(v: unknown): number | null {
  if (v === null || v === undefined || v === "") {
    return null;
  }
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n) || n <= 0) {
    return null;
  }
  return Math.min(Math.round(n * 1000) / 1000, 8192);
}

function readDimUnit(v: unknown, fallback: ImageDimensionUnit): ImageDimensionUnit {
  const s = typeof v === "string" ? v : "";
  return (DIM_UNITS as readonly string[]).includes(s) ? (s as ImageDimensionUnit) : fallback;
}

/** `radius` / `radiusPx` from JSON — clamped px for `border-radius`. */
function readRadiusPx(props: Record<string, unknown>): number | null {
  const raw = props.radiusPx ?? props.radius;
  if (raw === null || raw === undefined || raw === "") {
    return null;
  }
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) {
    return null;
  }
  return Math.min(64, Math.max(0, Math.round(n)));
}

function clampDim(value: number, unit: ImageDimensionUnit): number {
  if (unit === "px") {
    return Math.min(Math.max(value, 0), 9999);
  }
  return Math.min(Math.max(value, 0), 100);
}

export function normalizeImageProps(props: Record<string, unknown>): NormalizedImageProps {
  const src = typeof props.src === "string" ? props.src : "";
  const alt = typeof props.alt === "string" ? props.alt : "";
  const radiusPx = readRadiusPx(props);
  let width = readDim(props.width);
  let widthUnit = readDimUnit(props.widthUnit, "px");
  let height = readDim(props.height);
  let heightUnit = readDimUnit(props.heightUnit, "px");
  if (width != null) {
    width = clampDim(width, widthUnit);
  }
  if (height != null) {
    height = clampDim(height, heightUnit);
  }
  const rawFit = typeof props.fit === "string" ? props.fit : "";
  const fit: ImageFit = (FITS as readonly string[]).includes(rawFit) ? (rawFit as ImageFit) : "cover";

  const explicitW = width != null;
  const explicitH = height != null;

  let widthSizeMode = readAxisSizeMode(props.widthSizeMode);
  if (!widthSizeMode) {
    if (explicitW) {
      widthSizeMode = widthUnit === "pct" ? "relative" : "fixed";
    } else {
      widthSizeMode = "fill";
    }
  } else if (widthSizeMode === "fixed" && explicitW && widthUnit === "pct") {
    widthSizeMode = "relative";
  } else if (widthSizeMode === "relative" && explicitW && widthUnit !== "pct") {
    widthUnit = "pct";
  }

  let heightSizeMode = readAxisSizeMode(props.heightSizeMode);
  if (!heightSizeMode) {
    if (explicitH) {
      heightSizeMode = heightUnit === "pct" ? "relative" : "fixed";
    } else {
      heightSizeMode = "fit";
    }
  } else if (heightSizeMode === "fixed" && explicitH && heightUnit === "pct") {
    heightSizeMode = "relative";
  } else if (heightSizeMode === "relative" && explicitH && heightUnit !== "pct") {
    heightUnit = "pct";
  }

  if ((widthSizeMode === "fixed" || widthSizeMode === "relative") && !explicitW) {
    widthSizeMode = "fill";
  }
  if ((heightSizeMode === "fixed" || heightSizeMode === "relative") && !explicitH) {
    heightSizeMode = "fit";
  }

  return {
    src,
    alt,
    radiusPx,
    widthSizeMode,
    heightSizeMode,
    width,
    widthUnit,
    height,
    heightUnit,
    fit,
  };
}

export function defaultImagePropsRecord(): Record<string, unknown> {
  return {
    src: "https://placehold.co/1200x630/e4e4e7/18181b?text=OpenFrame",
    alt: "Placeholder image",
    radiusPx: null,
    widthSizeMode: "fill",
    heightSizeMode: "fit",
    width: null,
    widthUnit: "px",
    height: null,
    heightUnit: "px",
    fit: "cover",
  };
}

const OBJECT_FIT: Record<ImageFit, CSSProperties["objectFit"]> = {
  cover: "cover",
  contain: "contain",
  fill: "fill",
  none: "none",
};

function applyImageSizing(style: CSSProperties, p: NormalizedImageProps): void {
  switch (p.widthSizeMode) {
    case "fill":
      style.width = "100%";
      style.maxWidth = "100%";
      break;
    case "fit":
      style.width = "auto";
      style.maxWidth = "100%";
      break;
    case "fixed":
    case "relative":
      if (p.width != null) {
        style.width = formatCssLength(p.width, p.widthUnit);
        style.maxWidth = "100%";
      }
      break;
    default:
      style.width = "100%";
      style.maxWidth = "100%";
  }

  switch (p.heightSizeMode) {
    case "fill":
      style.height = "100%";
      style.minHeight = 0;
      break;
    case "fit":
      style.height = "auto";
      break;
    case "fixed":
    case "relative":
      if (p.height != null) {
        style.height = formatCssLength(p.height, p.heightUnit);
      }
      break;
    default:
      style.height = "auto";
  }
}

export function ImageBlock({ node }: BlockProps) {
  const p = normalizeImageProps(node.props);
  const style: CSSProperties = {
    objectFit: OBJECT_FIT[p.fit],
    borderRadius: p.radiusPx != null ? `${p.radiusPx}px` : "0.5rem",
  };
  applyImageSizing(style, p);

  if (!p.src) {
    return (
      <div
        data-of-node-id={node.id}
        className="flex min-h-[120px] items-center justify-center rounded-lg border border-dashed border-zinc-300 bg-zinc-100 text-sm text-zinc-500"
      >
        Missing image URL
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary agent URLs; avoid remotePatterns sprawl in MVP
    <img
      data-of-node-id={node.id}
      src={p.src}
      alt={p.alt}
      className="shadow-sm ring-1 ring-black/5"
      style={style}
      loading="lazy"
      decoding="async"
    />
  );
}
