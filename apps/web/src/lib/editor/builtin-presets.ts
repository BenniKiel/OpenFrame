import { pageNodeSchema, type PageNode } from "@/lib/openframe";
import { defaultButtonPropsRecord } from "@/lib/preview/button-block";
import { defaultFramePropsRecord } from "@/lib/preview/frame-block";
import { defaultHeadingPropsRecord } from "@/lib/preview/heading-block";
import { defaultImagePropsRecord } from "@/lib/preview/image-block";
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

const gridCards132Root = parseRoot({
  id: "tpl-grid132-root",
  type: "section",
  name: "Grid 1-3 cards",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-grid132-frame",
      type: "frame",
      name: "Cards grid",
      props: {
        ...defaultFramePropsRecord(),
        layoutType: "grid",
        columns: 1,
        gap: 16,
        when: {
          md: { columns: 2, gap: 20 },
          lg: { columns: 3, gap: 24 },
        },
      },
      children: [
        {
          id: "tpl-grid132-card-a",
          type: "frame",
          name: "Card A",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 8, padding: 16, surface: "muted" },
          children: [
            { id: "tpl-grid132-ha", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Feature One", level: 4 }, children: [] },
            {
              id: "tpl-grid132-ta",
              type: "text",
              props: { ...defaultTextPropsRecord(), text: "Short supporting copy for the first card." },
              children: [],
            },
          ],
        },
        {
          id: "tpl-grid132-card-b",
          type: "frame",
          name: "Card B",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 8, padding: 16, surface: "muted" },
          children: [
            { id: "tpl-grid132-hb", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Feature Two", level: 4 }, children: [] },
            {
              id: "tpl-grid132-tb",
              type: "text",
              props: { ...defaultTextPropsRecord(), text: "Short supporting copy for the second card." },
              children: [],
            },
          ],
        },
        {
          id: "tpl-grid132-card-c",
          type: "frame",
          name: "Card C",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 8, padding: 16, surface: "muted" },
          children: [
            { id: "tpl-grid132-hc", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Feature Three", level: 4 }, children: [] },
            {
              id: "tpl-grid132-tc",
              type: "text",
              props: { ...defaultTextPropsRecord(), text: "Short supporting copy for the third card." },
              children: [],
            },
          ],
        },
      ],
    },
  ],
});

const grid24Root = parseRoot({
  id: "tpl-grid24-root",
  type: "section",
  name: "Grid 2-4 stats",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-grid24-frame",
      type: "frame",
      name: "Stats grid",
      props: {
        ...defaultFramePropsRecord(),
        layoutType: "grid",
        columns: 2,
        gap: 12,
        when: {
          lg: { columns: 4, gap: 16 },
        },
      },
      children: [
        {
          id: "tpl-grid24-a",
          type: "frame",
          name: "Stat 01",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 4, padding: 14, surface: "accent", align: "start" },
          children: [
            { id: "tpl-grid24-ah", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "12k+", level: 4 }, children: [] },
            { id: "tpl-grid24-at", type: "text", props: { ...defaultTextPropsRecord(), text: "Active projects" }, children: [] },
          ],
        },
        {
          id: "tpl-grid24-b",
          type: "frame",
          name: "Stat 02",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 4, padding: 14, surface: "accent", align: "start" },
          children: [
            { id: "tpl-grid24-bh", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "99.9%", level: 4 }, children: [] },
            { id: "tpl-grid24-bt", type: "text", props: { ...defaultTextPropsRecord(), text: "Uptime" }, children: [] },
          ],
        },
        {
          id: "tpl-grid24-c",
          type: "frame",
          name: "Stat 03",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 4, padding: 14, surface: "accent", align: "start" },
          children: [
            { id: "tpl-grid24-ch", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "180+", level: 4 }, children: [] },
            { id: "tpl-grid24-ct", type: "text", props: { ...defaultTextPropsRecord(), text: "Countries" }, children: [] },
          ],
        },
        {
          id: "tpl-grid24-d",
          type: "frame",
          name: "Stat 04",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 4, padding: 14, surface: "accent", align: "start" },
          children: [
            { id: "tpl-grid24-dh", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "24/7", level: 4 }, children: [] },
            { id: "tpl-grid24-dt", type: "text", props: { ...defaultTextPropsRecord(), text: "Support" }, children: [] },
          ],
        },
      ],
    },
  ],
});

