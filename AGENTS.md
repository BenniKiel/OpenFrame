<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Changeset Reminder Rule

When working in this repository, agents MUST proactively evaluate whether a changeset is required.

- Trigger this check for every task that touches `packages/openframe-core/**` or changes public exports/types/contracts used by npm consumers.
- If a changeset is required, remind the user and propose running `pnpm changeset` with the correct semver bump (`patch`, `minor`, `major`).
- If changes affect only `apps/web/**` or internal tooling/docs without public `@benjaminkiel/openframe` impact, explicitly state that no changeset is needed.
- Before finishing implementation work, include a short "Changeset: required / not required" note in the final response.

## Canonical page edits (agent loop)

When changing page JSON under `openframe/examples/` or any persisted page contract:

1. **`pnpm validate:examples`** — Zod gate on golden `*.page.json`.
2. **`pnpm report:page-visual`** (optional, local) or rely on **`pnpm report:page-visual:ci`** in **`pnpm ci:check`** — DOM report under `artifacts/page-reports/` (`stufeB.nodes`: tree fields plus `headingLevel`, `linkHref`, `formControl`, etc.).
3. If public **`/`** still shows an old `home` from SQLite, run **`pnpm seed:home -- --force`** to overwrite `home` with the canonical showcase (`home-showcase-document.ts`).
4. Treat **`openframe/examples/README.md`** as the env reference (`PAGE_SLUGS`, `PAGE_FOCUS_NODE_IDS`, `PAGE_REPORT_NODE_IDS`, `PAGE_REPORT_COMPACT`, screenshot flags).
