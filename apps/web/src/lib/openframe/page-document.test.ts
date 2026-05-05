import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import {
  openframePageDocumentSchema,
  parsePageDocument,
  parsePageDocumentFromJson,
} from "./page-document";

describe("openframePageDocumentSchema", () => {
  it("accepts a minimal tree", () => {
    const doc = {
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [
          {
            id: "hero",
            type: "text",
            props: { text: "OpenFrame" },
            children: [],
          },
        ],
      },
    };

    expect(() => openframePageDocumentSchema.parse(doc)).not.toThrow();
  });
});

describe("parsePageDocument", () => {
  it("returns ok for valid document", () => {
    const doc = {
      version: 1,
      root: {
        id: "root",
        type: "container",
        props: {},
        children: [],
      },
    };
    const r = parsePageDocument(doc);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.version).toBe(1);
      expect(r.data.root.id).toBe("root");
    }
  });

  it("rejects wrong version", () => {
    const r = parsePageDocument({
      version: 2,
      root: { id: "root", type: "box", props: {}, children: [] },
    });
    expect(r.ok).toBe(false);
  });

  it("accepts optional theme and meta (Phase 3)", () => {
    const r = parsePageDocument({
      version: 1,
      root: { id: "root", type: "container", props: {}, children: [] },
      theme: { radius: "lg", colorScheme: "dark", typographyScale: "large" },
      meta: { title: "Hello", description: "World", ogImage: "https://example.com/og.png" },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.theme?.radius).toBe("lg");
      expect(r.data.theme?.colorScheme).toBe("dark");
      expect(r.data.meta?.title).toBe("Hello");
    }
  });

  it("accepts optional trimmed name on nodes", () => {
    const r = parsePageDocument({
      version: 1,
      root: {
        id: "root",
        type: "container",
        name: "  Site  ",
        props: {},
        children: [
          { id: "a", type: "text", name: "", props: { text: "x" }, children: [] },
        ],
      },
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.root.name).toBe("Site");
      expect(r.data.root.children[0]?.name).toBeUndefined();
    }
  });

  it("rejects duplicate node ids", () => {
    const r = parsePageDocument({
      version: 1,
      root: {
        id: "dup",
        type: "container",
        props: {},
        children: [
          { id: "dup", type: "text", props: { text: "a" }, children: [] },
        ],
      },
    });
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.issues.some((i) => i.message.includes("Duplicate node ids"))).toBe(true);
    }
  });

  it("accepts openframe/examples/openframe.page.json", () => {
    const file = path.join(process.cwd(), "../../openframe/examples/openframe.page.json");
    const text = readFileSync(file, "utf8");
    const r = parsePageDocumentFromJson(text);
    expect(r.ok).toBe(true);
  });

  it("accepts openframe/examples/landing-mvp.page.json (golden landing MVP)", () => {
    const file = path.join(process.cwd(), "../../openframe/examples/landing-mvp.page.json");
    const text = readFileSync(file, "utf8");
    const r = parsePageDocumentFromJson(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.root.children[0]?.type).toBe("section");
      expect(r.data.root.children[0]?.name).toBe("Hero section");
      expect(r.data.root.children[0]?.children[0]?.type).toBe("frame");
      expect(r.data.root.children[0]?.children[0]?.name).toBe("Hero");
    }
  });

  it("rejects invalid JSON string", () => {
    const r = parsePageDocumentFromJson("{");
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.issues[0]?.message).toContain("Invalid JSON");
    }
  });
});
