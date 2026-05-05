# Phase 3 — Document-level theme, responsive frame overrides, and page meta

*Status: accepted*  
*Date: 2026-05-04*

## Context and Problem Statement

Phase 3 of `docs/roadmap/LandingPageBlocks.md` requires: (1) **design tokens / theme** scoped to the canonical page document, (2) **breakpoint-specific props** so the same tree behaves differently on narrow vs wide viewports, and (3) **SEO / social metadata** per page without ad-hoc routes.

We needed a single coherent model that stays **parseable (Zod)**, **agent-friendly**, works in **both** the public site and the **draft iframe** (where viewport width equals the editor’s chosen breakpoint width), and avoids **raw CSS strings** in JSON.

## Decision Drivers

* **SSOT:** `OpenframePageDocument` remains the single source; optional top-level keys preserve backward compatibility with existing `version` + `root` JSON.
* **Editor / preview parity:** Theme and meta apply wherever `renderPageDocument` runs; responsive rules must react to **iframe width** (same as switching Mobile / Tablet / Desktop in the editor).
* **Bounded surface:** Enums and small structured bags instead of unlimited Tailwind strings.
* **Incremental delivery:** Ship **3.1** (theme) + **3.2** (responsive) + **3.3** (meta) in one vertical slice with clear extension points.

## Considered Options

1. **Bump document `version` to 2** and nest everything under a new root envelope — clean break, but forces migration of all stored pages and examples.
2. **Optional top-level `theme`, `meta` on `version: 1`** — old files validate unchanged; new fields are strictly Zod-validated.
3. **Responsive props as duplicated node keys** (e.g. `paddingMd`) — simple for agents, but explodes combinatorics and normalizer complexity across blocks.
4. **Nested `when: { sm?, md?, lg? }` per block** — localized, matches mental model “overrides from this min-width up”; only implemented for **`frame`** first (highest leverage).

## Decision Outcome

We chose **option 2 + 4**:

* **`theme`** (optional) on `OpenframePageDocument`: `radius`, `colorScheme`, `typographyScale` as **enums**; mapped in `page-theme.ts` to **Tailwind class strings** on the page shell (public `PageShell` + draft root wrapper). No arbitrary hex in `theme` in this slice (Phase 1b block props remain the place for semantic surfaces).
* **`meta`** (optional): `title`, `description`, `ogImage` (string URL/path); consumed by Next **`generateMetadata`** on `/` and `/[slug]`.
* **Responsive:** `frame` accepts optional `props.when` with keys **`sm` \| `md` \| `lg`** (min-width **640 / 768 / 1024** px, aligned with common Tailwind defaults). Each value is a **partial override** of `gap`, `padding`, `columns` (grid only), `visible`. Overrides are emitted as a **scoped `<style>` block** using `[data-of-node-id="…"]` + `@media (min-width: …)` with `!important` so they win over inline layout styles at matching breakpoints — including inside the narrow draft iframe.

### Positive Consequences

* One document carries **look (theme)**, **layout responsiveness (frame)**, and **discovery (meta)** without new services.
* Editor breakpoint pills continue to drive **iframe width**; CSS media queries naturally re-evaluate — satisfies Phase 3 exit: “same tree, different Mobile vs Desktop”.

### Negative Consequences

* **Per-frame `<style>`** tags scale with the number of responsive frames (acceptable MVP; can be hoisted to a single collector later).
* **`!important`** in responsive CSS is a blunt tool; future refactors may move layout to CSS variables to reduce specificity pressure.
* **`ogImage`** is stored as a string only — callers must ensure URLs are safe on the public site (same trust model as `image.src`).
