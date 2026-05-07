# Roadmap: SaaS Landing Page Backlog

Basierend auf der Analyse der realen OpenFrame-Fähigkeiten und dem Zielbild einer modernen SaaS-Landingpage, definiert dieser Backlog den 80/20-Hebel für die nächsten Implementierungsschritte. Das Ziel ist es, die größten Design-Lücken mit minimaler Komplexität (KISS) zu schließen, ohne die Contract-First-Architektur aufzuweichen.

## 1. Top Capability Gaps (Die wichtigsten Lücken)

| Gap | Problem | Produktwert (SaaS) | Vorschlag (Primitive/Preset) | Aufwand | Prio |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Responsive Typografie** | Riesige Desktop-Headings (z. B. `sizeScale: "xl"`) brechen auf Mobile um oder sprengen den Viewport, da `when` auf Text nicht wirkt. | **Kritisch.** Eine SaaS-Hero-Section muss auf Mobile kompakt und auf Desktop imposant sein. | `when`-Support für `heading` und `text` ausbauen. Erlaubte Felder: `sizeScale` und `align`. | **S** | **P0** |
| **Hover-Interaktionen** | `card` und `frame` wirken statisch und leblos. Klickbare Feature-Cards geben kein visuelles Feedback. | **Hoch.** Mikro-Interaktionen (Card Lift, sanfte Schatten) sind das Fundament für "Premium-Feel". | Neues Prop `interaction` (Enum: `none` \| `lift` \| `ring`) auf `card` und `frame`. Zieht vordefinierte CSS-Transitions an. | **S/M** | **P1** |
| **Pricing / Tab-Toggle** | Ein Schalter für "Monthly / Annually" erfordert lokalen UI-Zustand, der im statischen Baum fehlt. | **Mittel.** Sehr häufiges SaaS-Pattern, aktuell nur durch unschöne statische Listen umgehbar. | Neuer datengesteuerter Block `type: "pricing"`, der die Toggle-Logik und die Tiers intern (wie `faq`) kapselt. Keine generischen Tabs. | **M** | **P2** |
| **Non-Rectangular Media** | Nur runde Ecken (`radiusPx`). Diagonale Sektionen oder asymmetrische Bildmasken fehlen. | **Niedrig/Mittel.** Bricht das "Boxy"-Layout auf und wirkt organisch. | Neues Prop `clipMask` (Enum: `none` \| `slant-right` \| `slant-left`) auf `section` und `image`. | **S** | **P2** |

## 2. Implementierungs-Slices (Die nächsten Iterationen)

Die Reihenfolge richtet sich streng nach dem ROI: Zuerst Layout-Stabilität (Mobile Typo), dann "Wow"-Faktor (Hover), dann komplexe Komponenten (Pricing).

### Slice 1: Responsive Typography & Text Control
*Ziel: Headings und Texte reagieren auf Viewport-Grenzen.*

*   **Minimal Shippable Scope:**
    *   Erweiterung des `OpenframePageDocument`-Schemas: `heading` und `text` erhalten ein `when`-Objekt (Keys: `sm`, `md`, `lg`).
    *   Unterstützte Overrides im Text-`when`: `sizeScale` und `align`.
    *   Editor-UI: Die Text/Heading-Panels erhalten die gleichen Breakpoint-Tabs wie der `frame`-Block.
*   **Betroffene Systeme / Dateien:**
    *   *Schema:* `src/lib/openframe/page-document.ts` (Zod-Erweiterung für Text-Nodes).
    *   *Renderer:* `heading-block.tsx`, `text-block.tsx` sowie ein neuer Generator `text-responsive.ts` (analog zu `frame-responsive.ts` für scoped CSS-Generierung).
    *   *Editor:* `src/app/admin/editor/` (Props-Panel Komponenten für Typografie anpassen).
*   **Test-/Dogfood-Check:**
    *   Hero-H1 im Editor auf `sizeScale: "xl"` (Desktop) setzen. Auf Mobile-Ansicht schalten und über `when` auf `sizeScale: "lg"` reduzieren. Der Iframe muss die Größenänderung live reflektieren.

