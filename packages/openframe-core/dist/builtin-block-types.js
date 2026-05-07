/**
 * Built-in block `type` strings supported by the preview renderer (`blockRegistry`).
 * Unknown types still parse as `PageNode` but render as {@link UnknownTypeFallback}.
 *
 * Keep this object in sync with `blockRegistry` in `src/lib/preview/block-components.tsx`
 * — enforced by `src/lib/preview/block-registry.test.ts`.
 */
export const BUILTIN_BLOCK_TYPES = {
    container: {
        summary: "Document shell: stacks children vertically with panel styling; `position: relative` for absolutely positioned descendants.",
    },
    frame: {
        summary: "Layout region: stack/grid, axis size modes, optional `fill`, `surface`, visible, insets, overflow, z-index; optional `when.sm|md|lg`; motion: `scrollReveal` (Open-Core), optional `motionEngine` (`core`|`gsap`), `timelinePreset` (`none`|`revealStagger`|`heroSequence`), `scrollTrigger` object — GSAP path requires Motion Pro env at runtime (`motion-contract.ts`, ADR 0004).",
    },
    text: {
        summary: "Body copy: `props.text`, optional `as` (p|span), `maxWidth` (px), `align` (start|center|end), and optional `sizeScale` (sm|base|lg|xl).",
    },
    heading: {
        summary: "Heading: `text`, `level` 1–6, `align`, optional `as` tag override (`h1`–`h6` or `p`).",
    },
    link: {
        summary: "Inline link: `href`, `label`, `external` (opens new tab with rel).",
    },
    button: {
        summary: "CTA: `label`, optional `href` (anchor vs button), `variant` primary|secondary|ghost.",
    },
    image: {
        summary: "Raster `<img>`: `src`, `alt`, Framer-style `widthSizeMode`/`heightSizeMode` + dimensions, `fit` cover|contain|fill|none.",
    },
    section: {
        summary: "Semantic `<section>` landmark; optional `anchorId`; same motion props as `frame` (`scrollReveal`, optional GSAP fields).",
    },
    split: {
        summary: "Two-column row (stacks on small viewports): `gap`, cross-axis `align`, optional `ratio` equal|startWide|endWide when there are two children.",
    },
    card: {
        summary: "Inset surface panel: `surface`, `padding`, `radius`; children for body (and optional heading/image as nested nodes).",
    },
    faq: {
        summary: "FAQ accordion: `items` as `{ question, answer }[]` (max 32), optional `surface`; native `<details>` rows; no tree `children` (data-only block).",
    },
    testimonial: {
        summary: "Single testimonial card: `quote`, `author`, optional `role` and `avatarSrc`, optional `surface`; no tree `children`.",
    },
    "logo-cloud": {
        summary: "Logo grid: optional `title`, `logos` as `{ name, src }[]` (max 24), optional `surface`; no tree `children`.",
    },
    "nav-header": {
        summary: "Simple marketing header row: `logoLabel`/`logoHref`, nav `links` (`{ label, href }[]`, max 8), optional CTA (`ctaLabel`/`ctaHref`), optional `surface`; no tree `children`.",
    },
};
/** Stable iteration order for docs and agent prompts. */
export const BUILTIN_BLOCK_TYPE_ORDER = Object.keys(BUILTIN_BLOCK_TYPES);
export function isBuiltinBlockType(type) {
    return type in BUILTIN_BLOCK_TYPES;
}
export function listBuiltinBlockTypes() {
    return BUILTIN_BLOCK_TYPE_ORDER.map((type) => ({
        type,
        summary: BUILTIN_BLOCK_TYPES[type].summary,
    }));
}
