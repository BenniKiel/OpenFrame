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

export type TextRole = "p" | "span";

export type NormalizedTextProps = {
  text: string;
  as: TextRole;
  maxWidth: number | null;
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

/**
 * Coerce `text` block props for rendering and the editor.
 */
export function normalizeTextProps(props: Record<string, unknown>): NormalizedTextProps {
  const text = typeof props.text === "string" ? props.text : "";
  const rawAs = typeof props.as === "string" ? props.as : "";
  const as: TextRole = rawAs === "span" ? "span" : "p";
  const maxWidth = readOptionalPositive(props.maxWidth);
  const tone = readTextTone(props.tone);
  const leading = readLeading(props.leading);
  const tracking = readTracking(props.tracking);
  return { text, as, maxWidth, tone, leading, tracking };
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
  const style: CSSProperties = {};
  if (p.maxWidth != null) {
    style.maxWidth = `${p.maxWidth}px`;
  }
  const className = [
    "text-base",
    LEADING_CLASS[p.leading],
    TRACKING_CLASS[p.tracking],
    TEXT_TONE_CLASS[p.tone],
    p.maxWidth != null ? "max-w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");
  if (p.as === "span") {
    return (
      <span data-of-node-id={node.id} className={className} style={style}>
        {p.text}
      </span>
    );
  }
  return (
    <p data-of-node-id={node.id} className={className} style={style}>
      {p.text}
    </p>
  );
}
