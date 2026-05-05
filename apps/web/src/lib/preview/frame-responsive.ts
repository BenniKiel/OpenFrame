/** Min-width breakpoints (px) — aligned with common Tailwind defaults. */
export const FRAME_BREAKPOINT_MIN_PX = {
  sm: 640,
  md: 768,
  lg: 1024,
} as const;

export type FrameBreakpointKey = keyof typeof FRAME_BREAKPOINT_MIN_PX;

export type FrameWhenSlice = Partial<{
  gap: number;
  padding: number;
  columns: number;
  visible: boolean;
}>;

export type FrameWhenMap = Partial<Record<FrameBreakpointKey, FrameWhenSlice>>;

const BP_ORDER: readonly FrameBreakpointKey[] = ["sm", "md", "lg"];

function clampInt(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

function readBool(v: unknown): boolean | undefined {
  if (typeof v === "boolean") {
    return v;
  }
  return undefined;
}

function readGapLike(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) {
    return clampInt(v, 0, 256);
  }
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    if (Number.isFinite(x)) {
      return clampInt(x, 0, 256);
    }
  }
  return undefined;
}

function readColumns(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) {
    return clampInt(v, 1, 12);
  }
  if (typeof v === "string" && v.trim() !== "") {
    const x = Number(v);
    if (Number.isFinite(x)) {
      return clampInt(x, 1, 12);
    }
  }
  return undefined;
}

/** Accepts `props.when` from JSON; unknown keys ignored. */
export function parseFrameWhen(raw: unknown): FrameWhenMap {
  const out: FrameWhenMap = {};
  if (!raw || typeof raw !== "object") {
    return out;
  }
  const o = raw as Record<string, unknown>;
  for (const k of BP_ORDER) {
    const sliceRaw = o[k];
    if (!sliceRaw || typeof sliceRaw !== "object") {
      continue;
    }
    const s = sliceRaw as Record<string, unknown>;
    const slice: FrameWhenSlice = {};
    const g = readGapLike(s.gap);
    if (g != null) {
      slice.gap = g;
    }
    const pad = readGapLike(s.padding);
    if (pad != null) {
      slice.padding = pad;
    }
    const col = readColumns(s.columns);
    if (col != null) {
      slice.columns = col;
    }
    const vis = readBool(s.visible);
    if (vis !== undefined) {
      slice.visible = vis;
    }
    if (Object.keys(slice).length > 0) {
      out[k] = slice;
    }
  }
  return out;
}

function cssEscapeAttr(id: string): string {
  return id.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

/**
 * Scoped CSS for `frame` overrides at sm/md/lg. Uses `!important` so rules beat
 * inline `gap` / `padding` on the frame shell inside the matching viewport.
 */
export function buildFrameResponsiveCss(
  nodeId: string,
  layoutType: "stack" | "grid",
  when: FrameWhenMap,
): string | null {
  const sel = `[data-of-node-id="${cssEscapeAttr(nodeId)}"]`;
  const blocks: string[] = [];

  for (const bp of BP_ORDER) {
    const slice = when[bp];
    if (!slice) {
      continue;
    }
    const rules: string[] = [];
    if (slice.gap != null) {
      rules.push(`gap: ${slice.gap}px`);
    }
    if (slice.padding != null) {
      rules.push(`padding: ${slice.padding}px`);
    }
    if (layoutType === "grid" && slice.columns != null) {
      rules.push(`grid-template-columns: repeat(${slice.columns}, minmax(0, 1fr))`);
    }
    if (slice.visible !== undefined) {
      rules.push(slice.visible ? "visibility: visible" : "visibility: hidden");
    }
    if (rules.length === 0) {
      continue;
    }
    const min = FRAME_BREAKPOINT_MIN_PX[bp];
    blocks.push(`@media (min-width: ${min}px) { ${sel} { ${rules.join("; ")} !important; } }`);
  }

  return blocks.length > 0 ? blocks.join("\n") : null;
}

export function frameWhenIsEmpty(when: FrameWhenMap): boolean {
  return BP_ORDER.every((k) => !when[k] || Object.keys(when[k]!).length === 0);
}

/**
 * Immutable merge helper for the editor: mutates a shallow copy of `props.when[bp]`,
 * then returns the new `when` object or `null` if no overrides remain.
 */
export function mergeFrameWhenBreakpoint(
  currentProps: Record<string, unknown>,
  bp: FrameBreakpointKey,
  mutator: (slice: Record<string, unknown>) => void,
): Record<string, unknown> | null {
  const baseRaw = currentProps.when;
  const base =
    baseRaw && typeof baseRaw === "object" ? { ...(baseRaw as Record<string, unknown>) } : {};
  const prevSlice = base[bp];
  const slice =
    prevSlice && typeof prevSlice === "object" ? { ...(prevSlice as Record<string, unknown>) } : {};
  mutator(slice);
  if (Object.keys(slice).length === 0) {
    delete base[bp];
  } else {
    base[bp] = slice;
  }
  return Object.keys(base).length > 0 ? base : null;
}
