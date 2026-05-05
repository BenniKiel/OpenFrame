---
name: Architecture Decision Records (ADRs)
description: Zwingt den Agenten, wichtige Architekturentscheidungen in Form von kurzen ADR-Dokumenten im docs/decisions/ Ordner festzuhalten.
---

# Architecture Decision Records Skill

Dieser Skill sichert das architektonische Langzeitgedächtnis des Projekts. Zu oft wissen Entwickler nach Monaten nicht mehr, *warum* eine bestimmte Technologie oder ein Muster gewählt wurde.

## Wann du ein ADR erstellen musst:
Immer wenn während deiner Arbeit eine signifikante architektonische Entscheidung getroffen wird (z.B. Auswahl einer Library, Festlegung eines Daten-Patterns, Entscheidung gegen eine Alternative) oder wenn der User den Workflow `/record-decision` anfragt.

## Verzeichnis & Dateibenennung
ADRs werden fortlaufend nummeriert im Verzeichnis `docs/decisions/` gespeichert (z.B. `0004-use-charm-for-state.md`, `0005-implement-ecs-pattern.md`).

## Das MADR (Markdown ADR) Format
Nutze zwingend folgende Struktur für das Markdown-Dokument:

```markdown
# [Titel der Entscheidung, z.B. Use Charm for State Management]

*Status: [proposed | accepted | rejected | deprecated | superseded by ADR-xxxx]*
*Date: [Aktuelles Datum, z.B. YYYY-MM-DD]*

## Context and Problem Statement
Beschreibe kurz den Kontext und das Problem, das wir lösen wollen. Warum müssen wir uns überhaupt hier entscheiden?

## Decision Drivers
* [Grund 1, z.B. Performance Anforderungen]
* [Grund 2, z.B. Vertrautheit des Teams]

## Considered Options
* [Option 1, z.B. Redux / PostgreSQL / Unity]
* [Option 2, z.B. Zustand / MongoDB / Godot]
* [Option 3, z.B. Vanilla State / SQLite / Custom Engine]

## Decision Outcome
Wir haben uns für [Option 2] entschieden, weil [Kern-Begründung].

### Positive Consequences
* [Gute Auswirkung 1]
* [Gute Auswirkung 2]

### Negative Consequences
* [Schlechte Auswirkung/Trade-off 1]
```

## Automatischer Update-Zwang
Sobald du ein neues ADR anlegst, füge es der README.md oder einem Index in `docs/decisions/` hinzu (falls vorhanden). Ungefragt!
