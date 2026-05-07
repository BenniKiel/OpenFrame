import { describe, expect, it } from "vitest";

import { normalizeCardProps } from "./card-block";

describe("normalizeCardProps", () => {
  it("defaults interaction to none", () => {
    const p = normalizeCardProps({});
    expect(p.interaction).toBe("none");
  });

  it("reads valid interaction", () => {
    const p = normalizeCardProps({ interaction: "lift" });
    expect(p.interaction).toBe("lift");
  });

  it("falls back on invalid interaction", () => {
    const p = normalizeCardProps({ interaction: "zoom" });
    expect(p.interaction).toBe("none");
  });
});
