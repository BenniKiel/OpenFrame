/**
 * Framer-style sizing per axis (width / height): Fixed, Relative (%), Fill parent, Fit content.
 */
export type AxisSizeMode = "fixed" | "relative" | "fill" | "fit";

export const AXIS_SIZE_MODES: readonly AxisSizeMode[] = ["fixed", "relative", "fill", "fit"];

export function readAxisSizeMode(v: unknown): AxisSizeMode | null {
  const s = typeof v === "string" ? v.trim().toLowerCase() : "";
  if (s === "fixed" || s === "relative" || s === "fill" || s === "fit") {
    return s;
  }
  return null;
}
