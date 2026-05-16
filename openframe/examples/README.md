# OpenFrame examples (agent contract)

These files are the **file-level contract** for tools that edit pages outside the UI (Cursor, Claude, CI).

## Local `home` out of sync?

Public **`/`** reads **`home`** from SQLite. If it diverges from this folder’s **`home-showcase.page.json`** (e.g. tests or manual edits), reset from the repo root:

```bash
pnpm seed:home -- --force
```

(Same `DATABASE_PATH` as the Next app; destructive overwrite — requires `--force`.)

## Page documents

- **`*.page.json`** — each file is a full `OpenframePageDocument` (see Zod in `apps/web/src/lib/openframe/page-document.ts` and snapshot `openframe/openframe.schema.json`).
- **Validate locally (Stufe A):** from repo root run `pnpm validate:examples` — prints Zod issues per file (use `--json` for machine output). The same checks run in `pnpm test` via `example-pages-golden.test.ts`.

## Project file

- **`openframe.project.json`** — `OpenframeProjectFile` template (name, default page slug).

## Stufen B und C (Playwright)

Von Repo-Root: **`pnpm report:page-visual`** (dev-Server wird bei Bedarf gestartet; laufender `pnpm dev` wird wiederverwendet).

- **B:** JSON unter `artifacts/page-reports/{slug}-report.json` — pro Knoten u. a. **`parentNodeId`**, **`depth`**, **`path`**, Tag, **`role`**, **`headingLevel`** (bei `h1`–`h6` / `role="heading"`+`aria-level`), **`linkHref`** (bei `<a>`), **`formControl`** (bei `<input>` / `<textarea>` / `<select>`-Host), ARIA-artige Felder, Textauszug, Sichtbarkeit, **`box`** (Viewport/CSS-Pixel, siehe `coordinateSpace` / `devicePixelRatio` / `boxNote`).
  - Ohne Fokus: die ganze Seite. Mit **`PAGE_FOCUS_NODE_IDS`**: Schnitt aus Nachfahren der Fokus-Knoten **plus** alle OpenFrame-Vorfahren (Kette mit `data-of-node-id` bis oben), damit `root` im Report bleibt.
- **C:** Full-Page-PNG `artifacts/page-reports/{slug}-full.png` (weglassen: **`SKIP_SCREENSHOT=1`**). Pro Fokus-ID zusätzlich **`{slug}-focus-{id}.png`** (Element-Screenshot), sofern nicht `SKIP_SCREENSHOT`.
  - Nur Ausschnitte, kein Full-Page: **`SKIP_FULL_PAGE_SCREENSHOT=1`** — erfordert gesetztes **`PAGE_FOCUS_NODE_IDS`** (kommasepariert).

**CI (ohne PNG):** von Root **`pnpm report:page-visual:ci`** — setzt intern `SKIP_SCREENSHOT=1`, prüft öffentliches **`home`** + DOM-Report. Eingebunden in **`pnpm ci:check`** (zwischen Unit-Tests und Build).

**Slugs**

- Eine Seite: **`PAGE_SLUG=landing-mvp`** (Slug wie persistierter Seitenname; `home` lädt **`/`**).
- Mehrere nacheinander: **`PAGE_SLUGS=home,about`** — jeder Slug muss in der App(**SQLite**) existieren, sonst 404.

**Diff / kleinere Reports**

- **`PAGE_REPORT_NODE_IDS`** — kommaseparierte `data-of-node-id`-Liste: **`stufeB.nodes`** enthält **nur** diese Zeilen, **Reihenfolge wie angegeben** (nach Deduplizierung). IDs müssen im erfassten DOM-Schnitt liegen (ggf. **`PAGE_FOCUS_NODE_IDS`** setzen). Ohne `root` in der Liste erscheint `root` nicht im JSON.
- **`PAGE_REPORT_COMPACT=1`** — lässt in jeder Knotenzeile **`null`**-Felder (und leere Objekte nach Strippen) weg; **`stufeB.compactNullFields`** ist dann `true`.

```bash
PAGE_REPORT_NODE_IDS=root,hm-nav PAGE_REPORT_COMPACT=1 pnpm report:page-visual
```

**Fokus (kommaseparierte PageNode-Ids)**

```bash
PAGE_FOCUS_NODE_IDS=hm-sec-hero pnpm report:page-visual
PAGE_FOCUS_NODE_IDS=hm-sec-hero,hm-nav SKIP_FULL_PAGE_SCREENSHOT=1 pnpm report:page-visual
```