const pricing13Root = parseRoot({
  id: "tpl-pricing13-root",
  type: "section",
  name: "Pricing 1-3",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-pricing13-frame",
      type: "frame",
      name: "Pricing grid",
      props: {
        ...defaultFramePropsRecord(),
        layoutType: "grid",
        columns: 1,
        gap: 16,
        when: {
          lg: { columns: 3, gap: 20 },
        },
      },
      children: [
        {
          id: "tpl-pricing13-a",
          type: "frame",
          name: "Starter",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 10, padding: 18, surface: "default" },
          children: [
            { id: "tpl-pricing13-ah", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Starter", level: 4 }, children: [] },
            { id: "tpl-pricing13-at", type: "text", props: { ...defaultTextPropsRecord(), text: "$0 / month" }, children: [] },
            { id: "tpl-pricing13-ab", type: "button", props: { ...defaultButtonPropsRecord(), label: "Start free", variant: "secondary" }, children: [] },
          ],
        },
        {
          id: "tpl-pricing13-b",
          type: "frame",
          name: "Pro",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 10, padding: 18, surface: "inverse" },
          children: [
            { id: "tpl-pricing13-bh", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Pro", level: 4 }, children: [] },
            { id: "tpl-pricing13-bt", type: "text", props: { ...defaultTextPropsRecord(), text: "$29 / month", tone: "inverse" }, children: [] },
            { id: "tpl-pricing13-bb", type: "button", props: { ...defaultButtonPropsRecord(), label: "Choose Pro", variant: "inverse" }, children: [] },
          ],
        },
        {
          id: "tpl-pricing13-c",
          type: "frame",
          name: "Scale",
          props: { ...defaultFramePropsRecord(), direction: "vertical", gap: 10, padding: 18, surface: "default" },
          children: [
            { id: "tpl-pricing13-ch", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Scale", level: 4 }, children: [] },
            { id: "tpl-pricing13-ct", type: "text", props: { ...defaultTextPropsRecord(), text: "Custom pricing" }, children: [] },
            { id: "tpl-pricing13-cb", type: "button", props: { ...defaultButtonPropsRecord(), label: "Contact sales", variant: "secondary" }, children: [] },
          ],
        },
      ],
    },
  ],
});

const mediaCropRoot = parseRoot({
  id: "tpl-media-crop-root",
  type: "section",
  name: "Rounded media",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-media-crop-frame",
      type: "frame",
      name: "Media crop container",
      props: {
        ...defaultFramePropsRecord(),
        layoutType: "stack",
        direction: "vertical",
        overflow: "hidden",
        radius: 20,
        padding: 0,
        gap: 0,
        widthSizeMode: "fill",
        heightSizeMode: "fixed",
        heightSizeValue: 360,
        heightSizeUnit: "px",
        surface: "default",
      },
      children: [
        {
          id: "tpl-media-crop-image",
          type: "image",
          name: "Cropped image",
          props: {
            ...defaultImagePropsRecord(),
            fit: "cover",
            radiusPx: 0,
            widthSizeMode: "fill",
            heightSizeMode: "fill",
            width: null,
            height: null,
          },
          children: [],
        },
      ],
    },
  ],
});

