import type { CSSProperties } from "react";

import type { BlockProps } from "./block-shared";
import { type AxisSizeMode, readAxisSizeMode } from "./axis-size-mode";
import { normalizeBlockMotion, type NormalizedBlockMotion } from "./motion-contract";
import { BlockMotion } from "./motion-runtime";
import { buildFrameResponsiveCss, parseFrameWhen } from "./frame-responsive";
import { applyFrameFillToStyle, normalizeFrameFill, type NormalizedFrameFill } from "./frame-fill";
import {
  FRAME_SURFACE_CLASS,
  FRAME_SURFACE_FRAME_CHROME,
  cursorToCss,
  formatCssLength,
  type CursorToken,
  type FrameSurface,
  type PointerEventsMode,
  type SizeUnit,
  type UserSelectMode,
  userSelectToCss,
} from "./design-tokens";

/** Framer-style: stack (flex) vs grid. */
export type FrameLayoutType = "stack" | "grid";

/** Framer-style main axis for stack layout. */
export type FrameDirection = "horizontal" | "vertical";

/**
 * @deprecated Legacy `props.layout` values; still read for older page JSON.
 * Prefer `layoutType` + `direction` + `wrap`.
 */
export type FrameLayout = "stack" | "horizontal" | "wrap" | "grid";

/**
 * @deprecated Legacy JSON only — prefer `widthSizeMode` (`fit` ≈ hug, `fill` = fill).
 */
export type FrameWidthMode = "hug" | "fill";

export type FrameAlign = "start" | "center" | "end" | "stretch";

export type FrameJustify = "start" | "center" | "end" | "between" | "evenly";

/** Flow = in document layout (relative box); Absolute = CSS `position: absolute` + optional insets. */
export type FramePositionMode = "flow" | "absolute";

export type FrameOverflow = "visible" | "hidden" | "auto" | "clip" | "scroll";

export type NormalizedFrameProps = {
  layoutType: FrameLayoutType;
  direction: FrameDirection;
  wrap: boolean;
  gap: number;
  padding: number;
  radius: number;
  /** Framer-style width: Fixed (px/vw/vh), Relative (%), Fill, Fit content. */
  widthSizeMode: AxisSizeMode;
  /** Framer-style height: Fixed, Relative, Fill, Fit (auto / intrinsic). */
  heightSizeMode: AxisSizeMode;
  align: FrameAlign;
  justify: FrameJustify;
  columns: number;
  positionMode: FramePositionMode;
  insetTop: number | null;
  insetRight: number | null;
  insetBottom: number | null;
  insetLeft: number | null;
  zIndex: number | null;
  overflow: FrameOverflow;
  /** Phase 1b — semantic surface / colors */
  surface: FrameSurface;
  /** Optional Framer-style background (solid, gradients, image). When set, overrides preset surface `bg-*`. */
  fill: NormalizedFrameFill | null;
  /** Explicit width when `widthSizeValue` + unit ≠ auto (overrides hug/fill width class). */
  widthSizeValue: number | null;
  widthSizeUnit: SizeUnit;
  heightSizeValue: number | null;
  heightSizeUnit: SizeUnit;
  minWidthPx: number | null;
  maxWidthPx: number | null;
  minHeightValue: number | null;
  minHeightUnit: SizeUnit;
  pointerEvents: PointerEventsMode;
  cursor: CursorToken | null;
  userSelect: UserSelectMode;
  /** Framer-style “Visible” — when false, frame is hidden but keeps layout space. */
  visible: boolean;
} & NormalizedBlockMotion;

const LAYOUT_TYPES: readonly FrameLayoutType[] = ["stack", "grid"];
const DIRECTIONS: readonly FrameDirection[] = ["horizontal", "vertical"];

const LEGACY_LAYOUTS: readonly FrameLayout[] = ["stack", "horizontal", "wrap", "grid"];

const OVERFLOWS: readonly FrameOverflow[] = ["visible", "hidden", "auto", "clip", "scroll"];

const SURFACES: readonly FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent"];

const SIZE_UNITS: readonly SizeUnit[] = ["px", "pct", "vw", "vh", "auto"];

