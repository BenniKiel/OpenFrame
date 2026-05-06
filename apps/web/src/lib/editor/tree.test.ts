import { describe, expect, it } from "vitest";

import type { PageNode } from "@/lib/openframe";

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
