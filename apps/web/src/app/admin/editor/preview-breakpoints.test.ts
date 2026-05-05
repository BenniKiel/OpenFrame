import { describe, expect, it } from "vitest";

import {
  BUILTIN_EDITOR_PREVIEW_BREAKPOINTS,
  clampPreviewBreakpointDims,
  PREVIEW_BP_HEIGHT_MAX,
  PREVIEW_BP_WIDTH_MAX,
  splitPreviewBreakpointsForChrome,
} from "./preview-breakpoints";

describe("clampPreviewBreakpointDims", () => {
  it("rounds and clamps width and height", () => {
    expect(clampPreviewBreakpointDims(100, 100)).toEqual({ width: 320, height: 240 });
    const hi = clampPreviewBreakpointDims(10000, 9000);
    expect(hi.width).toBe(PREVIEW_BP_WIDTH_MAX);
    expect(hi.height).toBe(PREVIEW_BP_HEIGHT_MAX);
  });

  it("passes through normal desktop size", () => {
    expect(clampPreviewBreakpointDims(1440, 900)).toEqual({ width: 1440, height: 900 });
  });
});

describe("BUILTIN_EDITOR_PREVIEW_BREAKPOINTS", () => {
  it("has three built-in presets", () => {
    expect(BUILTIN_EDITOR_PREVIEW_BREAKPOINTS.length).toBe(3);
    expect(BUILTIN_EDITOR_PREVIEW_BREAKPOINTS.every((b) => b.builtIn)).toBe(true);
  });
});

describe("splitPreviewBreakpointsForChrome", () => {
  it("puts active first and caps inline count", () => {
    const all = [...BUILTIN_EDITOR_PREVIEW_BREAKPOINTS];
    const { inline, overflow } = splitPreviewBreakpointsForChrome(all, "mobile", 2);
    expect(inline.map((b) => b.id)).toEqual(["mobile", "desktop"]);
    expect(overflow.map((b) => b.id)).toEqual(["tablet"]);
  });

  it("returns all inline when list fits", () => {
    const { inline, overflow } = splitPreviewBreakpointsForChrome(BUILTIN_EDITOR_PREVIEW_BREAKPOINTS, "tablet", 4);
    expect(inline.length).toBe(3);
    expect(overflow.length).toBe(0);
  });
});
