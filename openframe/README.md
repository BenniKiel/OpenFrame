# OpenFrame file contract (MVP)

OpenFrame treats a small set of **repo-local files** as the interchange surface for:

- the visual editor
- the preview renderer
- external agent workflows (Claude/Cursor/Copilot/etc.)

This folder contains **examples** you can copy into a project workspace while the product hardens.

## Files

| File | Purpose |
| ---- | ------- |
| `openframe.project.json` | Project metadata (name, default page slug) |
| `openframe.page.json` | Canonical page document (tree + props) |
| `openframe.schema.json` | JSON Schema (Draft 2020-12) snapshot of `OpenframePageDocument` structure — keep in sync with `src/lib/openframe/page-document.ts` |

## Examples

See `examples/` in this directory.

| Example | Purpose |
| ------- | ------- |
| `examples/openframe.page.json` | Small layout demo (hero row + texts) |
| `examples/landing-mvp.page.json` | **Golden “landing MVP”** — nested hero frame + CTA row placeholders (built-in blocks only); use as agent prompt template |
