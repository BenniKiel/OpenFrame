---
name: Continuous Documentation
description: Erzwingt das ungefragte Aktualisieren und Lesen des Wissensstands (Docs) vor und nach Aufgaben.
---

# Continuous Documentation Skill

Dieser Skill stellt sicher, dass Dokumentation in diesem Projekt als "First-Class Citizen" behandelt wird.

## Prolog (Wissen aufbauen)
Bevor du eine neue Aufgabe beginnst, Code schreibst oder architektonische Entscheidungen triffst, MUSST du immer deinen Kontext aktualisieren:
1. Lies `docs/01_Concept.md` (High-Level Design und Vision).
2. Lies `docs/02_TechStack.md` (Technologien und Constraints).
3. **WICHTIG (Context Scaling):** Lade NIEMALS den gesamten `docs/systems/` Ordner blind in deinen Kontext! Nutze deine Datei-Suchwerkzeuge (`find_by_name`, `grep_search`), um `docs/systems/README.md` und gezielt nach relevanten Keywords zu suchen. Lies danach **nur die 1-2 Dateien**, die absolut essenziell für deine aktuelle Aufgabe sind, um dein Context Window klein zu halten.

## Epilog (Auto-Update)
Deine Aufgabe ist erst abgeschlossen, wenn die Dokumentation den neuen Stand des Codes widerspiegelt.
Sobald du ein Feature implementiert, Code geändert oder eine Schnittstelle (API) modifiziert hast:
1. Identifiziere, welche Markdown-Dateien im `docs/` Ordner (insbesondere in `docs/systems/`) von deinen Änderungen betroffen sind.
2. Aktualisiere diese Dateien sofort und **ungefragt**. Du brauchst dafür keine separate Erlaubnis des Users. Nutze deine Tools, um die Dokumentation anzupassen.
3. Falls du ein komplett neues System erschaffen hast, wende den Skill `system_design_standards` an, um eine neue Datei in `docs/systems/` zu erstellen.
4. **Orphan Prevention:** Wenn du Code oder ein System entfernst/löschst, MUSST du zwingend die zugehörige `.md` Datei in `docs/systems/` ebenfalls löschen oder als `[DEPRECATED]` markieren und den Index in `README.md` bereinigen.

Dokumentation und Code müssen immer 100% synchron sein.
