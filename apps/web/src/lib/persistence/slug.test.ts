import { describe, expect, it } from "vitest";

import { isSafePageSlug, RESERVED_PAGE_SLUGS } from "./slug";

describe("isSafePageSlug", () => {
  it("accepts typical slugs", () => {
    expect(isSafePageSlug("home")).toBe(true);
    expect(isSafePageSlug("about-us")).toBe(true);
    expect(isSafePageSlug("Page2")).toBe(true);
  });

  it("rejects empty and unsafe segments", () => {
    expect(isSafePageSlug("")).toBe(false);
    expect(isSafePageSlug("a/b")).toBe(false);
    expect(isSafePageSlug("..x")).toBe(false);
    expect(isSafePageSlug("-bad")).toBe(false);
  });

  it("rejects framework- and studio-reserved slugs (case-insensitive)", () => {
    for (const reserved of RESERVED_PAGE_SLUGS) {
      expect(isSafePageSlug(reserved)).toBe(false);
      expect(isSafePageSlug(reserved.toUpperCase())).toBe(false);
    }
  });
});
