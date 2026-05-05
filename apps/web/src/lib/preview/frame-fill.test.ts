import type { CSSProperties } from "react";
import { describe, expect, it } from "vitest";

import { applyFrameFillToStyle, hexToRgba, normalizeFrameFill, normalizeHexColor } from "./frame-fill";

describe("normalizeHexColor", () => {
  it("normalizes 3- and 6-digit hex", () => {
    expect(normalizeHexColor("#abc")).toBe("#aabbcc");
    expect(normalizeHexColor("112233")).toBe("#112233");
  });
});

describe("hexToRgba", () => {
  it("applies opacity", () => {
    expect(hexToRgba("#000000", 0.13)).toBe("rgba(0,0,0,0.13)");
  });
});

describe("normalizeFrameFill", () => {
  it("returns null for missing or invalid", () => {
    expect(normalizeFrameFill(null)).toBeNull();
    expect(normalizeFrameFill({})).toBeNull();
    expect(normalizeFrameFill({ type: "weird" })).toBeNull();
  });

  it("parses solid with opacity", () => {
    expect(
      normalizeFrameFill({
        type: "solid",
        color: "#000000",
        opacity: 0.13,
      }),
    ).toEqual({
      kind: "solid",
      color: "#000000",
      opacity: 0.13,
    });
  });

  it("parses linear gradient", () => {
    const f = normalizeFrameFill({
      type: "linear",
      angle: 90,
      stops: [
        { color: "#ff0000", position: 0 },
        { color: "#0000ff", position: 100 },
      ],
    });
    expect(f?.kind).toBe("linear");
    if (f?.kind === "linear") {
      expect(f.angle).toBe(90);
      expect(f.stops).toHaveLength(2);
    }
  });

  it("rejects unsafe image URLs", () => {
    expect(normalizeFrameFill({ type: "image", src: "javascript:alert(1)", fit: "cover" })).toBeNull();
    expect(
      normalizeFrameFill({
        type: "image",
        src: "https://placehold.co/10x10/png",
        fit: "cover",
        position: "center",
      })?.kind,
    ).toBe("image");
  });

  it("strict mode coerces partial hex; editor mode preserves raw", () => {
    expect(normalizeFrameFill({ type: "solid", color: "#f", opacity: 1 })).toEqual({
      kind: "solid",
      color: "#000000",
      opacity: 1,
    });
    expect(normalizeFrameFill({ type: "solid", color: "#f", opacity: 1 }, { editor: true })).toEqual({
      kind: "solid",
      color: "#f",
      opacity: 1,
    });
  });

  it("strict mode rejects non-https image URL; editor mode keeps it for typing", () => {
    expect(normalizeFrameFill({ type: "image", src: "http://example.com/x.png", fit: "cover" })).toBeNull();
    const ed = normalizeFrameFill({ type: "image", src: "http://example.com/x.png", fit: "cover" }, { editor: true });
    expect(ed?.kind).toBe("image");
    if (ed?.kind === "image") {
      expect(ed.src).toBe("http://example.com/x.png");
    }
  });
});

describe("applyFrameFillToStyle", () => {
  it("skips unsafe image URLs without mutating unrelated props", () => {
    const style: CSSProperties = { color: "red" };
    applyFrameFillToStyle(style, {
      kind: "image",
      src: "javascript:alert(1)",
      fit: "cover",
      position: "center",
    });
    expect(style.backgroundImage).toBeUndefined();
    expect(style.color).toBe("red");
  });

  it("sets linear-gradient on style", () => {
    const style: CSSProperties = {};
    applyFrameFillToStyle(
      style,
      normalizeFrameFill({
        type: "linear",
        angle: 180,
        stops: [
          { color: "#000000", position: 0 },
          { color: "#ffffff", position: 100 },
        ],
      }),
    );
    expect(style.backgroundImage).toContain("linear-gradient");
    expect(style.backgroundImage).toContain("180deg");
  });
});
