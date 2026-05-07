import { describe, expect, it } from "vitest";

import { buildHeadingResponsiveCss, buildTextResponsiveCss, parseHeadingWhen, parseTextWhen } from "./typography-responsive";

describe("typography-responsive", () => {
  it("parses text when slices", () => {
    const when = parseTextWhen({
      sm: { align: "center" },
      md: { sizeScale: "lg" },
      lg: { align: "end", sizeScale: "xl" },
    });
    expect(when.sm?.align).toBe("center");
    expect(when.md?.sizeScale).toBe("lg");
    expect(when.lg?.align).toBe("end");
  });

  it("parses heading when slices", () => {
    const when = parseHeadingWhen({
      md: { align: "center", sizeScale: "2xl" },
    });
    expect(when.md?.sizeScale).toBe("2xl");
  });

  it("builds scoped text css", () => {
    const css = buildTextResponsiveCss("n1", { md: { align: "center", sizeScale: "lg" } });
    expect(css).toContain('[data-of-node-id="n1"]');
    expect(css).toContain("text-align: center");
    expect(css).toContain("font-size: 1.125rem");
  });

  it("builds scoped heading css", () => {
    const css = buildHeadingResponsiveCss("h1", { lg: { sizeScale: "3xl" } });
    expect(css).toContain("font-size: 3.75rem");
  });
});
