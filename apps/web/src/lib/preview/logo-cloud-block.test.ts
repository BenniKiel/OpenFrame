import { describe, expect, it } from "vitest";

import { LOGO_CLOUD_MAX_ITEMS, normalizeLogoCloudProps } from "./logo-cloud-block";

describe("normalizeLogoCloudProps", () => {
  it("applies defaults", () => {
    const p = normalizeLogoCloudProps({});
    expect(p.surface).toBe("default");
    expect(p.logos.length).toBeGreaterThan(0);
  });

  it("reads and trims logos", () => {
    const p = normalizeLogoCloudProps({
      surface: "muted",
      title: " Partners ",
      logos: [{ name: " Acme ", src: " https://example.com/logo.svg " }],
    });
    expect(p).toMatchObject({
      surface: "muted",
      title: "Partners",
      logos: [{ name: "Acme", src: "https://example.com/logo.svg" }],
    });
  });

  it("caps logo count", () => {
    const logos = Array.from({ length: LOGO_CLOUD_MAX_ITEMS + 5 }, (_, i) => ({ name: `Logo ${i}`, src: "" }));
    const p = normalizeLogoCloudProps({ logos });
    expect(p.logos).toHaveLength(LOGO_CLOUD_MAX_ITEMS);
  });
});
