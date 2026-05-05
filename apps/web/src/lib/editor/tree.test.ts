import { describe, expect, it } from "vitest";

import type { PageNode } from "@/lib/openframe";

import { getDefaultLayerTitle, getDisplayLayerName, getLayerNamePlaceholder } from "./tree";

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
