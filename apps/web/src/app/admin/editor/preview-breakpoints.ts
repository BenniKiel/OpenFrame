/** Logical canvas size for the editor draft preview transform (width × height in CSS px). */

export type EditorPreviewBreakpoint = {
  id: string;
  label: string;
  width: number;
  height: number;
  readonly builtIn: boolean;
};

export const BUILTIN_EDITOR_PREVIEW_BREAKPOINTS: readonly EditorPreviewBreakpoint[] = [
  { id: "desktop", label: "Desktop", width: 1920, height: 1080, builtIn: true },
  { id: "tablet", label: "Tablet", width: 834, height: 1112, builtIn: true },
  { id: "mobile", label: "Mobile", width: 390, height: 844, builtIn: true },
] as const;

const CUSTOM_STORAGE_KEY = "openframe.editor.previewBreakpoints.custom.v1";
const ACTIVE_STORAGE_KEY = "openframe.editor.previewBreakpointActiveId.v1";

export type StoredCustomBreakpoint = {
  id: string;
  label: string;
  width: number;
  height: number;
};

function isStoredCustom(x: unknown): x is StoredCustomBreakpoint {
  if (!x || typeof x !== "object") {
    return false;
  }
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.label === "string" &&
    typeof o.width === "number" &&
    typeof o.height === "number" &&
    Number.isFinite(o.width) &&
    Number.isFinite(o.height)
  );
}

export function loadCustomEditorPreviewBreakpoints(): EditorPreviewBreakpoint[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(CUSTOM_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isStoredCustom).map((o) => ({
      id: o.id,
      label: o.label,
      width: o.width,
      height: o.height,
      builtIn: false as const,
    }));
  } catch {
    return [];
  }
}

export function saveCustomEditorPreviewBreakpoints(customs: EditorPreviewBreakpoint[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    const payload: StoredCustomBreakpoint[] = customs
      .filter((b) => !b.builtIn)
      .map((b) => ({ id: b.id, label: b.label, width: b.width, height: b.height }));
    window.localStorage.setItem(CUSTOM_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* noop */
  }
}

export function loadStoredPreviewBreakpointId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const v = window.localStorage.getItem(ACTIVE_STORAGE_KEY);
    return v && v.length > 0 ? v : null;
  } catch {
    return null;
  }
}

export function saveStoredPreviewBreakpointId(id: string): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(ACTIVE_STORAGE_KEY, id);
  } catch {
    /* noop */
  }
}

export const PREVIEW_BP_WIDTH_MIN = 320;
export const PREVIEW_BP_WIDTH_MAX = 8192;
export const PREVIEW_BP_HEIGHT_MIN = 240;
export const PREVIEW_BP_HEIGHT_MAX = 8192;

export function clampPreviewBreakpointDims(
  width: number,
  height: number,
): { width: number; height: number } {
  return {
    width: Math.min(PREVIEW_BP_WIDTH_MAX, Math.max(PREVIEW_BP_WIDTH_MIN, Math.round(width))),
    height: Math.min(PREVIEW_BP_HEIGHT_MAX, Math.max(PREVIEW_BP_HEIGHT_MIN, Math.round(height))),
  };
}

/** Max presets shown inline; active is always first, then others in list order until full. */
export const PREVIEW_BP_INLINE_MAX = 4;

/**
 * Splits breakpoints for a compact toolbar: `inline` always includes the active preset first
 * (if it exists in `all`), then fills with the next presets from `all` until `maxInline`.
 * Remaining presets go to `overflow` (dropdown).
 */
export function splitPreviewBreakpointsForChrome(
  all: readonly EditorPreviewBreakpoint[],
  activeId: string,
  maxInline = PREVIEW_BP_INLINE_MAX,
): { inline: EditorPreviewBreakpoint[]; overflow: EditorPreviewBreakpoint[] } {
  const active = all.find((b) => b.id === activeId);
  const inline: EditorPreviewBreakpoint[] = [];
  const seen = new Set<string>();
  if (active) {
    inline.push(active);
    seen.add(active.id);
  }
  for (const b of all) {
    if (inline.length >= maxInline) {
      break;
    }
    if (!seen.has(b.id)) {
      inline.push(b);
      seen.add(b.id);
    }
  }
  if (inline.length === 0 && all.length > 0) {
    return {
      inline: [...all].slice(0, Math.min(maxInline, all.length)),
      overflow: [...all].slice(Math.min(maxInline, all.length)),
    };
  }
  const overflow = all.filter((b) => !inline.some((i) => i.id === b.id));
  return { inline, overflow };
}
