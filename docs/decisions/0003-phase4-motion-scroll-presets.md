# Phase 4 — Declarative scroll-reveal motion presets

*Status: accepted*  
*Date: 2026-05-04*

## Context and Problem Statement

Phase 4 in `docs/roadmap/LandingPageBlocks.md` asks for **motion as declarative presets** (not arbitrary scripts), with scroll-reveal behaviour confined to the **site / draft iframe bundle** — no global listeners in the **editor chrome**.

We need a minimal, **agent-friendly** JSON surface that survives **`parsePageDocument`**, works in **SSR + client** without brittle hydration, and stays maintainable without pulling **GSAP** into the default path (explicitly deferred per roadmap 4.2 / `PreviewRenderer.md`).

## Decision Drivers

* **Bounded JSON:** small enum on existing blocks (`section`, `frame`) — no new arbitrary string fields for CSS/JS.
* **Progressive enhancement:** content must remain usable with **JS disabled** (no permanent `opacity: 0`).
* **Accessibility:** respect **`prefers-reduced-motion`** — skip reveal animation and show content immediately.
* **Isolation:** IntersectionObserver only inside a **client** subtree of the preview/public page — never in `editor-app` chrome.

## Considered Options

1. **GSAP / Lenis in core** — powerful, but violates MVP “no GSAP in renderer” spirit and blows bundle + agent surface.
2. **CSS-only scroll-driven animations** (`animation-timeline: view()`) — elegant, but uneven support and harder to gate per-node from JSON.
3. **Small client wrapper + `IntersectionObserver` + Tailwind transition classes** — one boundary component, presets as enum, optional future stagger via child `animation-delay` CSS.

## Decision Outcome

We chose **option 3**:

* New prop **`scrollReveal`** on **`section`** and **`frame`**: `none` \| `fade-up` \| `fade-in` \| `slide-left` (normalized in `motion-presets.ts`).
* **`ScrollReveal`** (`src/lib/preview/motion/scroll-reveal.tsx`, `"use client"`): after **client mount**, applies initial hidden classes, observes intersection once, then transitions to visible. Before mount, children render **unwrapped** so SSR/first paint match and content is not stuck hidden.
* **`prefers-reduced-motion: reduce`:** skip animation; show children immediately after mount.
* **No JS:** global CSS in `globals.css` targets `[data-of-scroll-reveal]` under `@media (scripting: none)` to force visible layout (progressive enhancement).
* **Test / legacy environments:** if `window.matchMedia` or `IntersectionObserver` is missing, **`ScrollReveal`** treats the block as already visible (no observer) so SSR tests and older runtimes do not throw.

### Positive Consequences

* Meets Phase 4 exit: **one preset** is storable in canonical JSON and stable in public + draft renderers.
* Clear extension point for **stagger** (child `animation-delay` or nested preset) and optional **GSAP module** later without changing the enum contract.

### Negative Consequences

* First client frame after mount may briefly apply “hidden” styles before intersection fires — acceptable for below-the-fold sections; hero presets should use `none` or a follow-up “in-view on mount” heuristic if needed.

### Product note (roadmap alignment)

* **“Timeline-lite”** in `LandingPageBlocks.md` was naming a *hypothetical* small first-party sequence layer (bounded JSON + minimal orchestration), **not** a shipped GSAP feature. **GSAP** is the intended **opt-in** path for richer timelines later (**Phase 4.2**). The library itself is **free** (no paid GSAP license for integrators); any **“Premium”** wording refers to an **OpenFrame product tier / optional motion bundle** (bundle weight, editor surface, support), not paying GreenSock for GSAP. The open-core stack stays on **`ScrollReveal`** + presets unless that optional module is enabled.
