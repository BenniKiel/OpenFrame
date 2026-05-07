import { describe, expect, it } from "vitest";

import { normalizeTextProps } from "./text-block";

describe("normalizeTextProps", () => {
  it("defaults to base scale when sizeScale missing", () => {
    const p = normalizeTextProps({});
    expect(p.sizeScale).toBeNull();
  });

  it("reads valid sizeScale", () => {
    const p = normalizeTextProps({ sizeScale: "lg" });
    expect(p.sizeScale).toBe("lg");
  });

  it("rejects invalid sizeScale", () => {
    const p = normalizeTextProps({ sizeScale: "huge" });
    expect(p.sizeScale).toBeNull();
  });
});
