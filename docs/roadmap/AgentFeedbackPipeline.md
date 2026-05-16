# Roadmap: Agent-Feedback-Pipeline (Validate → Struktur → Sicht)

Ziel: Agenten und CI bekommen **vorhersagbare, maschinenlesbare** Signale zu JSON-Seiten (Contract), **gerenderte Struktur** (DOM ↔ PageNode) und optional **visuelles Feedback** — ohne den Editor-Pfad zu ersetzen.

**Stand:** Stufe A (`validate:examples`), Stufe B+C (`report:page-visual`, `report:page-visual:ci` in `ci:check`) mit **`PAGE_SLUGS`**, **`PAGE_FOCUS_NODE_IDS`**, **`SKIP_FULL_PAGE_SCREENSHOT`**, **`PAGE_REPORT_NODE_IDS`**, **`PAGE_REPORT_COMPACT`**, **`parentNodeId` / `depth` / `path`**, Viewport-Metadaten, **`headingLevel`**, **`linkHref`**, **`formControl`** — Details in `openframe/examples/README.md`.

---

## Phase 1 — Fokus & betriebliche Nutzung (kurzfristig)

| Priorität | Thema | Kurzbeschreibung | Deliverable |
| --------- | ----- | ---------------- | ----------- |
| **P1** | Regionale Reports & Screenshots | **`PAGE_FOCUS_NODE_IDS`** (kommasepariert): gefiltertes JSON (Nachfahren + `data-of-node-id`-Vorfahren) und **`locator.screenshot()`** pro Fokus; optional **`SKIP_FULL_PAGE_SCREENSHOT`**. | Erledigt in `e2e/page-visual-report.spec.ts` + Doku |
| **P1** | Slug-Matrix / Batch | **`PAGE_SLUGS=a,b,c`** — ein Playwright-Lauf, ein Test pro Slug (Report + Shot je Slug). Jeder Slug muss in SQLite existieren. | Erledigt (kein gesonderter Index-JSON in v1) |
| **P2** | CI-Gate (leichtgewichtig) | `pnpm report:page-visual:ci` (`SKIP_SCREENSHOT=1`, `apps/web/scripts/page-visual-report-ci.cjs`), in **`pnpm ci:check`** vor dem Build. | Erledigt + `docs/02_TechStack` / `openframe/examples/README` |

---

## Phase 2 — Reichhaltigere strukturelle Signale (mittelfristig)

| Priorität | Thema | Kurzbeschreibung | Deliverable |
| --------- | ----- | ---------------- | ----------- |
| **P2** | Eltern-Kind / Tiefe im Report | Pro Knoten **`parentNodeId`**, **`depth`**, **`path`** (slash-separiert) im JSON. | Erledigt in `page-visual-report.spec.ts` |
| **P2** | Stabilere Box-Koordinaten | **`coordinateSpace`: `"viewport"`**, **`devicePixelRatio`**, **`boxNote`** im Report. | Erledigt (Scroll/Layout-Pixel dokumentiert) |
| **P3** | Semantik erweitern | **`headingLevel`**, **`linkHref`**, **`formControl`** (`input`/`textarea`/`select`); inferiertes **`role`** inkl. `heading` für `h1`–`h6`. | Erledigt in `page-visual-report.spec.ts` |

---

## Phase 3 — Editor- und Agent-Integration (wenn Bedarf)

| Priorität | Thema | Kurzbeschreibung | Deliverable |
| --------- | ----- | ---------------- | ----------- |
| **P3** | „Rezept“ im Agent-Prompt | Kurz in **`AGENTS.md`**: validate → optional report. | Erledigt (Abschnitt unten) |
| **P3** | Diff-freundliche Ausgabe | **`PAGE_REPORT_NODE_IDS`** (Whitelist, Reihenfolge erhalten), optional **`PAGE_REPORT_COMPACT`** (`null`-Felder streichen). Kein Git-Diff in v1. | Erledigt in `page-visual-report.spec.ts` + README |

---

## Nicht-Ziele (bewusst)

- **Kein Ersatz** für echte Accessibility-Audits (axe-core, manuelle Tests).
- **Kein** vollautomatisches visuelles Pixel-Diff-Regressionssystem in v1 — zu fragile Flake-Quelle ohne dediziertes Setup.
- **Keine** Abhängigkeit von `openframe-core` npm-API für diese Pipeline, solange nur `apps/web` betroffen ist (Changesets nur bei Package-Exports).

---

## Abhängigkeiten & Reihenfolge

1. **Regionale Fokus-Screens + gefilterter DOM-Report** entblocken die meisten Agent-Use-Cases (kleinere Bilder, klarer Kontext).
2. **Batch-Slugs** skalieren das für mehrere Golden Pages.
3. **Parent/Tiefe** verbessert Lesbarkeit des Reports ohne neue Infrastruktur.
4. **CI** nur nachdem Runtime und Artefakt-Pfade in der Doku fest sind und Flakiness akzeptabel ist.

---

## Tracking

Änderungen an dieser Roadmap: normale PRs; größere Richtungsentscheide optional als kurzes ADR unter `docs/decisions/`, falls die Pipeline andere Systeme (Preview, Deploy) bindet.
