# Preview Renderer

## 1. Component Overview

Der **Preview Renderer** wandelt ein **validiertes** `OpenframePageDocument` in einen **React-Elementbaum** um. Er ist die **Laufzeit-Projektion** des Canonical SSOT und wird von zwei Aufrufern gemeinsam genutzt: vom **Public Site Renderer** unter **`/[slug]`** (siehe **`PublicSite.md`**) für persistierte Seiten und vom **Draft Preview Frame** unter **`/admin/preview/frame?draft=1`** (siehe **`DraftPreview.md`**) für den unsaved Editor-Entwurf. Die Komponente lebt im **C4-Container „OpenFrame Web Application“** (Next.js + React 19) und soll **keine** Editor-Chrome-Logik enthalten.

## 2. Architecture Diagram (Mermaid)

```mermaid
flowchart TB
  subgraph sources["Document sources"]
    InlineDoc["Validated document in memory"]
    SlugFetch["Slug load via pageRepository"]
    DraftPost["Draft postMessage from editor"]
  end

  subgraph upstream["Upstream systems"]
    Canonical["Canonical Document and Schema"]
    Persistence["Persistence"]
  end

  subgraph renderer["Preview Renderer"]
    Registry["Block type registry"]
    Walk["Recursive PageNode walk"]
    Elements["React element tree"]
  end

  subgraph consumers["Consumers"]
    PublicRoute["Public route /[slug] (PageShell)"]
    DraftFrame["Draft frame /admin/preview/frame?draft=1"]
  end

  SlugFetch --> Persistence
  Persistence --> Canonical
  InlineDoc --> Canonical
  DraftPost --> Canonical
  Canonical --> Walk
  Registry --> Walk
  Walk --> Elements
  Elements --> PublicRoute
  Elements --> DraftFrame
```

**Kernfluss:** Nur **`OpenframePageDocument`** (nach **`parsePageDocument`**) wird gerendert; unbekannte `type`-Strings fallen auf eine **definierte Fallback-Darstellung** zurück (kein stiller Leer-Render ohne Hinweis).

## 3. Public Interfaces (API)

Ziel: kleine, testbare Oberfläche — implementiert unter `src/lib/preview/`.

| Funktion / Baustein | Zweck |
| ------------------- | ----- |
| **`blockRegistry`** in `block-components.tsx` | `type` → Komponente: `container`, `frame`, `text`, `heading`, `link`, `button`, `image`, `section`, `split`, `card`, `faq`, `testimonial`, `logo-cloud`, `nav-header` — siehe `*-block.tsx` und **`frame-block.tsx`**. |
| **`BUILTIN_BLOCK_TYPES`** / **`listBuiltinBlockTypes`** in `src/lib/openframe/builtin-block-types.ts` | Allowlist der unterstützten Built-in-`type`-Strings (muss mit **`blockRegistry`** übereinstimmen — Test in `block-registry.test.ts`). |
| **`renderPageDocument` / `renderNode`** in `render-page-document.tsx` | Reine Projektion `OpenframePageDocument` → `ReactNode` (rekursiv, `key` = `node.id`). |
| **`readScrollReveal` / `SCROLL_REVEAL_PRESETS`** in `motion-presets.ts` | Allowlist für **`section`/`frame` → `props.scrollReveal`**; siehe ADR **0003**. |
| **`normalizeBlockMotion`** / **`motion-contract.ts`** | `motionEngine`, `timelinePreset`, `scrollTrigger` — canonical Motion-Felder; ADR **0004**. |
| **`isMotionProEnabled`** in `motion-capabilities.ts` | Liest **`NEXT_PUBLIC_OPENFRAME_MOTION_PRO`**; wenn nicht `"1"`, kein GSAP-Laufzeitpfad. |
| **`BlockMotion`** in `motion-runtime.tsx` (Client) | Dispatcher: Open-Core **`ScrollReveal`** vs. dynamisch geladenes **`motion-pro/GsapBlockMotion`**. |
| **`ScrollReveal`** in `motion/scroll-reveal.tsx` (Client Component) | IntersectionObserver-basiertes Reveal nach Mount; `prefers-reduced-motion`, kein GSAP-Import. |
| **`GsapBlockMotion`** in `motion-pro/gsap-block-motion.tsx` (Client) | GSAP **`timeline`** + **ScrollTrigger** — nur aus **`BlockMotion`**, nur wenn Motion Pro aktiv. |
| **`UnknownTypeFallback`** in `block-components.tsx` | Sichtbarer Hinweis bei unbekanntem `type`. |
| **`DEFAULT_PREVIEW_DOCUMENT`** in `default-document.ts` | Validiertes Standard-Dokument für den Draft-Frame, bevor der Editor das erste Mal pusht. |
| **`PageShell`** in `render-page-shell.tsx` | Public-Site-Wrapper (siehe **`PublicSite.md`**); konsumiert `renderPageDocument`. |
| **`/admin/preview/frame?draft=1`** (`src/app/admin/preview/frame/page.tsx`) | Server-Route lädt **`DraftPreviewFrame`** (Client: **`postMessage`**-Dokument + Wheel/Pinch-Bridge zum Parent); siehe **`DraftPreview.md`**. |
| **`@/lib/preview`** (`index.ts`) | Reexports für Aufrufer (inkl. **`preview-wheel-bridge`**). |