### Slice 2: Card & Frame Interactivity (Hover Presets)
*Ziel: Statische Blöcke fühlen sich klickbar und lebendig an.*

*   **Minimal Shippable Scope:**
    *   Neues Prop `interaction` auf `card` (und optional `frame`). Werte: `none`, `lift` (sanftes Anheben + Schatten), `glow` (subtiler Rand-Effekt).
    *   Implementierung rein über Tailwind-Klassen (z. B. `transition-transform hover:-translate-y-1 hover:shadow-lg`).
    *   Editor-UI: Dropdown "Hover Effect" im Card-Panel.
*   **Betroffene Systeme / Dateien:**
    *   *Schema:* `page-document.ts` (`interaction` Enum hinzufügen).
    *   *Renderer:* `card-block.tsx` (Mapping des Enums auf Tailwind-Klassen).
    *   *Editor:* Properties-Panel für Card erweitern.
*   **Test-/Dogfood-Check:**
    *   Ein dreispaltiges Features-Grid bauen. Klick auf eine Card im Editor -> `interaction: "lift"` setzen. Im View-Site-Tab mit der Maus über die Karte fahren und die Transition verifizieren.

### Slice 3: Datengesteuerter Pricing-Block
*Ziel: Komplexe Pricing-Tabellen ohne Zustandsmanagement im Editor-Kern.*

*   **Minimal Shippable Scope:**
    *   Neuer Built-In Block `type: "pricing"`.
    *   Strikte Struktur (wie `faq`): Keine Baum-`children`, sondern Arrays in den Props: `tiers` (Name, Features-Liste, CTA) und `prices` (monatlich/jährlich).
    *   Der Renderer kapselt den React-State (`useState` für den Toggle) komplett intern.
*   **Betroffene Systeme / Dateien:**
    *   *Schema & Registry:* `builtin-block-types.ts`, Zod-Schema für Pricing.
    *   *Renderer:* Neuer Ordner/Datei `pricing-block.tsx` (als Client Component markiert `"use client"`, da sie State braucht).
    *   *Editor:* Komplett neues Formular-Panel für Pricing (Listen-Editoren ähnlich dem FAQ-Panel).
*   **Test-/Dogfood-Check:**
    *   Block "Pricing" in eine Sektion einfügen. Im Editor zwei Tiers eintragen (Pro, Enterprise). Im Site-Preview den Toggle klicken und prüfen, ob die Preise wechseln.

## 3. Klare Out-of-Scope-Liste

Diese Punkte gehören explizit **nicht** in den OpenFrame-Kern (Canonical JSON), sondern sollten später über das "Escape Hatch"-Konzept (Code-Inseln / Custom Components) gelöst werden:

1.  **Mega-Menus (Rich Dropdowns):** Die Versuchung ist groß, den `nav-header` generisch verschachtelbar zu machen. Das explodiert in der Editor-UX (Framer und Webflow scheitern oft elegant an komplexen Dropdowns). Ein Mega-Menu mit Grid und Bildern gehört in eine hartgecodete Custom-Component-Insel.
2.  **Freies CSS / Freie Hover-States:** Agenten "irgendwelche" Tailwind-Strings (`hover:bg-red-500`) in ein Input-Feld generieren zu lassen, bricht die Validierung und das Theme. Interaktion bleibt über Enums (`lift`, `glow`) gesteuert.
3.  **Generische Tabs/Accordions mit Baum-Kindern:** Ein Block `tabs`, bei dem jeder Tab wieder einen vollen `frame`-Baum aufnehmen kann, macht das Rendern und Auswählen im Editor extrem fehleranfällig (Welcher Tab ist im Editor gerade aktiv?). Lösung: Entweder datengesteuert (wie `faq`/`pricing`) oder ganz lassen.
4.  **Scroll-Scrubbing Animationen:** Das Koppeln von Video-Frames oder SVG-Pfaden an die Scroll-Position. Dies gehört strikt in den "Motion Pro" (GSAP) Layer oder in dedizierte Code-Routes.