const CURSOR_TOKENS: readonly CursorToken[] = ["default", "pointer", "text", "not-allowed", "move"];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function readNumber(v: unknown, fallback: number): number {
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    if (Number.isFinite(x)) {
      return x;
    }
  }
  return fallback;
}

/** Optional inset in px; `null` = CSS `auto` (omit in style). */
function readOptionalInset(v: unknown): number | null {
  if (v === null || v === undefined) {
    return null;
  }
  if (typeof v === "string" && v.trim() === "") {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return clamp(Math.round(v), -99999, 99999);
  }
  if (typeof v === "string") {
    const x = Number(v.trim());
    return Number.isFinite(x) ? clamp(Math.round(x), -99999, 99999) : null;
  }
  return null;
}

function readOptionalZIndex(v: unknown): number | null {
  if (v === null || v === undefined || v === "") {
    return null;
  }
  const n = readNumber(v, NaN);
  if (!Number.isFinite(n)) {
    return null;
  }
  return clamp(Math.round(n), -9999, 99999);
}

function readFrameSurface(v: unknown): FrameSurface {
  const s = typeof v === "string" ? v : "";
  return (SURFACES as readonly string[]).includes(s) ? (s as FrameSurface) : "default";
}

function readSizeUnit(v: unknown, fallback: SizeUnit): SizeUnit {
  const s = typeof v === "string" ? v : "";
  return (SIZE_UNITS as readonly string[]).includes(s) ? (s as SizeUnit) : fallback;
}

function readOptionalSizeValue(v: unknown): number | null {
  if (v === null || v === undefined || v === "") {
    return null;
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return v;
  }
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v.trim());
    return Number.isFinite(x) ? x : null;
  }
  return null;
}

function readOptionalPx(v: unknown): number | null {
  const n = readOptionalSizeValue(v);
  if (n == null) {
    return null;
  }
  return clamp(Math.round(n), 0, 9999);
}

function clampSizeForUnit(value: number, unit: Exclude<SizeUnit, "auto">): number {
  if (unit === "px") {
    return clamp(Math.round(value), 0, 9999);
  }
  return clamp(value, 0, 100);
}

function readPointerEvents(v: unknown): PointerEventsMode {
  return v === "none" ? "none" : "auto";
}

function readCursor(v: unknown): CursorToken | null {
  const s = typeof v === "string" ? v : "";
  if (s === "" || s === "auto") {
    return null;
  }
  return (CURSOR_TOKENS as readonly string[]).includes(s) ? (s as CursorToken) : null;
}

function readUserSelect(v: unknown): UserSelectMode {
  const s = typeof v === "string" ? v : "";
  if (s === "none" || s === "text" || s === "all") {
    return s;
  }
  return "auto";
}

function readVisible(v: unknown): boolean {
  if (v === false || v === "false" || v === 0 || v === "0") {
    return false;
  }
  return true;
}

function deriveLayoutFields(props: Record<string, unknown>): {
  layoutType: FrameLayoutType;
  direction: FrameDirection;
  wrap: boolean;
} {
  const rawType =
    typeof props.layoutType === "string" ? props.layoutType.trim().toLowerCase() : "";
  if (rawType === "grid") {
    return { layoutType: "grid", direction: "vertical", wrap: false };
  }
  if (rawType === "stack") {
    const rawDir =
      typeof props.direction === "string" ? props.direction.trim().toLowerCase() : "";
    const direction: FrameDirection = rawDir === "horizontal" ? "horizontal" : "vertical";
    const wrap = props.wrap === true || props.wrap === "true";
    return { layoutType: "stack", direction, wrap };
  }

  const legacy = typeof props.layout === "string" ? props.layout.trim().toLowerCase() : "";
  if (legacy === "grid") {
    return { layoutType: "grid", direction: "vertical", wrap: false };
  }
  if (legacy === "horizontal") {
    return { layoutType: "stack", direction: "horizontal", wrap: false };
  }
  if (legacy === "wrap") {
    return { layoutType: "stack", direction: "horizontal", wrap: true };
  }
  if (legacy === "stack") {
    return { layoutType: "stack", direction: "vertical", wrap: false };
  }
  return { layoutType: "stack", direction: "vertical", wrap: false };
}

