import type { BlockProps } from "./block-shared";
import type { NormalizedBlockMotion } from "./motion-contract";
import { normalizeBlockMotion } from "./motion-contract";
import { BlockMotion } from "./motion-runtime";

export const SECTION_PADDING_Y_OPTIONS = ["none", "sm", "md", "lg", "xl"] as const;
export type SectionPaddingY = (typeof SECTION_PADDING_Y_OPTIONS)[number];

const SECTION_PADDING_Y_CLASS: Record<SectionPaddingY, string> = {
  none: "py-0",
  sm: "py-6",
  md: "py-10",
  lg: "py-16",
  xl: "py-24",
};

export type NormalizedSectionProps = {
  /** Sanitized HTML `id` for in-page anchors (`#foo`). */
  anchorId: string | null;
  paddingY: SectionPaddingY;
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
  const rawPadding = typeof props.paddingY === "string" ? props.paddingY : "";
  const paddingY = (SECTION_PADDING_Y_OPTIONS as readonly string[]).includes(rawPadding)
    ? (rawPadding as SectionPaddingY)
    : "md";
  const motion = normalizeBlockMotion(props);
  return { anchorId: sanitizeSectionAnchorId(raw), paddingY, ...motion };
}

export function defaultSectionPropsRecord(): Record<string, unknown> {
  return { anchorId: "", paddingY: "md" };
}

export function SectionBlock({ node, children }: BlockProps) {
  const p = normalizeSectionProps(node.props);
  const inner = (
    <section
      data-of-node-id={node.id}
      id={p.anchorId ?? undefined}
      className={`relative min-w-0 ${SECTION_PADDING_Y_CLASS[p.paddingY]}`}
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
