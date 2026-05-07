import type { BlockProps } from "./block-shared";
import { FRAME_SURFACE_CLASS, type FrameSurface } from "./design-tokens";

export type NormalizedCardProps = {
  surface: FrameSurface;
  padding: number;
  radius: number;
  interaction: CardInteraction;
};

export type CardInteraction = "none" | "lift" | "glow";

const SURFACES: readonly FrameSurface[] = ["default", "muted", "transparent", "inverse", "accent"];
const INTERACTIONS: readonly CardInteraction[] = ["none", "lift", "glow"];

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
    interaction:
      typeof props.interaction === "string" && (INTERACTIONS as readonly string[]).includes(props.interaction)
        ? (props.interaction as CardInteraction)
        : "none",
  };
}

export function defaultCardPropsRecord(): Record<string, unknown> {
  return {
    surface: "default",
    padding: 20,
    radius: 12,
    interaction: "none",
  };
}

export function CardBlock({ node, children }: BlockProps) {
  const p = normalizeCardProps(node.props);
  const interactionClass =
    p.interaction === "lift"
      ? "transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:shadow-xl"
      : p.interaction === "glow"
        ? "transition-shadow duration-200 ease-out hover:shadow-[0_0_0_2px_rgb(59_130_246_/_0.35),0_12px_30px_rgb(2_6_23_/_0.28)]"
        : "";
  return (
    <div
      data-of-node-id={node.id}
      className={`min-w-0 ${FRAME_SURFACE_CLASS[p.surface]} ${interactionClass}`}
      style={{ padding: p.padding, borderRadius: p.radius }}
    >
      {children}
    </div>
  );
}
