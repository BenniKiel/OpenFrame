# Home showcase: modern React page concept (OpenFrame)

## Design concept

Zielbild: **state-of-the-art** Marketing-Startseite mit **ruhigem, cleanem Layout**, gezielt eingesetzten **Farbverläufen** und **weichen Formen** (radiale „Orbs“, große Radien, klare Typo-Hierarchie).

**Säulen:**

1. **Hero** — Großzügiger vertikaler Raum, **linearer Mesh-Verlauf** als Fläche, zwei **radiale** Akzent-Layer (absolute positioniert) für Tiefe ohne Bild-Asset, zentrierter **Kicker → Headline → Lead → CTA-Zeile**.
2. **Highlights** — **Responsive Grid** (`frame` + `when`: 1 / 2 / 3 Spalten), **Cards** mit `interaction: "lift"` für Premium-Feel.
3. **Workflow** — **Split** mit **gradient-gefülltem** Panel (dunkler Verlauf) + erklärender Spalte (Bullet-Texte).
4. **Footer** — Kompakter **muted**-Block, zentriert.

Technisch alles als **`OpenframePageDocument`**: gleiche Quelle für Editor, Draft-iframe und Public Site (`/` lädt `home` aus SQLite; frische Instanzen seeden dieses Dokument).

## Umsetzung im Repo

| Artefakt | Rolle |
| -------- | ----- |
| `apps/web/src/lib/editor/home-showcase-document.ts` | Kanonische Definition (TypeScript + `parsePageDocument`). |
| `apps/web/src/lib/editor/starter-document.ts` | `getStarterPageDocument()` liefert `structuredClone` dieses Baums (404 im Editor, neuer Slug). |
| `openframe/examples/home-showcase.page.json` | JSON für Agenten / Diff; nach TS-Änderungen aus `homeShowcasePageDocument` neu exportieren (z. B. `tsx` one-liner, siehe letzter PR). |

**SQLite vs. Showcase:** `/` liest die Zeile `home` aus der DB. **Auto-Seed** unter `/` läuft nur, wenn `home` **fehlt**. Eine bestehende Zeile wird **nicht** automatisch ersetzt — dafür **`pnpm seed:home -- --force`** (Repo-Root), siehe auch Haupt-`README.md`.

## Wo OpenFrame eingrenzt oder es aufwendiger macht

| Thema | Einschränkung / Reibung |
| ----- | ------------------------ |
| **Freies Styling** | Keine beliebigen Tailwind-/CSS-Strings im JSON — Farben in **Fills** nur als **Hex** (linear/radial/conic/solid); semantische **Surfaces** und **Tones** statt freier Utility-Klassen. |
| **Komplexe Formen** | Keine nativen SVG-/Blob-Pfade als Primitive; „Formen“ sind **Layout + `border-radius` + Verläufe** oder Bilder (`image` / `fill.type: image` mit erlaubten URLs). **Blur**, **Filter**, **clip-path** außerhalb der Block-Props sind nicht direkt modellierbar. |
| **Sticky / komplexes Nav** | `nav-header` ist **datengetrieben** und absichtlich schlank — kein Mega-Menu, kein sticky-Prop im Schema (Workaround: Custom Component / Code-Route laut Konzept). |
| **Typografie-Feintuning** | Stark, aber über **Enums** (`sizeScale`, `leading`, `tracking`, `when` auf Text/Heading) — kein beliebiges `font-family` pro Knoten ohne Erweiterung des Schemas. |
| **Bereits persistierte `home`** | SQLite behält die alte Zeile: **Auto-Seed** unter `/` greift nur bei `not_found`. Showcase aktualisieren: **`pnpm seed:home -- --force`** (überschreibt `home`), oder DB-Zeile löschen und `/` neu laden, oder Inhalt aus `home-showcase.page.json` im Editor speichern. |
| **Motion** | Scroll-Reveal ist **preset-basiert**; schwere Timeline-/Scrubbing-Motion ist **Motion Pro / Escape Hatch** — nicht nötig für dieses Showcase. |

## Nächste sinnvolle Erweiterungen (optional)

- Zusätzliche **Hero-Dekoration** nur über Custom Component oder erlaubtes **SVG-Image** (Remote-URL).
- **Design-Token-Erweiterung** für 1–2 feste „Brand“-Gradient-Presets (weniger manuelle Stops im JSON).
- **Pricing / Tabs** laut `SaaSLandingPageBacklog.md`, wenn ein datengetriebener Block eingeführt wird.
