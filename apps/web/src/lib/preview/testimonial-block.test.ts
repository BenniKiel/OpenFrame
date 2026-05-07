import { describe, expect, it } from "vitest";

import { normalizeTestimonialProps } from "./testimonial-block";

describe("normalizeTestimonialProps", () => {
  it("applies defaults", () => {
    const p = normalizeTestimonialProps({});
    expect(p.surface).toBe("default");
    expect(p.avatarSrc).toBeNull();
  });

  it("reads and trims fields", () => {
    const p = normalizeTestimonialProps({
      surface: "inverse",
      quote: " Great product ",
      author: " Sam ",
      role: " Founder ",
      avatarSrc: " https://example.com/a.png ",
    });
    expect(p).toMatchObject({
      surface: "inverse",
      quote: "Great product",
      author: "Sam",
      role: "Founder",
      avatarSrc: "https://example.com/a.png",
    });
  });
});
