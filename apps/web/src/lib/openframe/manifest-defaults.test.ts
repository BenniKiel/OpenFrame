import { describe, it, expect } from "vitest";

import { buildDefaultPropsFromManifest, resolveControlDefault } from "./manifest-defaults";
import type { ComponentManifest, PropertyControl } from "./component-manifest";

describe("resolveControlDefault", () => {
  it("returns explicit defaultValue when set", () => {
    const control: PropertyControl = { type: "string", title: "Name", defaultValue: "hello" };
    expect(resolveControlDefault(control)).toBe("hello");
  });

  it("returns type fallback when no defaultValue", () => {
    const control: PropertyControl = { type: "string", title: "Name" };
    expect(resolveControlDefault(control)).toBe("");
  });

  it("returns first option for enum without defaultValue", () => {
    const control: PropertyControl = {
      type: "enum",
      title: "Size",
      options: ["sm", "md", "lg"],
    };
    expect(resolveControlDefault(control)).toBe("sm");
  });

  it("returns explicit defaultValue over first option for enum", () => {
    const control: PropertyControl = {
      type: "enum",
      title: "Size",
      options: ["sm", "md", "lg"],
      defaultValue: "lg",
    };
    expect(resolveControlDefault(control)).toBe("lg");
  });

  it("returns 0 for number without defaultValue", () => {
    const control: PropertyControl = { type: "number", title: "Count" };
    expect(resolveControlDefault(control)).toBe(0);
  });

  it("returns false for boolean without defaultValue", () => {
    const control: PropertyControl = { type: "boolean", title: "Active" };
    expect(resolveControlDefault(control)).toBe(false);
  });

  it("returns #000000 for color without defaultValue", () => {
    const control: PropertyControl = { type: "color", title: "Color" };
    expect(resolveControlDefault(control)).toBe("#000000");
  });

  it("returns empty array for array without defaultValue", () => {
    const control: PropertyControl = {
      type: "array",
      title: "Items",
      itemControl: { type: "string", title: "Item" },
    };
    expect(resolveControlDefault(control)).toEqual([]);
  });
});

describe("buildDefaultPropsFromManifest", () => {
  it("builds a complete props record from a manifest", () => {
    const manifest: ComponentManifest = {
      version: 1,
      name: "test-card",
      displayName: "Test Card",
      acceptsChildren: false,
      propertyControls: {
        title: { type: "string", title: "Title", defaultValue: "Hello" },
        count: { type: "number", title: "Count", defaultValue: 5 },
        active: { type: "boolean", title: "Active" },
        variant: { type: "enum", title: "Variant", options: ["a", "b"], defaultValue: "b" },
      },
    };

    const props = buildDefaultPropsFromManifest(manifest);
    expect(props).toEqual({
      title: "Hello",
      count: 5,
      active: false,
      variant: "b",
    });
  });

  it("returns empty object for manifest with no controls", () => {
    const manifest: ComponentManifest = {
      version: 1,
      name: "empty",
      displayName: "Empty",
      acceptsChildren: false,
      propertyControls: {},
    };
    expect(buildDefaultPropsFromManifest(manifest)).toEqual({});
  });
});