### Built-in Block-Typen (Allowlist)

| `type` | Kurzbeschreibung |
| ------ | ---------------- |
| `container` | Seiten-/Root-Hülle; stapelt Kinder vertikal; etabliert Bezugsrahmen für `position: absolute`; optional **`surface`** (semantischer Hintergrund/Kontrast — `CONTAINER_SURFACE_CLASS` in `design-tokens.ts`). |
| `section` | Semantisches **`<section>`**; optional **`anchorId`**; Motion wie **`frame`** (`scrollReveal`, optional GSAP-Felder) — `section-block.tsx`, **`BlockMotion`**. |
| `split` | Zweispalter: **`gap`**, **`align`** (cross-axis), **`ratio`** `equal` \| `startWide` \| `endWide` bei genau zwei Kindern; unter `md` gestapelt — `split-block.tsx`. |
| `card` | Panel mit **`surface`**, **`padding`**, **`radius`**; Kinder (z. B. `heading` / `text` / `image`) — `card-block.tsx`. |
| `faq` | FAQ-Liste: **`items`** als Array von **`{ question, answer }`** (max. 32 Einträge), optional **`surface`**; Darstellung als natives **`<details>`** / **`<summary>`** pro Zeile — **keine** Baum-`children` (rein datengetrieben) — `faq-block.tsx`. |
| `testimonial` | Einzelnes Testimonial: **`quote`**, **`author`**, optional **`role`** und **`avatarSrc`**, optional **`surface`** — **keine** Baum-`children` (datengetrieben) — `testimonial-block.tsx`. |
| `logo-cloud` | Logoliste/Brand-Wand: optionale **`title`**-Zeile, **`logos`** als **`{ name, src }[]`** (max. 24), optional **`surface`** — **keine** Baum-`children` (datengetrieben) — `logo-cloud-block.tsx`. |
| `nav-header` | Einfacher SaaS-Header: **`logoLabel`**/**`logoHref`**, Navigations-**`links`** (`{ label, href }[]`, max. 8), optional **`ctaLabel`**/**`ctaHref`**, optional **`surface`** — **keine** Baum-`children` (datengetrieben) — `nav-header-block.tsx`. |
| `frame` | Layout-Region (Framer-nah): **`layoutType`** / **`direction`** / **`wrap`**; Größe **`widthSizeMode`** / **`heightSizeMode`**; optional **`fill`**; **`surface`**; Motion: **`scrollReveal`** + optional **`motionEngine`** / **`timelinePreset`** / **`scrollTrigger`** (GSAP nur mit Motion Pro). Legacy **`width`**: hug→fit. — `frame-block.tsx`, **`BlockMotion`**, `frame-fill.ts`, `axis-size-mode.ts`. |
| `text` | Fließtext: `text`, optional `as` (p/span), `maxWidth` (px), **`align`** (`start` \| `center` \| `end`), optionale **`sizeScale`** (`sm` \| `base` \| `lg` \| `xl`); **`tone`**, **`leading`**, **`tracking`** (Phase 1b). |
| `heading` | Überschrift: `text`, `level` 1–6, `align`, optional `as` (h1–h6 oder `p`); **`tone`**, **`leading`**, **`tracking`** — `heading-block.tsx`. |
| `link` | Textlink: `href`, `label`, `external` — `link-block.tsx`. |
| `button` | CTA: `label`, optional `href` (sonst `<button>`), `variant` (inkl. **`inverse`** für hohen Kontrast auf dunklen **`surface`**-Flächen) — `button-block.tsx`. |
| `image` | `<img>`: `src`, `alt`, **`widthSizeMode`**/**`heightSizeMode`** (`fixed`\|`relative`\|`fill`\|`fit`), Werte+**`widthUnit`**/**`heightUnit`** (`px`\|`pct`\|`vw`\|`vh`), `fit`, optional **`radiusPx`** (0–64; Legacy-Key **`radius`**) — `image-block.tsx` (beliebige URLs, kein `next/image`-Remote-Setup im MVP). |

