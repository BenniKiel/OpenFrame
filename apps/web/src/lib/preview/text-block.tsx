import type { CSSProperties } from "react";

import type { BlockProps } from "./block-shared";
import {
  LEADING_CLASS,
  TEXT_TONE_CLASS,
  TRACKING_CLASS,
  type LeadingToken,
  type TextTone,
  type TrackingToken,
} from "./design-tokens";
import { buildTextResponsiveCss, parseTextWhen } from "./typography-responsive";

export type TextRole = "p" | "span";

/** Horizontal alignment (same vocabulary as `heading`). */
export type TextAlign = "start" | "center" | "end";
export type TextSizeScale = "sm" | "base" | "lg" | "xl";

export type NormalizedTextProps = {
  text: string;
  as: TextRole;
  maxWidth: number | null;
  align: TextAlign;
  sizeScale: TextSizeScale | null;
  tone: TextTone;
  leading: LeadingToken;
  tracking: TrackingToken;
};

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function readOptionalPositive(v: unknown): number | null {
  if (v === null || v === undefined || v === "") {
    return null;
  }
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) {
    return null;
  }
  return clamp(Math.round(n), 1, 4000);
}

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
  return "normal";
}

function readAlign(v: unknown): TextAlign {
  const s = typeof v === "string" ? v : "";
  if (s === "center" || s === "end") {
    return s;
  }
  return "start";
}

function readSizeScale(v: unknown): TextSizeScale | null {
  const s = typeof v === "string" ? v : "";
  if (s === "sm" || s === "base" || s === "lg" || s === "xl") {
    return s;
  }
  return null;
}

const ALIGN_CLASS: Record<TextAlign, string> = {
  start: "text-left",
  center: "text-center",
  end: "text-right",
};

const TEXT_SIZE_CLASS: Record<TextSizeScale, string> = {
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
};

/**
 * Coerce `text` block props for rendering and the editor.
 */
export function normalizeTextProps(props: Record<string, unknown>): NormalizedTextProps {
  const text = typeof props.text === "string" ? props.text : "";
  const rawAs = typeof props.as === "string" ? props.as : "";
  const as: TextRole = rawAs === "span" ? "span" : "p";
  const maxWidth = readOptionalPositive(props.maxWidth);
  const align = readAlign(props.align);
  const sizeScale = readSizeScale(props.sizeScale);
  const tone = readTextTone(props.tone);
  const leading = readLeading(props.leading);
  const tracking = readTracking(props.tracking);
  return { text, as, maxWidth, align, sizeScale, tone, leading, tracking };
}

export function defaultTextPropsRecord(): Record<string, unknown> {
  return {
    text: "New text",
    as: "p",
    maxWidth: null,
  };
}

export function TextBlock({ node }: BlockProps) {
  const p = normalizeTextProps(node.props);
  const when = parseTextWhen(node.props.when);
  const responsiveCss = buildTextResponsiveCss(node.id, when);
  const style: CSSProperties = {};
  if (p.maxWidth != null) {
    style.maxWidth = `${p.maxWidth}px`;
  }
  const className = [
    TEXT_SIZE_CLASS[p.sizeScale ?? "base"],
    ALIGN_CLASS[p.align],
    LEADING_CLASS[p.leading],
    TRACKING_CLASS[p.tracking],
    TEXT_TONE_CLASS[p.tone],
    p.maxWidth != null ? "max-w-full" : "",
    p.align === "center" ? "mx-auto" : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (p.as === "span") {
    return (
      <>
        {responsiveCss ? <style>{responsiveCss}</style> : null}
        <span data-of-node-id={node.id} className={className} style={style}>
          {p.text}
        </span>
      </>
    );
  }
  return (
    <>
      {responsiveCss ? <style>{responsiveCss}</style> : null}
      <p data-of-node-id={node.id} className={className} style={style}>
        {p.text}
      </p>
    </>
  );
}
