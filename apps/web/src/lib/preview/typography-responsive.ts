import { FRAME_BREAKPOINT_MIN_PX, type FrameBreakpointKey } from "./frame-responsive";
import type { HeadingAlign, HeadingSizeScale } from "./heading-block";
import type { TextAlign, TextSizeScale } from "./text-block";

type HeadingWhenSlice = Partial<{
  align: HeadingAlign;
  sizeScale: HeadingSizeScale;
}>;

type TextWhenSlice = Partial<{
  align: TextAlign;
  sizeScale: TextSizeScale;
}>;

export type HeadingWhenMap = Partial<Record<FrameBreakpointKey, HeadingWhenSlice>>;
export type TextWhenMap = Partial<Record<FrameBreakpointKey, TextWhenSlice>>;

const BP_ORDER: readonly FrameBreakpointKey[] = ["sm", "md", "lg"];

const TEXT_SIZE_REM: Record<TextSizeScale, number> = {
  sm: 0.875,
  base: 1,
  lg: 1.125,
  xl: 1.25,
};

const HEADING_SIZE_REM: Record<HeadingSizeScale, number> = {
  sm: 1.25,
  base: 1.5,
  lg: 1.875,
  xl: 2.25,
  "2xl": 3,
  "3xl": 3.75,
};

function readAlign(v: unknown): "start" | "center" | "end" | undefined {
  return v === "start" || v === "center" || v === "end" ? v : undefined;
}

function readTextSize(v: unknown): TextSizeScale | undefined {
  return v === "sm" || v === "base" || v === "lg" || v === "xl" ? v : undefined;
}

function readHeadingSize(v: unknown): HeadingSizeScale | undefined {
  return v === "sm" || v === "base" || v === "lg" || v === "xl" || v === "2xl" || v === "3xl" ? v : undefined;
}

function cssEscapeAttr(id: string): string {
  return id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

export function parseTextWhen(raw: unknown): TextWhenMap {
  const out: TextWhenMap = {};
  if (!raw || typeof raw !== "object") {
    return out;
  }
  const o = raw as Record<string, unknown>;
  for (const bp of BP_ORDER) {
    const sliceRaw = o[bp];
    if (!sliceRaw || typeof sliceRaw !== "object") {
      continue;
    }
    const s = sliceRaw as Record<string, unknown>;
    const align = readAlign(s.align);
    const sizeScale = readTextSize(s.sizeScale);
    const slice: TextWhenSlice = {};
    if (align) {
      slice.align = align;
    }
    if (sizeScale) {
      slice.sizeScale = sizeScale;
    }
    if (Object.keys(slice).length > 0) {
      out[bp] = slice;
    }
  }
  return out;
}

export function parseHeadingWhen(raw: unknown): HeadingWhenMap {
  const out: HeadingWhenMap = {};
  if (!raw || typeof raw !== "object") {
    return out;
  }
  const o = raw as Record<string, unknown>;
  for (const bp of BP_ORDER) {
    const sliceRaw = o[bp];
    if (!sliceRaw || typeof sliceRaw !== "object") {
      continue;
    }
    const s = sliceRaw as Record<string, unknown>;
    const align = readAlign(s.align);
    const sizeScale = readHeadingSize(s.sizeScale);
    const slice: HeadingWhenSlice = {};
    if (align) {
      slice.align = align;
    }
    if (sizeScale) {
      slice.sizeScale = sizeScale;
    }
    if (Object.keys(slice).length > 0) {
      out[bp] = slice;
    }
  }
  return out;
}

function alignToCss(align: "start" | "center" | "end"): string {
  if (align === "center") {
    return "center";
  }
  if (align === "end") {
    return "right";
  }
  return "left";
}

export function buildTextResponsiveCss(nodeId: string, when: TextWhenMap): string | null {
  const sel = `[data-of-node-id="${cssEscapeAttr(nodeId)}"]`;
  const blocks: string[] = [];
  for (const bp of BP_ORDER) {
    const slice = when[bp];
    if (!slice) {
      continue;
    }
    const rules: string[] = [];
    if (slice.align) {
      rules.push(`text-align: ${alignToCss(slice.align)}`);
    }
    if (slice.sizeScale) {
      rules.push(`font-size: ${TEXT_SIZE_REM[slice.sizeScale]}rem`);
    }
    if (rules.length === 0) {
      continue;
    }
    const min = FRAME_BREAKPOINT_MIN_PX[bp];
    blocks.push(`@media (min-width: ${min}px) { ${sel} { ${rules.join("; ")} !important; } }`);
  }
  return blocks.length > 0 ? blocks.join("\n") : null;
}

export function buildHeadingResponsiveCss(nodeId: string, when: HeadingWhenMap): string | null {
  const sel = `[data-of-node-id="${cssEscapeAttr(nodeId)}"]`;
  const blocks: string[] = [];
  for (const bp of BP_ORDER) {
    const slice = when[bp];
    if (!slice) {
      continue;
    }
    const rules: string[] = [];
    if (slice.align) {
      rules.push(`text-align: ${alignToCss(slice.align)}`);
    }
    if (slice.sizeScale) {
      rules.push(`font-size: ${HEADING_SIZE_REM[slice.sizeScale]}rem`);
    }
    if (rules.length === 0) {
      continue;
    }
    const min = FRAME_BREAKPOINT_MIN_PX[bp];
    blocks.push(`@media (min-width: ${min}px) { ${sel} { ${rules.join("; ")} !important; } }`);
  }
  return blocks.length > 0 ? blocks.join("\n") : null;
}
