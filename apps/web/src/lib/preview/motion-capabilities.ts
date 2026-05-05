/**
 * Runtime gate for optional GSAP / Motion Pro features.
 * OSS builds set `NEXT_PUBLIC_OPENFRAME_MOTION_PRO` unset or `"0"`;
 * premium / full builds set `"1"` so GSAP timelines can run when document asks for `motionEngine: "gsap"`.
 *
 * Server and client must agree for hydration — use only `NEXT_PUBLIC_*` env.
 */

export function isMotionProEnabled(): boolean {
  return process.env.NEXT_PUBLIC_OPENFRAME_MOTION_PRO === "1";
}