/**
 * Coerce JSON `props` from the document into safe values for rendering and forms.
 */
export function normalizeFrameProps(props: Record<string, unknown>): NormalizedFrameProps {
  const { layoutType, direction, wrap } = deriveLayoutFields(props);

  const gap = clamp(Math.round(readNumber(props.gap, 12)), 0, 256);
  const padding = clamp(Math.round(readNumber(props.padding, 16)), 0, 256);
  const radius = clamp(Math.round(readNumber(props.radius, 8)), 0, 48);
  const columns = clamp(Math.round(readNumber(props.columns, 2)), 1, 12);

  const rawWidthLegacy = typeof props.width === "string" ? props.width.trim().toLowerCase() : "";

  const rawAlign = typeof props.align === "string" ? props.align : "";
  const align: FrameAlign =
    rawAlign === "start" || rawAlign === "center" || rawAlign === "end" || rawAlign === "stretch" ? rawAlign : "stretch";

  const rawJustify = typeof props.justify === "string" ? props.justify : "";
  const justify: FrameJustify =
    rawJustify === "start" ||
    rawJustify === "center" ||
    rawJustify === "end" ||
    rawJustify === "between" ||
    rawJustify === "evenly"
      ? rawJustify
      : "start";

  const rawPos = typeof props.positionMode === "string" ? props.positionMode : "";
  const positionMode: FramePositionMode = rawPos === "absolute" ? "absolute" : "flow";

  const insetTop = readOptionalInset(props.insetTop);
  const insetRight = readOptionalInset(props.insetRight);
  const insetBottom = readOptionalInset(props.insetBottom);
  const insetLeft = readOptionalInset(props.insetLeft);

  const zIndex = readOptionalZIndex(props.zIndex);

  const rawOf = typeof props.overflow === "string" ? props.overflow : "";
  const overflow: FrameOverflow = (OVERFLOWS as readonly string[]).includes(rawOf) ? (rawOf as FrameOverflow) : "visible";

  const visible = readVisible(props.visible);

  const surface = readFrameSurface(props.surface);

  let widthSizeValue = readOptionalSizeValue(props.widthSizeValue);
  let widthSizeUnit = readSizeUnit(props.widthSizeUnit, "auto");
  if (widthSizeValue != null && widthSizeUnit !== "auto") {
    widthSizeValue = clampSizeForUnit(widthSizeValue, widthSizeUnit);
  } else {
    widthSizeValue = null;
  }

  let heightSizeValue = readOptionalSizeValue(props.heightSizeValue);
  let heightSizeUnit = readSizeUnit(props.heightSizeUnit, "auto");
  if (heightSizeValue != null && heightSizeUnit !== "auto") {
    heightSizeValue = clampSizeForUnit(heightSizeValue, heightSizeUnit);
  } else {
    heightSizeValue = null;
  }

  const explicitW = widthSizeValue != null && widthSizeUnit !== "auto";
  const explicitH = heightSizeValue != null && heightSizeUnit !== "auto";

  let widthSizeMode = readAxisSizeMode(props.widthSizeMode);
  if (!widthSizeMode) {
    if (explicitW) {
      widthSizeMode = widthSizeUnit === "pct" ? "relative" : "fixed";
    } else {
      widthSizeMode = rawWidthLegacy === "hug" ? "fit" : "fill";
    }
  } else if (widthSizeMode === "fixed" && explicitW && widthSizeUnit === "pct") {
    widthSizeMode = "relative";
  } else if (widthSizeMode === "relative" && explicitW && widthSizeUnit !== "pct") {
    widthSizeUnit = "pct";
  }

  let heightSizeMode = readAxisSizeMode(props.heightSizeMode);
  if (!heightSizeMode) {
    if (explicitH) {
      heightSizeMode = heightSizeUnit === "pct" ? "relative" : "fixed";
    } else {
      heightSizeMode = "fit";
    }
  } else if (heightSizeMode === "fixed" && explicitH && heightSizeUnit === "pct") {
    heightSizeMode = "relative";
  } else if (heightSizeMode === "relative" && explicitH && heightSizeUnit !== "pct") {
    heightSizeUnit = "pct";
  }

  if ((widthSizeMode === "fixed" || widthSizeMode === "relative") && !explicitW) {
    widthSizeMode = rawWidthLegacy === "hug" ? "fit" : "fill";
  }
  if ((heightSizeMode === "fixed" || heightSizeMode === "relative") && !explicitH) {
    heightSizeMode = "fit";
  }

  const minWidthPx = readOptionalPx(props.minWidthPx);
  const maxWidthPx = readOptionalPx(props.maxWidthPx);

  let minHeightValue = readOptionalSizeValue(props.minHeightValue);
  const minHeightUnit = readSizeUnit(props.minHeightUnit, "vh");
  if (minHeightValue != null && minHeightUnit !== "auto") {
    minHeightValue = clampSizeForUnit(minHeightValue, minHeightUnit);
  } else {
    minHeightValue = null;
  }

  const pointerEvents = readPointerEvents(props.pointerEvents);
  const cursor = readCursor(props.cursor);
  const userSelect = readUserSelect(props.userSelect);

  const fill = normalizeFrameFill(props.fill);
  const motion = normalizeBlockMotion(props);

  return {
    layoutType,
    direction,
    wrap,
    gap,
    padding,
    radius,
    widthSizeMode,
    heightSizeMode,
    align,
    justify,
    columns,
    positionMode,
    insetTop,
    insetRight,
    insetBottom,
    insetLeft,
    zIndex,
    overflow,
    surface,
    fill,
    widthSizeValue,
    widthSizeUnit,
    heightSizeValue,
    heightSizeUnit,
    minWidthPx,
    maxWidthPx,
    minHeightValue,
    minHeightUnit,
    pointerEvents,
    cursor,
    userSelect,
    visible,
    ...motion,
  };
}

