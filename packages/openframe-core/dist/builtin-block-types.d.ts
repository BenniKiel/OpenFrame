/**
 * Built-in block `type` strings supported by the preview renderer (`blockRegistry`).
 * Unknown types still parse as `PageNode` but render as {@link UnknownTypeFallback}.
 *
 * Keep this object in sync with `blockRegistry` in `src/lib/preview/block-components.tsx`
 * — enforced by `src/lib/preview/block-registry.test.ts`.
 */
export declare const BUILTIN_BLOCK_TYPES: {
    readonly container: {
        readonly summary: "Document shell: stacks children vertically with panel styling; `position: relative` for absolutely positioned descendants.";
    };
    readonly frame: {
        readonly summary: "Layout region: stack/grid, axis size modes, optional `fill`, `surface`, visible, insets, overflow, z-index; optional `when.sm|md|lg`; motion: `scrollReveal` (Open-Core), optional `motionEngine` (`core`|`gsap`), `timelinePreset` (`none`|`revealStagger`|`heroSequence`), `scrollTrigger` object — GSAP path requires Motion Pro env at runtime (`motion-contract.ts`, ADR 0004).";
    };
    readonly text: {
        readonly summary: "Body copy: `props.text`, optional `as` (p|span), `maxWidth` (px), `align` (start|center|end), and optional `sizeScale` (sm|base|lg|xl).";
    };
    readonly heading: {
        readonly summary: "Heading: `text`, `level` 1–6, `align`, optional `as` tag override (`h1`–`h6` or `p`).";
    };
    readonly link: {
        readonly summary: "Inline link: `href`, `label`, `external` (opens new tab with rel).";
    };
    readonly button: {
        readonly summary: "CTA: `label`, optional `href` (anchor vs button), `variant` primary|secondary|ghost.";
    };
    readonly image: {
        readonly summary: "Raster `<img>`: `src`, `alt`, Framer-style `widthSizeMode`/`heightSizeMode` + dimensions, `fit` cover|contain|fill|none.";
    };
    readonly section: {
        readonly summary: "Semantic `<section>` landmark; optional `anchorId`; same motion props as `frame` (`scrollReveal`, optional GSAP fields).";
    };
    readonly split: {
        readonly summary: "Two-column row (stacks on small viewports): `gap`, cross-axis `align`, optional `ratio` equal|startWide|endWide when there are two children.";
    };
    readonly card: {
        readonly summary: "Inset surface panel: `surface`, `padding`, `radius`; children for body (and optional heading/image as nested nodes).";
    };
    readonly faq: {
        readonly summary: "FAQ accordion: `items` as `{ question, answer }[]` (max 32), optional `surface`; native `<details>` rows; no tree `children` (data-only block).";
    };
    readonly testimonial: {
        readonly summary: "Single testimonial card: `quote`, `author`, optional `role` and `avatarSrc`, optional `surface`; no tree `children`.";
    };
    readonly "logo-cloud": {
        readonly summary: "Logo grid: optional `title`, `logos` as `{ name, src }[]` (max 24), optional `surface`; no tree `children`.";
    };
    readonly "nav-header": {
        readonly summary: "Simple marketing header row: `logoLabel`/`logoHref`, nav `links` (`{ label, href }[]`, max 8), optional CTA (`ctaLabel`/`ctaHref`), optional `surface`; no tree `children`.";
    };
};
export type BuiltinBlockType = keyof typeof BUILTIN_BLOCK_TYPES;
/** Stable iteration order for docs and agent prompts. */
export declare const BUILTIN_BLOCK_TYPE_ORDER: BuiltinBlockType[];
export declare function isBuiltinBlockType(type: string): type is BuiltinBlockType;
export declare function listBuiltinBlockTypes(): {
    type: BuiltinBlockType;
    summary: string;
}[];
