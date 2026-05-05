import type { BlockProps } from "./block-shared";
import { FRAME_SURFACE_CLASS, type FrameSurface } from "./design-tokens";

export type NormalizedCardProps = {
  surface: FrameSurface;
  padding: number;
  radius: number;
};

const SURFACES: readonly FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent"];

function readSurface(v: unknown): FrameSurface {
  const s = typeof v === "string" ? v : "";
  return (SURFACES as readonly string[]).includes(s) ? (s as FrameSurface) : "default";
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

export function normalizeCardProps(props: Record<string, unknown>): NormalizedCardProps {
  const padRaw = typeof props.padding === "number" ? props.padding : Number(props.padding);
  const radRaw = typeof props.radius === "number" ? props.radius : Number(props.radius);
  const padding = Number.isFinite(padRaw) ? clamp(Math.round(padRaw), 0, 64) : 20;
  const radius = Number.isFinite(radRaw) ? clamp(Math.round(radRaw), 0, 32) : 12;
  return {
    surface: readSurface(props.surface),
    padding,
    radius,
  };
}

export function defaultCardPropsRecord(): Record<string, unknown> {
  return {
    surface: "default",
    padding: 20,
    radius: 12,
  };
}

export function CardBlock({ node, children }: BlockProps) {
  const p = normalizeCardProps(node.props);
  return (
    <div
      data-of-node-id={node.id}
      className={`min-w-0 ${FRAME_SURFACE_CLASS[p.surface]}`}
      style={{ padding: p.padding, borderRadius: p.radius }}
    >
      {children}
    </div>
  );
}
