import type { ElementType } from "react";

import type { BlockProps } from "./block-shared";
import {
  HEADING_TONE_CLASS,
  LEADING_CLASS,
  TRACKING_CLASS,
  type LeadingToken,
  type TextTone,
  type TrackingToken,
} from "./design-tokens";
import { buildHeadingResponsiveCss, parseHeadingWhen } from "./typography-responsive";

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
export type HeadingAlign = "start" | "center" | "end";
export type HeadingSizeScale = "sm" | "base" | "lg" | "xl" | "2xl" | "3xl";

const AS_TAGS = new Set(["h1", "h2", "h3", "h4", "h5", "h6", "p"]);

export type NormalizedHeadingProps = {
  text: string;
  level: HeadingLevel;
  /** Semantic tag override (`h1`–`h6` or `p`); default maps from `level`. */
  asTag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "p";
  align: HeadingAlign;
  sizeScale: HeadingSizeScale | null;
  tone: TextTone;
  leading: LeadingToken;
  tracking: TrackingToken;
};

function readTextTone(v: unknown): TextTone {
  const s = typeof v === "string" ? v : "";
  if (s === "muted" || s === "inverse" || s === "accent") {
    return s;
  }
  return "default";
}

function readLeading(v: unknown): LeadingToken {
  const s = typeof v === "string" ? v : "";
  if (s === "snug" || s === "relaxed" || s === "loose") {
    return s;
  }
  return "normal";
}

function readTracking(v: unknown): TrackingToken {
  const s = typeof v === "string" ? v : "";
  if (s === "tight" || s === "wide") {
    return s;
  }
  return "tight";
}

function clampLevel(v: unknown): HeadingLevel {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) {
    return 2;
  }
  const x = Math.round(n);
  if (x < 1 || x > 6) {
    return 2;
  }
  return x as HeadingLevel;
}

function readSizeScale(v: unknown): HeadingSizeScale | null {
  const s = typeof v === "string" ? v : "";
  if (s === "sm" || s === "base" || s === "lg" || s === "xl" || s === "2xl" || s === "3xl") {
    return s;
  }
  return null;
}

export function normalizeHeadingProps(props: Record<string, unknown>): NormalizedHeadingProps {
  const text = typeof props.text === "string" ? props.text : "";
  const level = clampLevel(props.level);
  const rawAs = typeof props.as === "string" ? props.as.toLowerCase().trim() : "";
  let asTag: NormalizedHeadingProps["asTag"];
  if (rawAs === "" || rawAs === "auto") {
    asTag = (`h${level}` as const) as NormalizedHeadingProps["asTag"];
  } else if (AS_TAGS.has(rawAs)) {
    asTag = rawAs as NormalizedHeadingProps["asTag"];
  } else {
    asTag = (`h${level}` as const) as NormalizedHeadingProps["asTag"];
  }
  const rawAlign = typeof props.align === "string" ? props.align : "";
  const align: HeadingAlign =
    rawAlign === "center" || rawAlign === "end" ? rawAlign : "start";
  const sizeScale = readSizeScale(props.sizeScale);

  const tone = readTextTone(props.tone);
  const leading = readLeading(props.leading);
  const tracking = readTracking(props.tracking);

  return { text, level, asTag, align, sizeScale, tone, leading, tracking };
}

export function defaultHeadingPropsRecord(): Record<string, unknown> {
  return {
    text: "Heading",
    level: 2,
    align: "start",
  };
}

const ALIGN_CLASS: Record<HeadingAlign, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

const LEVEL_SIZE_CLASS: Record<HeadingLevel, string> = {
  1: "text-4xl font-semibold sm:text-5xl",
  2: "text-3xl font-semibold sm:text-4xl",
  3: "text-2xl font-semibold",
  4: "text-xl font-semibold",
  5: "text-lg font-semibold",
  6: "text-base font-semibold",
};

const SCALE_SIZE_CLASS: Record<HeadingSizeScale, string> = {
  sm: "text-xl font-semibold",
  base: "text-2xl font-semibold",
  lg: "text-3xl font-semibold",
  xl: "text-4xl font-semibold",
  "2xl": "text-5xl font-semibold",
  "3xl": "text-6xl font-semibold",
};

export function HeadingBlock({ node }: BlockProps) {
  const p = normalizeHeadingProps(node.props);
  const when = parseHeadingWhen(node.props.when);
  const responsiveCss = buildHeadingResponsiveCss(node.id, when);
  const Tag = p.asTag as ElementType;
  const cls = [
    p.sizeScale ? SCALE_SIZE_CLASS[p.sizeScale] : LEVEL_SIZE_CLASS[p.level],
    HEADING_TONE_CLASS[p.tone],
    LEADING_CLASS[p.leading],
    TRACKING_CLASS[p.tracking],
    ALIGN_CLASS[p.align],
    "max-w-full text-balance",
    p.align === "center" ? "mx-auto" : "",
  ]
    .filter(Boolean)
    .join(" ");
  return (
    <>
      {responsiveCss ? <style>{responsiveCss}</style> : null}
      <Tag data-of-node-id={node.id} className={cls}>
        {p.text}
      </Tag>
    </>
  );
}
