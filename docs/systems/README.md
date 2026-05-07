# Systems index

Per the **system design standards** (C4 component level), each system in this folder is documented as one Markdown file. Add new files when you introduce components and link them from this index.

## Index

- [Canonical Document & Schema](./CanonicalDocumentSchema.md) — SSOT JSON for pages and project metadata; Zod validation boundary for editor, renderer, persistence, and agents.
- [Persistence](./Persistence.md) — SQLite + Drizzle; durable storage for validated page documents; Node server runtime only.
- [Preview Renderer](./PreviewRenderer.md) — `OpenframePageDocument` → React via the shared `renderPageDocument` pipeline used by both the public site (`/[slug]`) and the editor draft frame (`/admin/preview/frame?draft=1`).
- [Editor Core](./EditorCore.md) — admin studio shell at `/admin/editor`: Zustand/Immer document state, tree + props, load/save via Pages API, preview iframe integration, top bar (View site + Settings + Save), **Ctrl+S / ⌘S** save when dirty. Hub at `/admin`; reference UI at `/admin/settings` (external tools + API, no in-app model picker).
- [Draft Preview](./DraftPreview.md) — live iframe preview of unsaved `OpenframePageDocument` at `/admin/preview/frame?draft=1` via same-origin `postMessage`; optional wheel/pinch bridge from the frame to the editor; `preview-wheel-bridge.ts`.
- [Public Site](./PublicSite.md) — server-rendered public routes `/` (home with auto-seed) and `/[slug]` reading from `pageRepository`; reserved-slug guard.
- [Custom Components](./CustomComponents.md) — Dynamic component registry via JSON manifests and discovery API, allowing user-provided TSX blocks.

## Roadmaps (cross-cutting)

- [Landing Page Blocks & Agent-Interop](../roadmap/LandingPageBlocks.md) — phased plan for block types, design tokens, responsive props, and agent-facing examples beyond the current MVP registry.

## System design standards (summary)

Every `docs/systems/*.md` document must follow this structure:

1. **Component overview** — Short summary of responsibility and which C4 container it lives in.
2. **Architecture diagram (Mermaid)** — Flowchart or class diagram for internal flows and connections to other components. Keep graphs simple; avoid special characters in node IDs unless the label is quoted in brackets (e.g. `Node["Label (detail)"]`).
3. **Public interfaces (API)** — Methods, events, or hooks exposed to other components.
4. **Dependencies** — Other systems or external modules this component relies on.
5. **Data structures & state management** — Core data shapes and how state is owned and updated.
6. **Known limitations / edge cases** — Constraints, bugs, and boundary behavior.
7. **Testing & verification** — How to run or exercise the system locally (commands, flows, APIs).

For day-to-day work, follow **continuous documentation**: read `docs/01_Concept.md` and `docs/02_TechStack.md` before substantive changes; do not load every system file at once—use this README and targeted search, then open only the 1–2 system docs you need. After code or API changes, update the relevant docs in the same change, including this index when adding or removing a system.