Weitere `type`-Werte sind im Zod-Schema erlaubt, rendern aber **`UnknownTypeFallback`**, bis ein Block registriert ist. Agenten-Prompts: **nur** die oben genannten Built-ins. Referenz-JSON: `openframe/examples/landing-mvp.page.json`, Schema-Snapshot: `openframe/openframe.schema.json`. Phase 1 Landing-Minimum siehe **`docs/roadmap/LandingPageBlocks.md`**.

### Autoren-Hinweise (Dogfood): Split vs. Grid, Theme vs. Surface, `when`

- **`frame` max. Breite in Flow:** Ist **`positionMode`** = **`flow`** und **`maxWidthPx`** gesetzt, erhalten die Frame-Shell **`margin-left` / `margin-right: auto`**, damit der Block **horizontal zentriert** bleibt (schmaler als der Eltern-Container).
- **`split` vs. `frame` (Stack/Grid):** **`split`** ist ein **festes Zweispalter-Muster**: unterhalb von Tailwind-**`md`** (768 px) **`flex-col`**, ab **`md`** **`flex-row`**, mit **`gap`**, Quer-Achsen-**`align`**, und bei **genau zwei** Kindern optionalem **`ratio`** (`equal` \| `startWide` \| `endWide` — `split-block.tsx`). **`frame`** mit **`layoutType: "stack"`** oder **`"grid"`** ist der **allgemeine** Layout-Block (Richtung, Wrap, explizite **`columns`** im Grid, Position/Größe, **`when`**). Faustregel: typischer Marketing-Zweispalter (Text + Medien) → **`split`**; **drei+** Spalten, fein justiertes Raster, Framer-nah geschachtelt → **`frame`** (Grid) und ggf. **`when.columns`** für Breakpoints.
- **`document.theme` vs. Block-`surface`:** **`theme`** (optional auf dem Seiten-Document) wirkt auf die **äußere Hülle** um den gesamten Baum (**`pageShellClassNames`** in `page-theme.ts`: u. a. **`colorScheme`**, **`radius`**, **`typographyScale`**) — das ist **kein** Ersatz für lokale Flächen. **`surface`** auf **`container`**, **`frame`**, **`card`** mappt semantische Tokens (**`default`**, **`muted`**, **`inverse`**, **`accent`**, … über `design-tokens.ts`). Auf **`inverse`**-Flächen Primär-CTAs sichtbar halten: **`button.variant`** = **`inverse`**.
- **`frame.props.when` (min-width):** Die Keys **`sm` \| `md` \| `lg`** sind **Untergrenzen** in px (**640 / 768 / 1024**, vgl. Tailwind-Defaults). Jede Stufe ist ein **Teil-Override** von **`gap`**, **`padding`**, **`columns`** (nur wenn **`layoutType`** = **`grid`**), **`visible`**. Ausgabe: **scoped** `@media (min-width: …)` + `[data-of-node-id="…"]` in **`buildFrameResponsiveCss`** (`frame-responsive.ts`), mit **`!important`**, damit die Regeln die Inline-Layoutwerte am Frame schlagen. **Basis-`props`** des Frames gelten als Werte **unterhalb** der kleinsten gesetzten Stufe bzw. vor Anwendung der Medienqueries. Sind **mehrere** Stufen für dieselbe Property gesetzt und die Viewport-Breite erfüllt mehrere Queries, **gewinnt die später ausgegebene Regel** (CSS-Reihenfolge **`sm` → `md` → `lg`** im Generator — größere definierte Stufe setzt sich bei Überschneidung durch). Im **Editor-Draft** entspricht die Viewport-Breite der **iframe-Breite** des gewählten Breakpoint-Presets (siehe ADR **`docs/decisions/0002-phase3-theme-responsive-meta.md`**).

