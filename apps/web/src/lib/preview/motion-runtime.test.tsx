import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { BlockMotion } from "./motion-runtime";

const st = {
  start: "top 85%",
  end: "bottom 20%",
  scrub: false as const,
  once: true,
};

describe("BlockMotion", () => {
  const prev = process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO;

  afterEach(() => {
    process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO = prev;
  });

  it("renders children when Motion Pro is off (falls back to ScrollReveal)", () => {
    delete process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO;
    const { getByText } = render(
      <BlockMotion
        scrollReveal="none"
        motionEngine="gsap"
        timelinePreset="heroSequence"
        scrollTrigger={st}
      >
        <span>inside</span>
      </BlockMotion>,
    );
    expect(getByText("inside")).toBeInTheDocument();
  });
});
