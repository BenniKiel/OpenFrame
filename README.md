# OpenFrame

OpenFrame is a **self-hostable**, **open-source** visual website builder oriented around **React**, **contract-first JSON**, and **agent-friendly workflows** (see `docs/01_Concept.md`).

This repository is bootstrapped as a **Next.js (App Router) + TypeScript** application per `docs/02_TechStack.md`.

## Monorepo layout (bootstrap)

This repository now uses a pnpm workspace:

- `apps/web` (current runtime app)
- `packages/openframe-core` — OSS-facing contracts/types/motion contract exports
- `packages/openframe-motion-pro` — private Motion Pro package entrypoint

Root scripts proxy to `@openframe/web`, so existing `pnpm dev` from root still works.

## Local development

This repo uses **pnpm** (see `packageManager` in `package.json`). Pick **one** way to get `pnpm` on your PATH:

### Option A — Corepack (only if your Node build ships it)

```bash
corepack enable
corepack prepare pnpm@10 --activate
pnpm install
pnpm dev
```

If `corepack: command not found`, use B/C/D below — that is normal for some Homebrew/minimal Node installs.

### Option B — Homebrew (macOS)

```bash
brew install pnpm
pnpm install
pnpm dev
```

### Option C — global install via npm

```bash
npm install -g pnpm@10
pnpm install
pnpm dev
```

### Option D — official standalone installer

See [pnpm installation](https://pnpm.io/installation) (curl / wget script for your shell).

### Option E — no global `pnpm` (works everywhere)

```bash
npx -y pnpm@10 install
npx -y pnpm@10 dev
```

Then open `http://localhost:3000`.

## Tests

```bash
pnpm test
```

## End-to-end smoke tests

Playwright starts `next dev` automatically (see `playwright.config.ts`).

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Database (SQLite)

Default database file for the web app: `apps/web/.data/openframe.db` (gitignored).

```bash
cp apps/web/.env.example apps/web/.env
pnpm db:push
```

## Pages API (persistence MVP)

After `pnpm db:push`, the Node runtime exposes:

- `GET /api/pages` — JSON `{ "slugs": string[] }`
- `GET /api/pages/:slug` — canonical page document JSON, or `404` / `422`
- `PUT /api/pages/:slug` — body = page document JSON; validates with `parsePageDocument` before write; `400` on validation errors with `{ "issues": [...] }`

Slugs must match `isSafePageSlug` (letters, digits, `_`, `-`; no `/` or `..`). See `docs/systems/Persistence.md`.

## Routes (frontend / backend split)

OpenFrame uses a WordPress-style split:

- **Public site (frontend):**
  - `/` — always renders the `home` page; **auto-seeds** it from the starter document on first visit so the site is never empty.
  - `/[slug]` — server-renders a saved canonical page from SQLite via `pageRepository`. Reserved slugs (`admin`, `api`, `_next`, `preview`, `assets`) are rejected by `isSafePageSlug`.
- **Studio (backend):**
  - `/admin` — small hub (links to editor + settings + public site).
  - `/admin/editor` (optional `?slug=…`) — visual builder shell.
  - `/admin/settings` — studio reference (API paths, external tools: Claude CLI, Cursor, Copilot, Antigravity, Claude app — no in-app model UI).
  - `/admin/preview/frame?draft=1` — iframe target for the editor’s live draft (`postMessage` + wheel/pinch bridge); not intended to be opened directly.

See `docs/systems/PublicSite.md`, `docs/systems/EditorCore.md`, `docs/systems/DraftPreview.md`, `docs/systems/PreviewRenderer.md`.

## Editor (visual builder MVP)

- `/admin/editor` — load/save canonical pages via the API; **tree** + **props** for built-in block types (`container`, `text`); **404** on load seeds a starter document you can save.
- Optional query: `/admin/editor?slug=home` (defaults to `home`).
- **Top bar:** brand → `/admin`, current slug, status pill (Saved / Unsaved / Loading), **View site** (opens `/<slug>` in a new tab), **Settings** → `/admin/settings`, **Save** (only enabled while there are unsaved changes; **Ctrl+S** / **⌘S** triggers save when dirty — shortcut is captured on `window` so the browser does not open “Save Page”). Page switching happens in the left **Pages** panel.
- **Theme:** variables on `[data-editor-chrome]` plus **`.ec-*`** classes in `src/app/admin/editor/editor-theme.css` (plain CSS for reliable colors). Override the variables or the `.ec-*` rules.
- **Draft preview column:** compact preset row (active + up to four inline, rest under chevron), **Viewport** panel for custom sizes (`localStorage`). Preset changes keep zoom/pan; **Fit** adjusts zoom to width and resets horizontal pan only.

## Simple Node deployment (example: Hostinger)

High-level steps:

1. Push this repository to GitHub.
2. Create a Node.js app on your host and connect the repository.
3. Set environment variables (at minimum `DATABASE_PATH` pointing to a persistent path on the server).
4. Install dependencies and run `pnpm install`, `pnpm build`, then `pnpm start` (or your host’s equivalent build/start commands).
5. Ensure the SQLite directory is on persistent storage.

## OpenFrame file contract (MVP)

See `openframe/README.md` and `openframe/examples/`.

## Open-Core vs Motion Pro

- **Open-Core**: default behavior, no premium runtime flag required.
- **Motion Pro**: GSAP timeline runtime is enabled only when:
  - `NEXT_PUBLIC_OPENFRAME_MOTION_PRO=1`

This keeps one canonical document format while allowing OSS and premium product tiers.

## Publishing and releases

- Changesets configured in `.changeset/config.json`
- CI workflow: `.github/workflows/ci.yml`
- Release workflow: `.github/workflows/release.yml`
- Public package target: `@openframe/core`
- Private packages excluded from publish: `@openframe/web`, `@openframe/motion-pro`

Commands:

```bash
pnpm changeset
pnpm version-packages
pnpm release-packages
```

Build and inspect the public package locally:

```bash
pnpm --filter @openframe/core build
pnpm --filter @openframe/core pack
```

## Documentation

- `docs/01_Concept.md`
- `docs/02_TechStack.md`
- `docs/systems/README.md`
- `docs/release/OpenCoreRelease.md`
