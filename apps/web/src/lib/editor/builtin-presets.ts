import { pageNodeSchema, type PageNode } from "@/lib/openframe";
import { defaultButtonPropsRecord } from "@/lib/preview/button-block";
import { defaultFramePropsRecord } from "@/lib/preview/frame-block";
import { defaultHeadingPropsRecord } from "@/lib/preview/heading-block";
import { defaultSectionPropsRecord } from "@/lib/preview/section-block";
import { defaultSplitPropsRecord } from "@/lib/preview/split-block";
import { defaultTextPropsRecord } from "@/lib/preview/text-block";

function parseRoot(raw: unknown): PageNode {
  return pageNodeSchema.parse(raw);
}

export type BuiltinPresetAccent = "blue" | "violet" | "emerald" | "amber";

export type BuiltinPresetDefinition = {
  id: string;
  title: string;
  description: string;
  accent: BuiltinPresetAccent;
  /** Template subtree root (IDs are placeholders; fresh IDs on apply). */
  root: PageNode;
};

const heroRoot = parseRoot({
  id: "tpl-hero-root",
  type: "section",
  name: "Hero",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-hero-frame",
      type: "frame",
      name: "Hero content",
      props: {
        ...defaultFramePropsRecord(),
        direction: "vertical",
        align: "center",
        justify: "center",
        gap: 16,
      },
      children: [
        {
          id: "tpl-hero-h",
          type: "heading",
          props: {
            ...defaultHeadingPropsRecord(),
            text: "Build pages visually",
            level: 2,
            align: "center",
          },
          children: [],
        },
        {
          id: "tpl-hero-t",
          type: "text",
          props: {
            ...defaultTextPropsRecord(),
            text: "Ship faster with OpenFrame — edit structure in the layer tree and see changes live.",
          },
          children: [],
        },
        {
          id: "tpl-hero-b",
          type: "button",
          props: {
            ...defaultButtonPropsRecord(),
            label: "Get started",
          },
          children: [],
        },
      ],
    },
  ],
});

const splitFeatureRoot = parseRoot({
  id: "tpl-split-root",
  type: "section",
  name: "Two columns",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-split",
      type: "split",
      name: "Split",
      props: defaultSplitPropsRecord(),
      children: [
        {
          id: "tpl-split-a",
          type: "frame",
          name: "Column A",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 12 },
          children: [
            {
              id: "tpl-split-ha",
              type: "heading",
              props: { ...defaultHeadingPropsRecord(), text: "Left column", level: 3 },
              children: [],
            },
            {
              id: "tpl-split-ta",
              type: "text",
              props: { ...defaultTextPropsRecord(), text: "Supporting copy for the first idea." },
              children: [],
            },
          ],
        },
        {
          id: "tpl-split-b",
          type: "frame",
          name: "Column B",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 12 },
          children: [
            {
              id: "tpl-split-hb",
              type: "heading",
              props: { ...defaultHeadingPropsRecord(), text: "Right column", level: 3 },
              children: [],
            },
            {
              id: "tpl-split-tb",
              type: "text",
              props: { ...defaultTextPropsRecord(), text: "Supporting copy for the second idea." },
              children: [],
            },
          ],
        },
      ],
    },
  ],
});

const ctaRowRoot = parseRoot({
  id: "tpl-cta-root",
  type: "section",
  name: "CTA strip",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-cta-fr",
      type: "frame",
      name: "CTA row",
      props: {
        ...defaultFramePropsRecord(),
        direction: "horizontal",
        align: "center",
        justify: "between",
        wrap: true,
        gap: 16,
      },
      children: [
        {
          id: "tpl-cta-h",
          type: "heading",
          props: {
            ...defaultHeadingPropsRecord(),
            text: "Ready to try OpenFrame?",
            level: 3,
          },
          children: [],
        },
        {
          id: "tpl-cta-b",
          type: "button",
          props: {
            ...defaultButtonPropsRecord(),
            label: "Open editor",
            variant: "primary",
          },
          children: [],
        },
      ],
    },
  ],
});

/** Curated templates shipped with the editor (IDs are placeholders only). */
export const BUILTIN_PRESETS: BuiltinPresetDefinition[] = [
  {
    id: "builtin-hero",
    title: "Hero section",
    description: "Centered headline, paragraph and primary button inside a section.",
    accent: "blue",
    root: heroRoot,
  },
  {
    id: "builtin-split",
    title: "Two-column split",
    description: "Section with a split layout and two stacked content columns.",
    accent: "violet",
    root: splitFeatureRoot,
  },
  {
    id: "builtin-cta",
    title: "CTA strip",
    description: "Horizontal headline and button row for a closing call-to-action.",
    accent: "emerald",
    root: ctaRowRoot,
  },
];
