import { describe, expect, it } from "vitest";

import { BUILTIN_PRESETS } from "./builtin-presets";

describe("BUILTIN_PRESETS", () => {
  it("includes responsive grid recipes", () => {
    const ids = BUILTIN_PRESETS.map((p) => p.id);
    expect(ids).toContain("builtin-grid-132");
    expect(ids).toContain("builtin-grid-24");
    expect(ids).toContain("builtin-grid-pricing-13");
    expect(ids).toContain("builtin-media-crop-rounded");
    expect(ids).toContain("builtin-pricing-monthly");
    expect(ids).toContain("builtin-pricing-yearly-save");
  });

  it("stores grid recipes as frame+when templates", () => {
    const grid = BUILTIN_PRESETS.find((p) => p.id === "builtin-grid-132");
    expect(grid).toBeTruthy();
    if (!grid) {
      return;
    }
    const frame = grid.root.children.find((n) => n.type === "frame");
    expect(frame?.props.layoutType).toBe("grid");
    expect((frame?.props.when as { md?: { columns?: number } } | undefined)?.md?.columns).toBe(2);
  });

  it("includes rounded media crop recipe with overflow hidden frame", () => {
    const media = BUILTIN_PRESETS.find((p) => p.id === "builtin-media-crop-rounded");
    expect(media).toBeTruthy();
    if (!media) {
      return;
    }
    const frame = media.root.children.find((n) => n.type === "frame");
    expect(frame?.props.overflow).toBe("hidden");
    expect(frame?.props.radius).toBe(20);
    const image = frame?.children.find((n) => n.type === "image");
    expect(image?.props.fit).toBe("cover");
    expect(image?.props.heightSizeMode).toBe("fill");
  });

  it("includes pricing preset recipes", () => {
    const monthly = BUILTIN_PRESETS.find((p) => p.id === "builtin-pricing-monthly");
    const yearly = BUILTIN_PRESETS.find((p) => p.id === "builtin-pricing-yearly-save");
    expect(monthly).toBeTruthy();
    expect(yearly).toBeTruthy();
  });
});