**Konventionen:**

- Der Renderer **vertraut nicht** rohem JSON vom Netz — Eingang entweder bereits typisiert oder über **`parsePageDocument`** / Repository gebündelt.
- **Kein** direkter Zugriff auf SQLite im Renderer-Modul; höchstens über **Persistence**-API-Schicht.
- **Kein** Editor-Chrome im Frame oder im `PageShell` — beide Routen liefern nur den reinen Seiteninhalt.

## 4. Dependencies

| Abhängigkeit | Rolle |
| ------------ | ----- |
| **[Canonical Document & Schema](./CanonicalDocumentSchema.md)** | Eingabeformat, Validierung; Renderer arbeitet auf `OpenframePageDocument` / `PageNode`. |
| **[Persistence](./Persistence.md)** | Wird vom Public Site Renderer (`/[slug]`) genutzt; nicht vom Draft-Frame. |
| **[Public Site](./PublicSite.md)** | Direkter Konsument für persistierte Seiten. |
| **[Draft Preview](./DraftPreview.md)** | Direkter Konsument für unsaved Editor-Bäume. |
| **React 19** | Element-Erzeugung, ggf. `key` aus `PageNode.id` für stabile Listen. |
| **Tailwind CSS** *(Tech-Stack)* | Basis-Styling der Built-in-Blöcke und Fallback. |
| **Next.js App Router** | Server Components für **`/[slug]`**; Client Component für den Draft-Frame. |

**Open-Core vs Motion Pro:** **Lenis / THREE** bleiben außerhalb des MVP-Kerns. **GSAP** ist optional unter **`src/lib/preview/motion-pro/`** und läuft nur, wenn **`NEXT_PUBLIC_OPENFRAME_MOTION_PRO=1`** gesetzt ist (siehe **`motion-capabilities.ts`**, ADR **0004**). Ohne Flag fällt **`BlockMotion`** auf **`ScrollReveal`** zurück — gleiches Canonical JSON, stabile OSS-Builds. **GSAP** als Library ist **kostenlos**; „Pro“ ist eine **OpenFrame**-Produkt-/Bundle-Kante, keine GSAP-Lizenzgebühr.

## 5. Data Structures & State Management

