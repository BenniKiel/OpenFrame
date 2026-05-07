import { describe, expect, it } from "vitest";

import { FAQ_MAX_ITEMS, normalizeFaqProps } from "./faq-block";

describe("normalizeFaqProps", () => {
  it("applies defaults for empty props", () => {
    const p = normalizeFaqProps({});
    expect(p.surface).toBe("default");
    expect(p.items.length).toBeGreaterThanOrEqual(1);
  });

  it("reads surface and items", () => {
    const p = normalizeFaqProps({
      surface: "inverse",
      items: [
        { question: " Q1 ", answer: " A1 " },
        { question: "Q2", answer: "A2" },
      ],
    });
    expect(p.surface).toBe("inverse");
    expect(p.items).toEqual([
      { question: "Q1", answer: "A1" },
      { question: "Q2", answer: "A2" },
    ]);
  });

  it("caps item count", () => {
    const many = Array.from({ length: FAQ_MAX_ITEMS + 10 }, (_, i) => ({
      question: `q${i}`,
      answer: `a${i}`,
    }));
    const p = normalizeFaqProps({ items: many });
    expect(p.items).toHaveLength(FAQ_MAX_ITEMS);
  });

  it("drops invalid entries and falls back to one blank row when nothing usable", () => {
    const p = normalizeFaqProps({ items: [{ foo: 1 }, null, "x"] });
    expect(p.items).toEqual([{ question: "", answer: "" }]);
  });
});