const ALIGN_CLASS: Record<FrameAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const JUSTIFY_CLASS: Record<FrameJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
  evenly: "justify-evenly",
};

function frameWidthClass(p: NormalizedFrameProps): string {
  switch (p.widthSizeMode) {
    case "fill":
      return "min-h-0 w-full min-w-0";
    case "fit":
      return "min-h-0 inline-flex w-max max-w-full min-w-0";
    case "fixed":
    case "relative":
      return "min-h-0 min-w-0 max-w-full";
    default:
      return "min-h-0 w-full min-w-0";
  }
}

function frameHeightClass(p: NormalizedFrameProps): string {
  return p.heightSizeMode === "fit" ? "h-auto min-h-0" : "min-h-0";
}

function applyPositionAndStacking(style: CSSProperties, p: NormalizedFrameProps): void {
  if (!p.visible) {
    style.visibility = "hidden";
  }

  if (p.positionMode === "absolute") {
    style.position = "absolute";
    if (p.insetTop != null) {
      style.top = `${p.insetTop}px`;
    }
    if (p.insetRight != null) {
      style.right = `${p.insetRight}px`;
    }
    if (p.insetBottom != null) {
      style.bottom = `${p.insetBottom}px`;
    }
    if (p.insetLeft != null) {
      style.left = `${p.insetLeft}px`;
    }
  } else {
    style.position = "relative";
  }

  if (p.zIndex != null) {
    style.zIndex = p.zIndex;
  }

  if (p.overflow === "clip") {
    style.overflow = "clip";
  } else {
    style.overflow = p.overflow;
  }

  style.pointerEvents = p.pointerEvents;
  const cur = cursorToCss(p.cursor);
  if (cur) {
    style.cursor = cur;
  }
  if (p.userSelect !== "auto") {
    style.userSelect = userSelectToCss(p.userSelect) as CSSProperties["userSelect"];
  }

  if (
    (p.widthSizeMode === "fixed" || p.widthSizeMode === "relative") &&
    p.widthSizeValue != null &&
    p.widthSizeUnit !== "auto"
  ) {
    style.width = formatCssLength(p.widthSizeValue, p.widthSizeUnit);
  }
  if (p.heightSizeMode === "fill") {
    style.height = "100%";
    style.minHeight = 0;
  } else if (
    (p.heightSizeMode === "fixed" || p.heightSizeMode === "relative") &&
    p.heightSizeValue != null &&
    p.heightSizeUnit !== "auto"
  ) {
    style.height = formatCssLength(p.heightSizeValue, p.heightSizeUnit);
  }
  if (p.minWidthPx != null) {
    style.minWidth = `${p.minWidthPx}px`;
  }
  if (p.maxWidthPx != null) {
    style.maxWidth = `${p.maxWidthPx}px`;
    if (p.positionMode === "flow") {
      style.marginLeft = "auto";
      style.marginRight = "auto";
    }
  }
  if (p.minHeightValue != null && p.minHeightUnit !== "auto") {
    style.minHeight = formatCssLength(p.minHeightValue, p.minHeightUnit);
  }
}

