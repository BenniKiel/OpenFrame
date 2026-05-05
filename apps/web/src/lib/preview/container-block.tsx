import type { CSSProperties } from "react";

import type { BlockProps } from "./block-shared";
import { CONTAINER_SURFACE_CLASS, type FrameSurface } from "./design-tokens";

export type ContainerHeightMode = "fit" | "fixed";
export type ContainerHeightUnit = "px" | "vh";

export type NormalizedContainerProps = {
  surface: FrameSurface;
  heightMode: ContainerHeightMode;
  heightValue: number | null;
  heightUnit: ContainerHeightUnit;
};

export function normalizeContainerProps(props: Record<string, unknown>): NormalizedContainerProps {
  const s = typeof props.surface === "string" ? props.surface : "";
  const surface = s in CONTAINER_SURFACE_CLASS ? (s as FrameSurface) : "default";

  const hm = typeof props.heightMode === "string" ? props.heightMode : "";
  const heightMode: ContainerHeightMode = hm === "fixed" ? "fixed" : "fit";

  let heightValue: number | null = null;
  if (typeof props.heightValue === "number" && Number.isFinite(props.heightValue)) {
    heightValue = Math.max(0, Math.round(props.heightValue));
  } else if (typeof props.heightValue === "string" && props.heightValue.trim() !== "") {
    const n = Number(props.heightValue);
    if (Number.isFinite(n)) heightValue = Math.max(0, Math.round(n));
  }

  const hu = typeof props.heightUnit === "string" ? props.heightUnit : "";
  const heightUnit: ContainerHeightUnit = hu === "px" ? "px" : "vh";

  return { surface, heightMode, heightValue, heightUnit };
}

export function defaultContainerPropsRecord(): Record<string, unknown> {
  return {
    surface: "default",
    heightMode: "fit",
    heightValue: 100,
    heightUnit: "vh",
  };
}

export function ContainerBlock({ node, children }: BlockProps) {
  const p = normalizeContainerProps(node.props);
  const style: CSSProperties = {};

  if (p.heightMode === "fixed" && p.heightValue != null) {
    style.height = p.heightUnit === "vh" 
      ? `calc(var(--openframe-vh, 1vh) * ${p.heightValue})`
      : `${p.heightValue}${p.heightUnit}`;
  } else {
    style.minHeight = "calc(var(--openframe-vh, 1vh) * 100)";
  }

  return (
    <div
      data-of-node-id={node.id}
      className={`relative flex flex-col min-w-0 ${CONTAINER_SURFACE_CLASS[p.surface]}`}
      style={style}
    >
      {children}
    </div>
  );
}
