import { describe, expect, it } from "vitest";

import {
  MOTION_ENGINES,
  normalizeBlockMotion,
  readMotionEngine,
  readScrollTrigger,
  readTimelinePreset,
  TIMELINE_PRESETS,
} from "./motion-contract";

describe("readMotionEngine", () => {
  it("defaults to core", () => {
    expect(readMotionEngine(undefined)).toBe("core");
    expect(readMotionEngine("")).toBe("core");
    expect(readMotionEngine("gsap")).toBe("gsap");
    expect(readMotionEngine("GSAP")).toBe("gsap");
  });

  it("lists engines", () => {
    expect(MOTION_ENGINES).toContain("core");
    expect(MOTION_ENGINES).toContain("gsap");
  });
});

describe("readTimelinePreset", () => {
  it("defaults to none", () => {
    expect(readTimelinePreset(undefined)).toBe("none");
    expect(readTimelinePreset("bad")).toBe("none");
  });

  it("accepts presets", () => {
    for (const p of TIMELINE_PRESETS) {
      expect(readTimelinePreset(p)).toBe(p);
    }
  });
});

describe("readScrollTrigger", () => {
  it("uses defaults", () => {
    expect(readScrollTrigger(undefined)).toEqual({
      start: "top 85%",
      end: "bottom 20%",
      scrub: false,
      once: true,
    });
  });

  it("reads partial object", () => {
    expect(
      readScrollTrigger({
        start: "top 70%",
        scrub: 0.5,
        once: false,
      }),
    ).toEqual({
      start: "top 70%",
      end: "bottom 20%",
      scrub: 0.5,
      once: false,
    });
  });
});

describe("normalizeBlockMotion", () => {
  it("merges motion fields", () => {
    expect(normalizeBlockMotion({})).toMatchObject({
      scrollReveal: "none",
      motionEngine: "core",
      timelinePreset: "none",
      scrollTrigger: expect.objectContaining({ start: "top 85%" }),
    });
  });
});