/** Default props when inserting a new `frame` in the editor. */
export function defaultFramePropsRecord(): Record<string, unknown> {
  const n = normalizeFrameProps({});
  return {
    layoutType: n.layoutType,
    direction: n.direction,
    wrap: n.wrap,
    gap: n.gap,
    padding: n.padding,
    radius: n.radius,
    widthSizeMode: n.widthSizeMode,
    heightSizeMode: n.heightSizeMode,
    align: n.align,
    justify: n.justify,
    columns: n.columns,
    // positionMode, insets, zIndex, overflow, visible: omitted — `normalizeFrameProps` supplies defaults
  };
}

export function FrameBlock({ node, children }: BlockProps) {
  const p = normalizeFrameProps(node.props);
  const responsiveCss = buildFrameResponsiveCss(node.id, p.layoutType, parseFrameWhen(node.props.when));

  const widthClass = frameWidthClass(p);
  const heightClass = frameHeightClass(p);

  const surfaceClass = p.fill != null ? FRAME_SURFACE_FRAME_CHROME[p.surface] : FRAME_SURFACE_CLASS[p.surface];
  const base = `${surfaceClass}`;

  const alignCls = ALIGN_CLASS[p.align];
  const justifyCls = JUSTIFY_CLASS[p.justify];

  const shellStyle: CSSProperties = {
    padding: `${p.padding}px`,
    borderRadius: `${p.radius}px`,
  };
  applyPositionAndStacking(shellStyle, p);
  applyFrameFillToStyle(shellStyle, p.fill);

  if (p.layoutType === "grid") {
    const inner = (
      <div
        data-of-node-id={node.id}
        className={`${base} ${widthClass} ${heightClass}`}
        style={{
          ...shellStyle,
          display: "grid",
          gridTemplateColumns: `repeat(${p.columns}, minmax(0, 1fr))`,
          gap: `${p.gap}px`,
        }}
      >
        {children}
      </div>
    );
    return (
      <>
        {responsiveCss ? <style dangerouslySetInnerHTML={{ __html: responsiveCss }} /> : null}
        <BlockMotion
          scrollReveal={p.scrollReveal}
          motionEngine={p.motionEngine}
          timelinePreset={p.timelinePreset}
          scrollTrigger={p.scrollTrigger}
        >
          {inner}
        </BlockMotion>
      </>
    );
  }

  const flexDir = p.direction === "vertical" ? "flex-col" : "flex-row";
  const wrapCls = p.wrap ? "flex-wrap" : "flex-nowrap";

  const innerStack = (
    <div
      data-of-node-id={node.id}
      className={`flex ${flexDir} ${wrapCls} ${alignCls} ${justifyCls} ${base} ${widthClass} ${heightClass}`}
      style={{
        ...shellStyle,
        gap: `${p.gap}px`,
      }}
    >
      {children}
    </div>
  );

  return (
    <>
      {responsiveCss ? <style dangerouslySetInnerHTML={{ __html: responsiveCss }} /> : null}
      <BlockMotion
        scrollReveal={p.scrollReveal}
        motionEngine={p.motionEngine}
        timelinePreset={p.timelinePreset}
        scrollTrigger={p.scrollTrigger}
      >
        {innerStack}
      </BlockMotion>
    </>
  );
}

export function isFrameLayoutTypeValue(s: string): s is FrameLayoutType {
  return (LAYOUT_TYPES as readonly string[]).includes(s);
}

/** True for legacy `layout` string values still found in older JSON. */
export function isFrameLayoutValue(s: string): s is FrameLayout {
  return (LEGACY_LAYOUTS as readonly string[]).includes(s);
}
