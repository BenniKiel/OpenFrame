# Tech Stack

## Overview

OpenFrame MVP uses a **TypeScript-first app** with a **workspace bootstrap** (root app + package boundaries) optimized for:

- Fast local iteration for dogfooding
- Contract-first AI/agent interoperability
- Simple Node deployment from GitHub (e.g. Hostinger)
 - Incremental Open-Core / Motion-Pro separation without early repo split

Guiding principle: **KISS over completeness**. Prefer fewer moving parts over maximum flexibility in v1.

## Runtime, Language & Core Platform

- **Language:** TypeScript 5.x
- **Runtime:** Node.js 22 LTS
- **Package manager:** pnpm 10
- **Module system:** ESM
- **Validation baseline:** strict `tsconfig` + shared schema validation with Zod

## Application Framework or Engine

- **Framework:** Next.js 16 (App Router)
- **UI library:** React 19
- **Styling:** Tailwind CSS v4
- **UI primitives:** shadcn/ui (Radix-based) for fast editor shell development
- **Drag and drop:** dnd-kit for component tree/canvas interactions

Rationale:
- Next.js keeps frontend + backend endpoints in one deployable Node app.
- App Router supports a clean split between editor routes and runtime preview routes.
- Ecosystem maturity accelerates MVP delivery.

## Data, Persistence & External Services

- **Canonical document format:** JSON (single source of truth), validated by Zod schemas
- **Storage (MVP):** SQLite (single-file DB) via Drizzle ORM
- **File contract for AI tools:** `/openframe/` workspace contract with:
  - `openframe/examples/openframe.project.json` (project metadata template)
  - `openframe/examples/*.page.json` (page trees; **golden:** `landing-mvp.page.json`)
  - `openframe/openframe.schema.json` (JSON Schema snapshot of `OpenframePageDocument`; sync with `page-document.ts`)
- **Preview rendering:** React renderer consumes canonical JSON, not arbitrary TSX
- **External AI model providers:** not hard-wired in MVP; AI tools operate through documented file/schema contract

Notes:
- This avoids lock-in and allows Claude/Cursor/Copilot-style agents to safely edit known artifacts.
- Database complexity stays minimal while preserving migration paths.

## State Management & Architecture Patterns

- **Client state:** Zustand + Immer
- **Server data access:** thin repository layer on top of Drizzle
- **Architecture pattern:** Contract-First SSOT
  - Canonical JSON = source of truth
  - Visual editor and renderer are projections of the same data
  - Agent roundtrip edits must pass schema validation before persistence
- **Error handling:** typed result boundaries (`zod` parse errors surfaced in editor diagnostics)

This pattern directly addresses the core risk: code/agent output drifting from visual model constraints.

## Motion, creative libraries & escape hatches

**MVP dependency baseline:** The core stack above **does not require** [GSAP](https://gsap.com/docs/v3/), [Lenis](https://lenis.darkroom.engineering/), or [Three.js](https://threejs.org/docs/) as mandatory packages. The MVP proves **Canonical JSON ↔ editor ↔ React preview ↔ agent file contract**.

**Product architecture (aligned with `docs/01_Concept.md`):**

- **Hybrid escape hatches** are first-class *concepts*, not necessarily first-class *UI surface* in v1:
  - **Code-first routes** for maximum freedom (heavy GSAP / THREE scenes).
  - **Island / slot blocks** on otherwise visual pages: module reference + bounded metadata while the rest stays in the canonical model.
- **Preview isolation:** Prefer an **iframe** (or equivalent hard boundary) between **editor shell** and **site preview**, so global scroll smoothing, `requestAnimationFrame` loops, and canvas/WebGL contexts do not destabilize the builder UI.
- **Optional future “Motion Layer”:** If/when shipped (possibly as a non-core / **OpenFrame** premium-tier bundle — **not** because GSAP charges for the library; **GSAP is free**), Lenis + GSAP would sit behind a **small JSON DSL** executed by a supported runtime — not arbitrary imperative snippets for every property. That keeps validation, diffs, and AI edits predictable.

**Tech stack implication:** **No change** to the chosen TypeScript / Next.js / React / Zod / SQLite foundation. Motion libraries are **optional runtime additions** or live inside **explicit escape-hatch modules**, with clear lifecycle and bundling rules decided per system in `docs/systems/` when implemented.

## Tooling, Build & Deployment

- **Build/dev:** Next.js (`next dev`, `next build`, `next start`)
- **Linting:** ESLint 9 + TypeScript ESLint
- **Formatting:** Prettier 3
- **Testing:**
  - Unit/component: Vitest + Testing Library
  - E2E smoke (editor open, edit, save, reload): Playwright
- **Migrations:** Drizzle Kit
- **Deployment target (MVP):** Node app from GitHub on simple hosts (e.g. Hostinger Node hosting)
- **Containerization:** optional post-MVP (not required for first release)

Minimum deployment contract:
1. Pull from GitHub
2. Install dependencies
3. Build Next.js app
4. Start Node process
5. Configure persistent path for SQLite file

The repository uses **pnpm** with a pinned `packageManager` field in `package.json` (Corepack-compatible). See the root `README.md` for install commands.

## Reference Links

- Next.js App Router docs: https://nextjs.org/docs/app
- React docs: https://react.dev
- TypeScript docs: https://www.typescriptlang.org/docs/
- Tailwind CSS docs: https://tailwindcss.com/docs
- dnd-kit docs: https://docs.dndkit.com/
- Zustand docs: https://zustand.docs.pmnd.rs/
- Immer docs: https://immerjs.github.io/immer/
- Zod docs: https://zod.dev/
- Drizzle ORM docs: https://orm.drizzle.team/docs/overview
- SQLite docs: https://www.sqlite.org/docs.html
- Vitest docs: https://vitest.dev/guide/
- Playwright docs: https://playwright.dev/docs/intro
- pnpm docs: https://pnpm.io/
- GSAP documentation: https://gsap.com/docs/v3/
- Lenis documentation: https://lenis.darkroom.engineering/
- Three.js documentation: https://threejs.org/docs/
