import { afterEach, describe, expect, it } from "vitest";

import { isMotionProEnabled } from "./motion-capabilities";

describe("isMotionProEnabled", () => {
  const prev = process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO;

  afterEach(() => {
    process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO = prev;
  });

  it("is true only when env is exactly 1", () => {
    process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO = "1";
    expect(isMotionProEnabled()).toBe(true);
    process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO = "0";
    expect(isMotionProEnabled()).toBe(false);
    delete process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO;
    expect(isMotionProEnabled()).toBe(false);
  });
});
