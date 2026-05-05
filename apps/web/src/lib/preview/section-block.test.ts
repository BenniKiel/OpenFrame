import { describe, expect, it } from "vitest";

import { normalizeSectionProps, sanitizeSectionAnchorId } from "./section-block";

describe("sanitizeSectionAnchorId", () => {
  it("slugifies and strips invalid characters", () => {
    expect(sanitizeSectionAnchorId("Pricing & FAQ")).toBe("Pricing-FAQ");
    expect(sanitizeSectionAnchorId("  foo_bar-baz  ")).toBe("foo_bar-baz");
  });

  it("returns null for empty or invalid-only input", () => {
    expect(sanitizeSectionAnchorId("")).toBeNull();
    expect(sanitizeSectionAnchorId("   ")).toBeNull();
    expect(sanitizeSectionAnchorId("!!!")).toBeNull();
  });
});

describe("normalizeSectionProps", () => {
  it("uses anchorId and falls back to sectionId", () => {
    expect(normalizeSectionProps({ anchorId: "hero" }).anchorId).toBe("hero");
    expect(normalizeSectionProps({ sectionId: "footer", anchorId: "" }).anchorId).toBe("footer");
  });

  it("normalizes scrollReveal", () => {
    expect(normalizeSectionProps({}).scrollReveal).toBe("none");
    expect(normalizeSectionProps({ scrollReveal: "fade-up" }).scrollReveal).toBe("fade-up");
    expect(normalizeSectionProps({ scrollReveal: "bad" }).scrollReveal).toBe("none");
  });

  it("normalizes motion engine and timeline defaults", () => {
    expect(normalizeSectionProps({}).motionEngine).toBe("core");
    expect(normalizeSectionProps({}).timelinePreset).toBe("none");
    expect(normalizeSectionProps({ motionEngine: "gsap" }).motionEngine).toBe("gsap");
  });
});
