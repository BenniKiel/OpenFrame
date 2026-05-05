import { Children } from "react";

import type { BlockProps } from "./block-shared";

export type SplitCrossAlign = "stretch" | "start" | "center" | "end";

/** Two-column bias when exactly two children exist; otherwise columns share space equally. */
export type SplitRatio = "equal" | "startWide" | "endWide";

export type NormalizedSplitProps = {
  gap: number;
  align: SplitCrossAlign;
  ratio: SplitRatio;
};

const RATIOS: readonly SplitRatio[] = ["equal", "startWide", "endWide"];
const ALIGNS: readonly SplitCrossAlign[] = ["stretch", "start", "center", "end"];

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

function readRatio(v: unknown): SplitRatio {
  const s = typeof v === "string" ? v : "";
  return (RATIOS as readonly string[]).includes(s) ? (s as SplitRatio) : "equal";
}

function readAlign(v: unknown): SplitCrossAlign {
  const s = typeof v === "string" ? v : "";
  return (ALIGNS as readonly string[]).includes(s) ? (s as SplitCrossAlign) : "stretch";
}

export function normalizeSplitProps(props: Record<string, unknown>): NormalizedSplitProps {
  const g = typeof props.gap === "number" ? props.gap : Number(props.gap);
  const gap = Number.isFinite(g) ? clamp(Math.round(g), 0, 96) : 24;
  return {
    gap,
    align: readAlign(props.align),
    ratio: readRatio(props.ratio),
  };
}

export function defaultSplitPropsRecord(): Record<string, unknown> {
  return {
    gap: 24,
    align: "stretch",
    ratio: "equal",
  };
}

const ALIGN_CLASS: Record<SplitCrossAlign, string> = {
  stretch: "items-stretch",
  start: "items-start",
  center: "items-center",
  end: "items-end",
};

function cellClass(index: number, count: number, ratio: SplitRatio): string {
  const base = "min-w-0";
  if (count !== 2 || ratio === "equal") {
    return `${base} flex-1`;
  }
  if (ratio === "startWide") {
    return index === 0 ? `${base} flex-[2]` : `${base} flex-1`;
  }
  /* endWide */
  return index === 0 ? `${base} flex-1` : `${base} flex-[2]`;
}

export function SplitBlock({ node, children }: BlockProps) {
  const p = normalizeSplitProps(node.props);
  const items = Children.toArray(children);
  const count = items.length;

  return (
    <div
      data-of-node-id={node.id}
      className={`flex min-w-0 flex-col md:flex-row ${ALIGN_CLASS[p.align]}`}
      style={{ gap: p.gap }}
    >
      {items.map((child, i) => (
        <div key={i} className={cellClass(i, count, p.ratio)}>
          {child}
        </div>
      ))}
    </div>
  );
}
