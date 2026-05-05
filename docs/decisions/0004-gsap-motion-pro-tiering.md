# Phase 4.2 — GSAP timelines behind Motion Pro boundary

*Status: accepted*  
*Date: 2026-05-05*

## Context

Open-Core ships lightweight **`scrollReveal`** (`IntersectionObserver` + CSS). Richer motion requires **GSAP** + **ScrollTrigger**. Product strategy: maintain an **OSS-friendly default build** while allowing a **Motion Pro** capability (editor + runtime) without mixing GSAP imports into core renderer files.

## Decision

1. **Canonical JSON** may express GSAP intent on **`section`** / **`frame`**:
   - `motionEngine`: `"core"` \| `"gsap"`
   - `timelinePreset`: `"none"` \| `"revealStagger"` \| `"heroSequence"`
   - `scrollTrigger`: `{ start, end, scrub, once }` (normalized in `motion-contract.ts`)

2. **Runtime gate:** `NEXT_PUBLIC_OPENFRAME_MOTION_PRO === "1"` (see `motion-capabilities.ts`). If unset or `"0"`, **`BlockMotion`** falls back to **`ScrollReveal`** even when the document requests GSAP—preview stays stable for OSS builds.

3. **Import boundary:** All `gsap` / `ScrollTrigger` imports live under **`src/lib/preview/motion-pro/`** (`gsap-block-motion.tsx`). **`motion-runtime.tsx`** dispatches Core vs Pro and uses `next/dynamic` to load the Pro chunk client-side only.

4. **Progressive enhancement:** `[data-of-gsap-motion]` is unstyled when `scripting: none` (see `globals.css`), parallel to `scroll-reveal`.

## Consequences

* OSS distributions can omit Pro env and never execute GSAP while still parsing the same documents.
* Premium / full builds enable Pro via env + dependency (`gsap` in `package.json`).
* Future extraction to `packages/motion-pro` is straightforward: folder already isolates optional motion.

## Follow-ups

* Optional workspace split (`@openframe/renderer-core` vs `@openframe/motion-pro`) when publishing artifacts.
* Richer timeline DSL or editor UX without widening arbitrary JS in JSON.
