import { describe, expect, it } from "vitest";

import { normalizeFrameProps } from "./frame-block";

describe("normalizeFrameProps", () => {
  it("applies defaults for empty props", () => {
    expect(normalizeFrameProps({})).toEqual({
      layoutType: "stack",
      direction: "vertical",
      wrap: false,
      gap: 12,
      padding: 16,
      radius: 8,
      widthSizeMode: "fill",
      heightSizeMode: "fit",
      align: "stretch",
      justify: "start",
      columns: 2,
      positionMode: "flow",
      insetTop: null,
      insetRight: null,
      insetBottom: null,
      insetLeft: null,
      zIndex: null,
      overflow: "visible",
      surface: "default",
      fill: null,
      widthSizeValue: null,
      widthSizeUnit: "auto",
      heightSizeValue: null,
      heightSizeUnit: "auto",
      minWidthPx: null,
      maxWidthPx: null,
      minHeightValue: null,
      minHeightUnit: "vh",
      pointerEvents: "auto",
      cursor: null,
      userSelect: "auto",
      visible: true,
      scrollReveal: "none",
      motionEngine: "core",
      timelinePreset: "none",
      scrollTrigger: {
        start: "top 85%",
        end: "bottom 20%",
        scrub: false,
        once: true,
      },
    });
  });

  it("reads Framer-style layoutType, direction, wrap", () => {
    expect(
      normalizeFrameProps({
        layoutType: "stack",
        direction: "horizontal",
        wrap: true,
        gap: 8,
      }),
    ).toMatchObject({
      layoutType: "stack",
      direction: "horizontal",
      wrap: true,
      gap: 8,
    });
  });

  it("maps legacy width hug to widthSizeMode fit", () => {
    expect(normalizeFrameProps({ width: "hug" })).toMatchObject({
      widthSizeMode: "fit",
    });
  });

  it("maps legacy width fill to widthSizeMode fill", () => {
    expect(normalizeFrameProps({ width: "fill" })).toMatchObject({
      widthSizeMode: "fill",
    });
  });

  it("maps legacy layout horizontal to stack + horizontal", () => {
    expect(normalizeFrameProps({ layout: "horizontal" })).toMatchObject({
      layoutType: "stack",
      direction: "horizontal",
      wrap: false,
    });
  });

  it("maps legacy layout wrap to stack + horizontal + wrap", () => {
    expect(normalizeFrameProps({ layout: "wrap" })).toMatchObject({
      layoutType: "stack",
      direction: "horizontal",
      wrap: true,
    });
  });

  it("maps legacy layout stack to stack + vertical", () => {
    expect(normalizeFrameProps({ layout: "stack" })).toMatchObject({
      layoutType: "stack",
      direction: "vertical",
      wrap: false,
    });
  });

  it("coerces layout and clamps numbers", () => {
    expect(
      normalizeFrameProps({
        layoutType: "grid",
        gap: 999,
        padding: -5,
        columns: 20,
        widthSizeMode: "fit",
        align: "center",
        justify: "between",
      }),
    ).toMatchObject({
      layoutType: "grid",
      gap: 256,
      padding: 0,
      columns: 12,
      widthSizeMode: "fit",
      align: "center",
      justify: "between",
    });
  });

  it("derives relative width from pct unit", () => {
    expect(
      normalizeFrameProps({
        widthSizeValue: 50,
        widthSizeUnit: "pct",
      }),
    ).toMatchObject({
      widthSizeMode: "relative",
      widthSizeValue: 50,
      widthSizeUnit: "pct",
    });
  });

  it("rejects unknown legacy layout", () => {
    expect(normalizeFrameProps({ layout: "fancy" }).layoutType).toBe("stack");
  });

  it("parses absolute position, insets, overflow, z-index, visible", () => {
    expect(
      normalizeFrameProps({
        positionMode: "absolute",
        insetTop: 10,
        insetLeft: 0,
        insetRight: "",
        overflow: "clip",
        zIndex: 5,
        visible: false,
      }),
    ).toMatchObject({
      positionMode: "absolute",
      insetTop: 10,
      insetLeft: 0,
      insetRight: null,
      insetBottom: null,
      overflow: "clip",
      zIndex: 5,
      visible: false,
    });
  });

  it("accepts overflow scroll", () => {
    expect(normalizeFrameProps({ overflow: "scroll" }).overflow).toBe("scroll");
  });

  it("falls back overflow for unknown value", () => {
    expect(normalizeFrameProps({ overflow: "bogus" }).overflow).toBe("visible");
  });
});