- **Eingabe:** ein **`OpenframePageDocument`** mit Wurzel `root: PageNode`; optional **`theme`** (Seiten-Shell: Radius, Color scheme, Typo-Skala) und **`meta`** (Titel, Beschreibung, OG-Bild) — Zod in `page-document.ts`, siehe ADR `docs/decisions/0002-phase3-theme-responsive-meta.md`.
- **`frame.props.when`:** optionale Breakpoint-Overrides **`sm` \| `md` \| `lg`** (min-width 640 / 768 / 1024 px) mit Teilfeldern `gap`, `padding`, `columns` (nur Grid), `visible` — CSS wird im Renderer als scoped `<style>` + `[data-of-node-id]` ausgegeben (`frame-responsive.ts`). Semantik und Dogfood-Hinweise: Abschnitt **„Autoren-Hinweise“** oben.
- **`section` / `frame` → Motion:** `scrollReveal` via **`ScrollReveal`** (ADR **0003**); zusätzlich **`motionEngine`**, **`timelinePreset`**, **`scrollTrigger`** (`motion-contract.ts`). Wenn **`motionEngine`**=`gsap`, **`timelinePreset`**≠`none` und Motion Pro aktiv → **`GsapBlockMotion`**; sonst **`ScrollReveal`**.
- **Rekursion:** für jeden `PageNode` → Registry-Lookup nach `type` → Komponente rendert `children` als verschachtelte Kinder.
- **Props:** `node.props` wird **typisiert pro Block** über Komponenten-Signatur abgebildet; Keys, die das Schema nicht kennt, werden im MVP entweder **ignoriert** oder **weitergegeben** — Entscheidung pro Block, dokumentieren.
- **State:** der Renderer selbst ist **möglichst stateless** (Function of document); UI-State (Hover, Auswahl) gehört zum **Editor-System**, nicht in den Renderer.

## 6. Known Limitations / Edge Cases

- **Unbekannte `type`:** nur Fallback — kein automatisches Mapping aus freiem TSX.
- **Sehr tiefe Bäume:** Rekursionstiefe und Performance; später ggf. maximale Tiefe oder Virtualisierung.
- **SSR vs. Client:** Blöcke mit Browser-only APIs müssen als **Client Components** markiert werden — Mischung aus RSC (Public-Route) und Client (Draft-Frame) planen.
- **Styles:** Public-Routen rendern direkt in den Site-Body; der Draft-Frame läuft in einem **iframe** und kann eigene Styles bündeln, ohne den Editor zu verunreinigen.
- **Editor-Draft:** Unter **`/admin/preview/frame?draft=1`** rendert **`DraftPreviewFrame`** dieselbe **`renderPageDocument`**-Pipeline und empfängt das Live-Dokument per **same-origin `postMessage`**; zusätzlich Wheel-/Pinch-Bridge an den Parent (**`DraftPreview.md`**, **`preview-wheel-bridge.ts`**). Persistierte Seiten werden ausschließlich vom Public Renderer unter **`/[slug]`** geladen.

## 7. Testing & Verification

| Aktion | Erwartung |
| ------ | --------- |
| `pnpm test` | **`render-page-document.test.tsx`** (inkl. `landing-mvp.page.json`), **`block-registry.test.ts`**, **`builtin-block-types.test.ts`**, **`page-document.test.ts`**, **`motion-presets.test.ts`**, **`motion-contract.test.ts`**, **`motion-capabilities.test.ts`**, **`motion-runtime.test.tsx`**, **`section-block.test.ts`**, **`frame-block.test.ts`**. |
| `pnpm dev` + Browser | **`/`** und **`/<slug>`** rendern persistierte Seiten; **`/admin/preview/frame?draft=1`** rendert den Draft. |
| API | **`PUT /api/pages/<slug>`** → danach **`/<slug>`** im Browser refreshen. |

---

*Stand: Renderer ohne eigene Route — Public Site (`/[slug]`) und Draft Frame (`/admin/preview/frame?draft=1`) sind die einzigen Konsumenten; `PageShell` als gemeinsamer Public-Wrapper; Autoren-Hinweise zu split/frame, theme vs. surface, und `when`.*
