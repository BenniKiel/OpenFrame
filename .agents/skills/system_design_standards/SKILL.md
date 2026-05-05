---
name: System Design Standards
description: Definiert die strikten Guidelines für System-Dokumente im docs/systems/ Verzeichnis basierend auf C4 Component Level 3.
---

# System Design Standards Skill

Dieser Skill stellt sicher, dass alle Systeme im Projekt nach einem einheitlichen, vorhersehbaren Schema dokumentiert werden.

Immer wenn du ein neues System entwirfst oder die Dokumentation eines bestehenden Systems in `docs/systems/` aktualisierst, betrachte das System als eine **C4 Component** (Level 3 des C4 Modells). Du MUSST dich strikt an folgendes Markdown-Template halten.

## Pflicht-Sektionen für jedes System-Dokument

Jede Datei in `docs/systems/` (z.B. `NPC_System.md`) muss zwingend diese Struktur aufweisen:

### 1. Component Overview
Eine kurze, prägnante Zusammenfassung (1-3 Sätze), was diese Komponente tut, wofür sie verantwortlich ist und in welchem C4 Container sie lebt.

### 2. Architecture Diagram (Mermaid)
**Zwingend erforderlich:** Erstelle ein `mermaid` Flowchart oder Class-Diagramm, das die internen Datenflüsse und die Verbindungen zu anderen C4 Components visuell darstellt.
**Mermaid Safeguards (STRIKT):** 
- Verwende niemals Sonderzeichen (z.B. Klammern, Anführungszeichen) in Node-Identifikatoren, es sei denn der Text ist strikt als String gekapselt (z.B. `NodeA["Text (Details)"]`).
- Halte die Graphen einfach (KISS-Prinzip) und vermeide übermäßige Verschachtelungen, um Rendering-Fehler in VS Code zu vermeiden.

### 3. Public Interfaces (API)
Welche Methoden, Events oder Hooks stellt diese Komponente für *andere* Komponenten zur Verfügung?
Beschreibe die Signatur und den Zweck der öffentlichen Schnittstellen.

### 4. Dependencies
Welche anderen Systeme (Komponenten) oder externen Module werden von dieser Komponente aufgerufen oder benötigt? (z.B. "Benötigt das `Time_System` für Berechnungen").

### 5. Data Structures & State Management
Wie speichert dieses System seine Daten? 
- Welche Kern-Datenstrukturen werden verwendet?
- Wie wird der State gemanagt (z.B. Redux, Zustand, SSOT, Local State)?

### 6. Known Limitations / Edge Cases
Aktuelle Einschränkungen, bekannte Bugs oder Randfälle.

### 7. Testing & Verification
Wie kann dieses System lokal oder in der Zielumgebung getestet und verifiziert werden?
- Welche Scripte, CLI-Commands (z.B. `npm run test`), API-Calls oder UI-Flows triggern das System?
- Wie kann ein anderer Entwickler oder Agent schnell prüfen, ob diese Komponente noch funktioniert?

---
Weiche nicht von diesen Sektionen ab, es sei denn, du fügst projektspezifisch wichtige, zusätzliche Sektionen hinzu. Mermaid-Diagramme sind nicht optional!
