import { describe, expect, it } from "vitest";

import {
  OPENFRAME_LAYER_CLIPBOARD_MARK,
  decodeLayerClipboard,
  encodeLayerClipboard,
} from "./layer-clipboard";

describe("layer-clipboard", () => {
  it("round-trips a subtree", () => {
    const node = {
      id: "x",
      type: "text",
      name: "Hello",
      props: { text: "Hi" },
      children: [],
    };
    const encoded = encodeLayerClipboard(node);
    expect(encoded.startsWith(`${OPENFRAME_LAYER_CLIPBOARD_MARK}\n`)).toBe(true);
    const decoded = decodeLayerClipboard(encoded);
    expect(decoded).toEqual(node);
  });

  it("returns null for unrelated clipboard text", () => {
    expect(decodeLayerClipboard("hello")).toBeNull();
    expect(decodeLayerClipboard(`${OPENFRAME_LAYER_CLIPBOARD_MARK}`)).toBeNull();
  });
});
