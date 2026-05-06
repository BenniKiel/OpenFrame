---
name: Caveman Mode
description: Führt eine Aufgabe im Caveman-Style durch. Token-sparend bei der Planung, präzise beim Code.
---

# Caveman Mode Workflow

Dieser Workflow schaltet für den aktuellen Task den "Caveman Mode" ein, um Token zu sparen und die Lösungsfindung (Thinking/Planning) extrem zu beschleunigen.

## Aufruf & Deaktivierung
Der Modus wird vom User via `/caveman [Level] [Task]` aktiviert. 
Mögliche Level: `lite` | `full` (default) | `ultra`

Um den Modus explizit wieder zu beenden, nutzt der User den Befehl `/caveman off` oder sagt `stop caveman`. Sobald dieser Befehl fällt, kehrst du auch in deinen internen Gedanken (`<thought>`) sofort zu einer normalen, ausführlichen Denkweise zurück.

## Instruktionen an den Agenten

Für die gesamte Dauer des Tasks wendest du folgende Regeln an:

### 1. Thinking & Planning (Caveman Speak)
Während deiner internen Problemanalyse, Lösungsfindung und Konzeptplanung nutzt du striktes "Caveman Speak". **WICHTIG: Denke immer auf Englisch**, da dies die meisten Token spart.
- **Weglassen (Drop):** Füllwörter, Höflichkeiten, Artikel (a/an/the). Keine langen Sätze.
- **Muster (Pattern):** `[Objekt] [Aktion] [Grund]. [Nächster Schritt].`
- **Kausalität:** Nutze Pfeile (`→`) oder Gleichheitszeichen (`=`), um Ursache-Wirkung zu zeigen.

**Intensity Levels (Dein Denk-Modus):**
- **lite:** Keine Füllwörter/Höflichkeiten. Kurze, saubere Sätze. *(Beispiel: "Component re-renders because object ref is new. Use useMemo.")*
- **full (Standard):** Keine Artikel, Stichworte erlaubt. Classic Caveman. *(Beispiel: "New object ref at render. Inline object = re-render. Use useMemo.")*
- **ultra:** Extreme Abkürzung, nur das Nötigste. *(Beispiel: "Inline prop → new ref → re-render. useMemo.")*

*(Hinweis: Originale Variablen, API-Namen und Code-Symbole werden NIE abgekürzt, egal in welchem Level!)*

### 2. Auto-Clarity (Sicherheit geht vor)
Verlasse den Caveman-Modus in deinen Plänen sofort bei:
- **Sicherheitswarnungen**
- **Irreversiblen Aktionen** (z.B. Datenbank-Drops, massives Löschen von Dateien)
- Wenn extreme Komprimierung technische Mehrdeutigkeit verursacht.
*Wechsle nach der Warnung/Klärung direkt wieder in den Caveman-Modus zurück.*

### 3. Boundaries (S.A.G.E. Strict Separation)
- **Quellcode & Shell-Commands:** KEIN Caveman Speak! Code muss zu 100% syntaktisch korrekt, vollständig und funktional sein. Bei CLI-Befehlen (Terminal) dürfen absolut keine Flags oder Argumente abgekürzt werden.
- **User-Kommunikation & Dokumentation (`docs/`):** Normale, ausführliche und professionelle Sprache. Wechsle für die finale Antwort an den User zwingend **zurück in die Sprache des Users** (meist Deutsch). Caveman ist ausschließlich für deine internen Gedanken-Blöcke (z.B. `<thought>`) reserviert.
