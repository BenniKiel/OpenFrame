import type { BlockProps } from "./block-shared";
import type { NormalizedBlockMotion } from "./motion-contract";
import { normalizeBlockMotion } from "./motion-contract";
import { BlockMotion } from "./motion-runtime";

export type NormalizedSectionProps = {
  /** Sanitized HTML `id` for in-page anchors (`#foo`). */
  anchorId: string | null;
} & NormalizedBlockMotion;

/** Allow `[a-zA-Z0-9_-]` only; empty → no DOM id. */
export function sanitizeSectionAnchorId(raw: string): string | null {
  const t = raw.trim().slice(0, 128);
  if (!t) {
    return null;
  }
  const s = t
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  if (!s) {
    return null;
  }
  return s;
}

export function normalizeSectionProps(props: Record<string, unknown>): NormalizedSectionProps {
  const fromAnchor = typeof props.anchorId === "string" ? props.anchorId : "";
  const fromLegacy = typeof props.sectionId === "string" ? props.sectionId : "";
  const raw = fromAnchor || fromLegacy;
  const motion = normalizeBlockMotion(props);
  return { anchorId: sanitizeSectionAnchorId(raw), ...motion };
}

export function defaultSectionPropsRecord(): Record<string, unknown> {
  return { anchorId: "" };
}

export function SectionBlock({ node, children }: BlockProps) {
  const p = normalizeSectionProps(node.props);
  const inner = (
    <section
      data-of-node-id={node.id}
      id={p.anchorId ?? undefined}
      className="relative min-w-0 py-10"
    >
      {children}
    </section>
  );
  return (
    <BlockMotion
      scrollReveal={p.scrollReveal}
      motionEngine={p.motionEngine}
      timelinePreset={p.timelinePreset}
      scrollTrigger={p.scrollTrigger}
    >
      {inner}
    </BlockMotion>
  );
}
