import { describe, expect, it } from "vitest";

import { buildFrameResponsiveCss, mergeFrameWhenBreakpoint, parseFrameWhen } from "./frame-responsive";

describe("parseFrameWhen", () => {
  it("returns empty for non-object", () => {
    expect(parseFrameWhen(null)).toEqual({});
    expect(parseFrameWhen("x")).toEqual({});
  });

  it("parses md gap and padding", () => {
    expect(parseFrameWhen({ md: { gap: 40, padding: 12 } })).toEqual({
      md: { gap: 40, padding: 12 },
    });
  });
});

describe("mergeFrameWhenBreakpoint", () => {
  it("returns null when all breakpoints cleared", () => {
    const cur = { when: { md: { gap: 8 } } };
    const next = mergeFrameWhenBreakpoint(cur, "md", (s) => {
      delete s.gap;
    });
    expect(next).toBeNull();
  });

  it("merges slices per breakpoint", () => {
    const next = mergeFrameWhenBreakpoint({}, "sm", (s) => {
      s.gap = 10;
    });
    expect(next).toEqual({ sm: { gap: 10 } });
  });
});

describe("buildFrameResponsiveCss", () => {
  it("emits min-width rules for grid columns", () => {
    const css = buildFrameResponsiveCss("n1", "grid", parseFrameWhen({ lg: { columns: 3, gap: 8 } }));
    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain("[data-of-node-id=\"n1\"]");
    expect(css).toContain("grid-template-columns: repeat(3, minmax(0, 1fr))");
    expect(css).toContain("gap: 8px");
  });

  it("omits columns for stack layout", () => {
    const css = buildFrameResponsiveCss("n2", "stack", parseFrameWhen({ md: { columns: 4, gap: 4 } }));
    expect(css).toContain("gap: 4px");
    expect(css).not.toContain("grid-template-columns");
  });
});
