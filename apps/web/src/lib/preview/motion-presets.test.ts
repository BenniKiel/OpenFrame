import { describe, expect, it } from "vitest";

import { readScrollReveal, SCROLL_REVEAL_PRESETS } from "./motion-presets";

describe("readScrollReveal", () => {
  it("returns none for missing or invalid values", () => {
    expect(readScrollReveal(undefined)).toBe("none");
    expect(readScrollReveal(null)).toBe("none");
    expect(readScrollReveal(1)).toBe("none");
    expect(readScrollReveal("nope")).toBe("none");
    expect(readScrollReveal(" FADE-UP ")).toBe("fade-up");
  });

  it("accepts every listed preset case-insensitively", () => {
    for (const preset of SCROLL_REVEAL_PRESETS) {
      expect(readScrollReveal(preset)).toBe(preset);
      expect(readScrollReveal(preset.toUpperCase())).toBe(preset);
    }
  });
});
