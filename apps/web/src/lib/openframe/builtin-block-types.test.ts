import { describe, expect, it } from "vitest";

import {
  BUILTIN_BLOCK_TYPES,
  BUILTIN_BLOCK_TYPE_ORDER,
  isBuiltinBlockType,
  listBuiltinBlockTypes,
} from "./builtin-block-types";

describe("builtin-block-types", () => {
  it("lists built-in types in stable registry order", () => {
    expect(BUILTIN_BLOCK_TYPE_ORDER).toEqual([
      "container",
      "frame",
      "text",
      "heading",
      "link",
      "button",
      "image",
      "section",
      "split",
      "card",
      "faq",
      "testimonial",
      "logo-cloud",
      "nav-header",
    ]);
    expect(listBuiltinBlockTypes()).toHaveLength(14);
    expect(BUILTIN_BLOCK_TYPES.text.summary.length).toBeGreaterThan(0);
  });

  it("isBuiltinBlockType narrows", () => {
    expect(isBuiltinBlockType("frame")).toBe(true);
    expect(isBuiltinBlockType("heading")).toBe(true);
    expect(isBuiltinBlockType("future-widget")).toBe(false);
  });
});
