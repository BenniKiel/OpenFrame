---
name: Structured Problem Solving
description: Zwingt den Agenten, Aufgaben in einem strukturierten, 4-phasigen Workflow anzugehen (Analysis -> Concept -> Review -> Implementation).
---

# Structured Problem Solving Skill

Dieser Skill verhindert voreiliges Coden und stellt sicher, dass komplexe Aufgaben methodisch und fehlerfrei gelöst werden.

Wende diesen 4-Phasen-Workflow bei jeder Aufgabe an, die über triviale Code-Änderungen oder simple Fixes hinausgeht:

## 1. Analysis (Kontext aufbauen)
- Lies die relevanten Dokumentationen im `docs/` Ordner (siehe `continuous_documentation` Skill).
- Analysiere den bestehenden Code und die Architektur. Verstehe die Constraints und das Problem vollständig, bevor du über Lösungen nachdenkst.

## 2. Conceptualization (Entwurf)
- Formuliere einen klaren Plan, *wie* du das Problem architektonisch lösen wirst.
- Halte dich an die Architektur-Standards des Projekts (SSOT, bestehende Patterns).
- Erstelle bei neuen Systemen einen ersten Entwurf des System-Dokuments (gemäß `system_design_standards`).

## 3. User Review Gate (Zwingender Stopp)
- Bevor du Code schreibst, **MUSST du stoppen**.
- Präsentiere dem User dein Konzept (Implementation Plan).
- Frage explizit nach Erlaubnis: "Bist du mit diesem Konzept einverstanden? Darf ich mit der Implementierung beginnen?"
- Gehe erst zur nächsten Phase über, wenn der User sein klares "Okay" gegeben hat.

## 4. Implementation & Auto-Update
- Setze dein Konzept im Code um.
- Halte Best Practices ein und schreibe sauberen Code.
- **Iterative Design Loops:** Wenn du während der Implementierung auf harte Blocker stößt (z.B. Engine-Restriktionen), die dein Konzept ungültig machen, MUSST du mit dem Coding aufhören. Kehre zu Phase 2 (Conceptualization) zurück, korrigiere die `docs/` und frage den User nach einem erneuten Approval.
- Sobald die Implementierung erfolgreich abgeschlossen ist, aktualisiere zwingend die zugehörigen Markdown-Dateien in `docs/` (Epilog Phase des `continuous_documentation` Skills).
