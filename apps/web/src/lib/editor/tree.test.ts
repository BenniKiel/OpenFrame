import { describe, expect, it } from "vitest";

import type { PageNode } from "@/lib/openframe";

import { canParentAcceptChild } from "./tree-rules";
import { getDefaultLayerTitle, getDisplayLayerName, getLayerNamePlaceholder, reorderNodeWithinParentByIds } from "./tree";

describe("getDisplayLayerName", () => {
  it("uses custom name when set", () => {
    const node = { id: "x", type: "text", name: "Intro", props: {}, children: [] } satisfies PageNode;
    expect(getDisplayLayerName(node)).toBe("Intro");
  });

  it("falls back to type title", () => {
    const node = { id: "x", type: "frame", props: {}, children: [] } satisfies PageNode;
    expect(getDisplayLayerName(node)).toBe("Frame");
    expect(getDefaultLayerTitle("unknown-block")).toBe("unknown-block");
    expect(getDefaultLayerTitle("faq")).toBe("FAQ");
    expect(getDefaultLayerTitle("testimonial")).toBe("Testimonial");
    expect(getDefaultLayerTitle("logo-cloud")).toBe("Logo cloud");
    expect(getDefaultLayerTitle("nav-header")).toBe("Nav header");
  });

  it("uses Page for root container without name", () => {
    const node = { id: "root", type: "container", props: {}, children: [] } satisfies PageNode;
    expect(getDisplayLayerName(node)).toBe("Page");
  });
});

describe("getLayerNamePlaceholder", () => {
  it("matches default title when name unset", () => {
    const node = { id: "n1", type: "text", props: {}, children: [] } satisfies PageNode;
    expect(getLayerNamePlaceholder(node)).toBe("Text");
  });
});

describe("canParentAcceptChild", () => {
  it("rejects drops under faq", () => {
    const faq: PageNode = { id: "f", type: "faq", props: { items: [] }, children: [] };
    const text: PageNode = { id: "t", type: "text", props: { text: "x" }, children: [] };
    expect(canParentAcceptChild(faq, text)).toBe(false);
  });

  it("rejects drops under testimonial and logo-cloud", () => {
    const testimonial: PageNode = { id: "x", type: "testimonial", props: {}, children: [] };
    const logoCloud: PageNode = { id: "y", type: "logo-cloud", props: {}, children: [] };
    const text: PageNode = { id: "t", type: "text", props: { text: "x" }, children: [] };
    expect(canParentAcceptChild(testimonial, text)).toBe(false);
    expect(canParentAcceptChild(logoCloud, text)).toBe(false);
  });

  it("rejects drops under nav-header", () => {
    const nav: PageNode = { id: "n", type: "nav-header", props: {}, children: [] };
    const text: PageNode = { id: "t", type: "text", props: { text: "x" }, children: [] };
    expect(canParentAcceptChild(nav, text)).toBe(false);
  });

  it("allows text under frame", () => {
    const frame: PageNode = { id: "fr", type: "frame", props: {}, children: [] };
    const text: PageNode = { id: "t", type: "text", props: { text: "x" }, children: [] };
    expect(canParentAcceptChild(frame, text)).toBe(true);
  });
});

describe("reorderNodeWithinParentByIds", () => {
  it("can move across parents by default", () => {
    const root: PageNode = {
      id: "root",
      type: "container",
      props: {},
      children: [
        { id: "a", type: "text", props: {}, children: [] },
        { id: "b", type: "text", props: {}, children: [] },
        {
          id: "group",
          type: "frame",
          props: {},
          children: [{ id: "c", type: "text", props: {}, children: [] }],
        },
      ],
    };
    expect(reorderNodeWithinParentByIds(root, "a", "b")).toBe(true);
    expect(root.children.map((n) => n.id)).toEqual(["b", "a", "group"]);
    expect(reorderNodeWithinParentByIds(root, "c", "a")).toBe(true);
    expect(root.children.map((n) => n.id)).toEqual(["b", "a", "c", "group"]);
  });

  it("supports explicit after placement", () => {
    const root: PageNode = {
      id: "root",
      type: "container",
      props: {},
      children: [
        { id: "a", type: "text", props: {}, children: [] },
        { id: "b", type: "text", props: {}, children: [] },
        { id: "c", type: "text", props: {}, children: [] },
      ],
    };
    expect(reorderNodeWithinParentByIds(root, "a", "b", "after")).toBe(true);
    expect(root.children.map((n) => n.id)).toEqual(["b", "a", "c"]);
  });
});
