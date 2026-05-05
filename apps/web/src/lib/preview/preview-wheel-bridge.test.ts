import { describe, expect, it } from "vitest";

import {
  OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE,
  OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE,
  isPreviewPinchBridgeMessage,
  isPreviewWheelBridgeMessage,
  normalizeWheelPixelDeltas,
} from "./preview-wheel-bridge";

describe("isPreviewWheelBridgeMessage", () => {
  it("accepts valid envelope", () => {
    expect(
      isPreviewWheelBridgeMessage({
        type: OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE,
        payload: {
          deltaX: 0,
          deltaY: -12,
          deltaMode: 0,
          ctrlKey: false,
          metaKey: false,
        },
      }),
    ).toBe(true);
  });

  it("rejects wrong type", () => {
    expect(
      isPreviewWheelBridgeMessage({
        type: "other",
        payload: {
          deltaX: 0,
          deltaY: 1,
          deltaMode: 0,
          ctrlKey: false,
          metaKey: false,
        },
      }),
    ).toBe(false);
  });

  it("rejects non-numeric payload fields", () => {
    expect(
      isPreviewWheelBridgeMessage({
        type: OPENFRAME_PREVIEW_WHEEL_BRIDGE_TYPE,
        payload: { deltaX: "0", deltaY: 1, deltaMode: 0, ctrlKey: false, metaKey: false },
      }),
    ).toBe(false);
  });
});

describe("isPreviewPinchBridgeMessage", () => {
  it("accepts start/end", () => {
    expect(
      isPreviewPinchBridgeMessage({
        type: OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE,
        payload: { phase: "start" },
      }),
    ).toBe(true);
    expect(
      isPreviewPinchBridgeMessage({
        type: OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE,
        payload: { phase: "end" },
      }),
    ).toBe(true);
  });

  it("accepts change with scale", () => {
    expect(
      isPreviewPinchBridgeMessage({
        type: OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE,
        payload: { phase: "change", scale: 1.04 },
      }),
    ).toBe(true);
  });

  it("rejects change without scale", () => {
    expect(
      isPreviewPinchBridgeMessage({
        type: OPENFRAME_PREVIEW_PINCH_BRIDGE_TYPE,
        payload: { phase: "change" },
      }),
    ).toBe(false);
  });
});

describe("normalizeWheelPixelDeltas", () => {
  it("scales line mode", () => {
    const { dx, dy } = normalizeWheelPixelDeltas(1, 2, 1, 100, 100);
    expect(dx).toBe(16);
    expect(dy).toBe(32);
  });

  it("scales page mode with viewport", () => {
    const { dx, dy } = normalizeWheelPixelDeltas(1, 1, 2, 100, 200);
    expect(dx).toBeCloseTo(85);
    expect(dy).toBeCloseTo(170);
  });
});
