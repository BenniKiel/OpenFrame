import { describe, expect, it } from "vitest";

import { NAV_HEADER_MAX_LINKS, normalizeNavHeaderProps } from "./nav-header-block";

describe("normalizeNavHeaderProps", () => {
  it("applies defaults", () => {
    const p = normalizeNavHeaderProps({});
    expect(p.logoLabel).toBe("OpenFrame");
    expect(p.logoHref).toBe("/");
    expect(p.links).toEqual([]);
  });

  it("reads and trims links", () => {
    const p = normalizeNavHeaderProps({
      links: [{ label: " Features ", href: " #features " }],
      ctaLabel: " Start ",
      ctaHref: " /start ",
    });
    expect(p.links).toEqual([{ label: "Features", href: "#features" }]);
    expect(p.ctaLabel).toBe("Start");
    expect(p.ctaHref).toBe("/start");
  });

  it("caps link count", () => {
    const links = Array.from({ length: NAV_HEADER_MAX_LINKS + 3 }, (_, i) => ({ label: `L${i}`, href: `/x/${i}` }));
    const p = normalizeNavHeaderProps({ links });
    expect(p.links).toHaveLength(NAV_HEADER_MAX_LINKS);
  });
});