const pricingMonthlyRoot = parseRoot({
  id: "tpl-pricing-monthly-root",
  type: "section",
  name: "Pricing monthly",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-pricing-monthly-head",
      type: "frame",
      name: "Heading row",
      props: {
        ...defaultFramePropsRecord(),
        direction: "vertical",
        align: "center",
        justify: "center",
        gap: 8,
        padding: 8,
      },
      children: [
        {
          id: "tpl-pricing-monthly-h",
          type: "heading",
          props: { ...defaultHeadingPropsRecord(), text: "Simple monthly pricing", level: 2, align: "center" },
          children: [],
        },
        {
          id: "tpl-pricing-monthly-t",
          type: "text",
          props: { ...defaultTextPropsRecord(), text: "Pick the plan that fits your team.", align: "center" },
          children: [],
        },
      ],
    },
    {
      id: "tpl-pricing-monthly-grid",
      type: "frame",
      name: "Plans",
      props: {
        ...defaultFramePropsRecord(),
        layoutType: "grid",
        columns: 1,
        gap: 16,
        when: { md: { columns: 3, gap: 20 } },
      },
      children: [
        {
          id: "tpl-pricing-monthly-starter",
          type: "card",
          name: "Starter",
          props: { surface: "default", padding: 18, radius: 12, interaction: "none" },
          children: [
            { id: "tpl-pricing-monthly-starter-h", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Starter", level: 4 }, children: [] },
            { id: "tpl-pricing-monthly-starter-p", type: "text", props: { ...defaultTextPropsRecord(), text: "$0 / month", sizeScale: "xl" }, children: [] },
            { id: "tpl-pricing-monthly-starter-t", type: "text", props: { ...defaultTextPropsRecord(), text: "For side projects and experiments." }, children: [] },
            { id: "tpl-pricing-monthly-starter-b", type: "button", props: { ...defaultButtonPropsRecord(), label: "Start free", variant: "secondary" }, children: [] },
          ],
        },
        {
          id: "tpl-pricing-monthly-pro",
          type: "card",
          name: "Pro",
          props: { surface: "inverse", padding: 18, radius: 12, interaction: "lift" },
          children: [
            { id: "tpl-pricing-monthly-pro-h", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Pro", level: 4 }, children: [] },
            { id: "tpl-pricing-monthly-pro-p", type: "text", props: { ...defaultTextPropsRecord(), text: "$29 / month", tone: "inverse", sizeScale: "xl" }, children: [] },
            { id: "tpl-pricing-monthly-pro-t", type: "text", props: { ...defaultTextPropsRecord(), text: "Best for growing product teams.", tone: "inverse" }, children: [] },
            { id: "tpl-pricing-monthly-pro-b", type: "button", props: { ...defaultButtonPropsRecord(), label: "Choose Pro", variant: "inverse" }, children: [] },
          ],
        },
        {
          id: "tpl-pricing-monthly-scale",
          type: "card",
          name: "Scale",
          props: { surface: "default", padding: 18, radius: 12, interaction: "none" },
          children: [
            { id: "tpl-pricing-monthly-scale-h", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Scale", level: 4 }, children: [] },
            { id: "tpl-pricing-monthly-scale-p", type: "text", props: { ...defaultTextPropsRecord(), text: "Custom", sizeScale: "xl" }, children: [] },
            { id: "tpl-pricing-monthly-scale-t", type: "text", props: { ...defaultTextPropsRecord(), text: "Security, SSO and enterprise support." }, children: [] },
            { id: "tpl-pricing-monthly-scale-b", type: "button", props: { ...defaultButtonPropsRecord(), label: "Contact sales", variant: "secondary" }, children: [] },
          ],
        },
      ],
    },
  ],
});

const pricingYearlySaveRoot = parseRoot({
  id: "tpl-pricing-yearly-root",
  type: "section",
  name: "Pricing yearly",
  props: defaultSectionPropsRecord(),
  children: [
    {
      id: "tpl-pricing-yearly-banner",
      type: "frame",
      name: "Yearly badge",
      props: {
        ...defaultFramePropsRecord(),
        direction: "horizontal",
        align: "center",
        justify: "center",
        gap: 10,
        padding: 12,
        surface: "accent",
      },
      children: [
        { id: "tpl-pricing-yearly-banner-h", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Yearly billing", level: 5 }, children: [] },
        { id: "tpl-pricing-yearly-banner-t", type: "text", props: { ...defaultTextPropsRecord(), text: "Save up to 20% with annual plans." }, children: [] },
      ],
    },
    {
      id: "tpl-pricing-yearly-grid",
      type: "frame",
      name: "Plans yearly",
      props: {
        ...defaultFramePropsRecord(),
        layoutType: "grid",
        columns: 1,
        gap: 14,
        when: { md: { columns: 3, gap: 18 } },
      },
      children: [
        {
          id: "tpl-pricing-yearly-a",
          type: "card",
          name: "Starter yearly",
          props: { surface: "muted", padding: 16, radius: 12, interaction: "none" },
          children: [
            { id: "tpl-pricing-yearly-a-h", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Starter", level: 4 }, children: [] },
            { id: "tpl-pricing-yearly-a-p", type: "text", props: { ...defaultTextPropsRecord(), text: "$0 / year", sizeScale: "lg" }, children: [] },
            { id: "tpl-pricing-yearly-a-b", type: "button", props: { ...defaultButtonPropsRecord(), label: "Start free", variant: "secondary" }, children: [] },
          ],
        },
        {
          id: "tpl-pricing-yearly-b",
          type: "card",
          name: "Pro yearly",
          props: { surface: "inverse", padding: 16, radius: 12, interaction: "glow" },
          children: [
            { id: "tpl-pricing-yearly-b-h", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Pro", level: 4 }, children: [] },
            { id: "tpl-pricing-yearly-b-p", type: "text", props: { ...defaultTextPropsRecord(), text: "$24 / month billed yearly", tone: "inverse", sizeScale: "lg" }, children: [] },
            { id: "tpl-pricing-yearly-b-b", type: "button", props: { ...defaultButtonPropsRecord(), label: "Choose Pro", variant: "inverse" }, children: [] },
          ],
        },
        {
          id: "tpl-pricing-yearly-c",
          type: "card",
          name: "Scale yearly",
          props: { surface: "muted", padding: 16, radius: 12, interaction: "none" },
          children: [
            { id: "tpl-pricing-yearly-c-h", type: "heading", props: { ...defaultHeadingPropsRecord(), text: "Scale", level: 4 }, children: [] },
            { id: "tpl-pricing-yearly-c-p", type: "text", props: { ...defaultTextPropsRecord(), text: "Custom contract", sizeScale: "lg" }, children: [] },
            { id: "tpl-pricing-yearly-c-b", type: "button", props: { ...defaultButtonPropsRecord(), label: "Talk to sales", variant: "secondary" }, children: [] },
          ],
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
  {
    id: "builtin-grid-132",
    title: "Responsive grid 1 -> 2 -> 3",
    description: "Card grid recipe: mobile 1 col, md 2 cols, lg 3 cols (`when` min-width).",
    accent: "violet",
    root: gridCards132Root,
  },
  {
    id: "builtin-grid-24",
    title: "Responsive stats 2 -> 4",
    description: "Compact stat grid: base 2 cols, lg 4 cols (`when` min-width).",
    accent: "amber",
    root: grid24Root,
  },
  {
    id: "builtin-grid-pricing-13",
    title: "Pricing grid 1 -> 3",
    description: "Pricing recipe: base 1 col, lg 3 cols with highlighted middle plan.",
    accent: "blue",
    root: pricing13Root,
  },
  {
    id: "builtin-media-crop-rounded",
    title: "Rounded media crop",
    description: "Image crop container recipe: overflow hidden + frame radius + image fill/cover.",
    accent: "emerald",
    root: mediaCropRoot,
  },
  {
    id: "builtin-pricing-monthly",
    title: "Pricing cards (monthly)",
    description: "Three-tier pricing cards with highlighted middle plan (mobile 1 col -> desktop 3 cols).",
    accent: "violet",
    root: pricingMonthlyRoot,
  },
  {
    id: "builtin-pricing-yearly-save",
    title: "Pricing cards (yearly + save)",
    description: "Yearly billing recipe with savings banner and highlighted annual pro tier.",
    accent: "amber",
    root: pricingYearlySaveRoot,
  },
];
