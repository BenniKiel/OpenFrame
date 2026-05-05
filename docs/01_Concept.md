# Concept

## Vision

**OpenFrame** ist ein visueller Website-Builder auf **React-Basis**, vergleichbar mit dem Erlebnis von **Framer**, aber mit klarer Ausrichtung auf **Selbst-Hosting** und **Open Source**. Ziel ist es, gestalterisch anspruchsvolle Sites zu bauen, ohne Daten, Deployments und Erweiterbarkeit an einen proprietären Anbieter zu binden.

**Primäre Motivation:** Das Produkt soll zuerst **für dich selbst** überzeugend nutzbar sein („dogfooding“); breitere Verbreitung und spätere Monetarisierung sind nachrangig, bis dieser Maßstab erfüllt ist.

### Strategic design horizon (post-MVP, non-binding)

Monetarisierung ist **bewusst nicht Teil des ersten Lieferumfangs**; folgende Richtungen sind nur **Ausblick** für spätere Architektur- und Produktentscheidungen (z. B. saubere Plugin-Grenzen, Mandantenfähigkeit, Lizenzierung, Hosting-Story):

- Open-Core / Freemium
- Managed Cloud Hosting (Vercel-ähnliches Modell)
- Ökosystem & Marktplatz (Templates, Plugins)
- Support-Verträge & Enterprise-Onboarding (SLAs)
- Dual-Licensing / White-Labeling

Diese Optionen sollen **Designchoices** nicht vorwegnehmen, aber helfen, **Erweiterungspunkte** nicht versehentlich zu verbrennen.

**Monetarisierung:** Bis OpenFrame persönlich als „toll“ empfunden wird, ist **Umsatz unwichtig**; kostenloser Zugang zum **Kernprodukt** für Privat- und Hobbyentwickler ist ausdrücklich gewünscht.

## Market Positioning & Target Audience

### Validated market context (fact-checked)

Der Wunsch nach **Framer-näher UX** plus **Datenhoheit / Self-Host / OSS** ist **kein „solution looking for a problem“**: Viele Teams wollen visuelle Editierung und schnelle Iteration, aber mit **eigenem Hosting**, **Compliance**, **forkbarer Codebasis** oder **White-Label** – dort reißen geschlossene Plattformen oft.

**Vergleichbare Lösungen (Auszug, Stand Recherche):**

| Produkt / Projekt | Kurzprofil | Relevanz für OpenFrame |
| ----------------- | ---------- | ------------------------ |
| **[Webstudio](https://github.com/webstudio-is/webstudio)** | Sehr aktiver OSS-Builder (u. a. Webflow-Nähe), starkes Ökosystem, **Self-Hosting** (z. B. Docker); Kern **AGPL**; optionale proprietäre Pakete (z. B. Animation) | Direkter „OSS + visuell + hostbar“-Benchmark |
| **[Puck](https://github.com/puckeditor/puck)** | **MIT**, React-first, **einbettbar**, JSON-Datenmodell, Fokus Developer + Content-Teams | Überlappung bei „React-Builder in eigener App“; weniger „komplette Framer-Cloud-Erfahrung“ |
| **[Chai Builder](https://github.com/chaibuilder/sdk)** | OSS React-Builder (u. a. Next.js), BSD-3-Clause, u. a. White-Label-Narrativ | Zeigt Nachfrage nach **einbettbaren** Marketing-/Site-Buildern |
| **[OpenPage](https://github.com/buildingopen/openpage)** u. a. | Sehr junges Segment „Framer-like + OSS + self-hosted“ | Unterstreicht **Ideenkonkurrenz**; Differenzierung und Community werden entscheidend |

**Fazit:** Der Markt für **OSS / self-hosted visuelle Builder** ist **nicht leer** – die Positionierung stützt sich auf **KI-Agenten ↔ React-Code ↔ visuelle Nachbearbeitung** als differenzierende Schleife, nicht auf „noch ein Builder“ allein.

### Target audience

| Segment | Rolle für OpenFrame |
| ------- | -------------------- |
| **Kleine Agenturen** | Professioneller Einsatz, wiederkehrende Sites, Bedarf an Kontrolle und Hosting |
| **Freelance-Webentwickler** | Schnelle Lieferung, eigene Komponenten, wenig Lock-in |
| **Privat- und Hobbyentwickler** | Lernen und Experimentieren; **kostenloser Zugang zum Kernprodukt** ist ausdrücklich vorgesehen |
| **Product owner (du)** | **Erster und maßgeblicher Nutzer** – Qualitätsmaßstab ist „für mich selbst toll“, bevor Fokus auf Skalierung/Monetarisierung verschoben wird |

### Unique value proposition (USP)

**Starke KI-Integration** als praktische Schnittstelle: Nutzer sollen mit **agentischen Tools** (z. B. Claude, Cursor, Antigravity, Copilot) **React-Websites entwickeln** können und den Ergebniszustand **anschließend visuell** in OpenFrame weiterbearbeiten – **ohne** zwingend einen vollwertigen „In-App-Agenten“ als Produktkern. Der Mehrwert liegt in der **Roundtrip-fähigen Brücke** zwischen **Code/Generierung** und **visuellem Editor**, nicht nur in Einzel-KI-Features.

### Core risks (to monitor)

- **Schnittstelle zwischen generiertem React-Code und dem visuellen Modell** (Import, Normalisierung, Roundtrips, Konflikte bei erneuter Generierung)
- **Codegenerierung** zuverlässig und wartbar halten (Halluzinationen, inkonsistente Patterns, Upgrade-Pfade)

### Non-negotiable scope boundaries (pre-MVP, product level)

Bis zur nächsten Verfeinerung in `/define-mvp` gelten folgende Säulen als **fest**:

- **Visueller Builder** (gestalterische Kontrolle im UI)
- **React** als zentrales Ausgabe- bzw. Bearbeitungsformat
- **Self-hosting** / Open Source als Basisphilosophie
- **KI-Anbindung** (praktische Interop mit externen Agenten-Workflows, nicht zwingend ein eingebauter Chat-Agent)

**Explizit nachrangig bis „für mich selbst toll“:** Monetarisierung und kommerzielle Packaging-Entscheidungen.

## MVP Scope

> **Regel:** Alles, was **nicht** unter *Must-Haves* fällt, darf in der **ersten Implementierungsphase** weder architektiert noch gebaut werden. Ziel ist ein in **2–4 Wochen** realistisch testbarer Kern („Proof of the loop“), nicht Feature-Parität mit Framer/Webstudio.

### MoSCoW (Auszug aus der Vision)

#### Must-Haves (MVP – strikt)

1. **Canonical Document** — Ein **einziges, versions- und diff-freundliches** Projektformat (z. B. JSON o. ä.), das **Source of Truth** für Editor und externe Tools ist.
2. **Visueller Editor (kernschlank)** — **Baum + Canvas/Preview**, Auswahl von Elementen, Bearbeitung **relevanter Props** (z. B. Text, Spacing, Farben, einfache Layout-Parameter) für ein **kleines, festes Set** eingebauter Blöcke/Komponenten.
3. **React als Laufzeitdarstellung** — Das Canonical Document wird **zuverlaessig als React** gerendert (lokale Dev-Preview + lauffaehiger Node-Build).
4. **Self-hosting (einfaches Deployment)** — Projekt ist **lokal aus dem Repo** startbar und als **Node-App via GitHub-Deploy** (z. B. Hostinger) veroeffentlichbar, ohne proprietaeren Cloud-Zwang; **README** beschreibt Setup, Deploy-Grundschritte und wo die Canonical Files liegen.
5. **KI- und Agenten-Interop (MVP-Definition)** — **Kein** Pflicht-In-App-Agent. Stattdessen: **dokumentierter Datei-/Ordner-Contract** (plus Schema oder Beispiele), sodass **Claude, Cursor, Antigravity, Copilot** dieselben Artefakte bearbeiten können wie der Editor (**Roundtrip**: extern bearbeiten → erneut im Editor öffnen → visuell feinjustieren → speichern).

#### Should-Haves (kurz nach MVP oder wenn Zeit übrig)

- **Export** als statischer Build (optional), falls nicht ueber Node-App betrieben
- **Undo / Redo** im Editor
- **Einfache Breakpoints** (z. B. Desktop / Tablet / Mobile in reduzierter Form)
- **Import** von Projekten, die den Contract einhalten (z. B. re-import nach Agenten-Edit)

#### Could-Haves (v2 / nice-to-have)

- **Docker Compose** „one command up“ für Self-Host-Enthusiasten (ohne dass der MVP davon abhängt)
- **Design Tokens / Themes** über mehrere Komponenten hinweg
- Erweiterung der **Komponentenbibliothek** über das Starter-Set hinaus
- **Motion Layer (optional, nicht MVP-Kern):** Lenis + GSAP über eine **kontrollierte, JSON-serialisierbare DSL**, die im visuellen Editor bedienbar ist; später denkbar als **kommerziell gebündeltes OpenFrame-Paket** (Templates, Presets, Support — **nicht** weil GSAP kostenpflichtig wäre; die **GSAP-Library ist kostenlos**) — technisch kompatibel mit Contract-First, aber bewusst nach dem Kernloop

#### Won’t-Haves (explizit außerhalb MVP)

- **Multi-User-Echtzeit-Kollaboration**
- **Accounts, Billing, Marktplatz**, kommerzielle Tiers
- **In-App-KI-Chat** als Produktkern (optional später denkbar, nicht MVP)
- **Framer-Parität** (fortgeschrittene Motion-Timelines, volles CMS/Collections-Modell, Enterprise-SLAs, …)

### Ruthless cuts („Product Owner“)

Zwei Dinge klingen nach „Must“, sind für den **ersten lieferbaren MVP** aber **Should**, damit das **Kernrisiko** (Code ↔ visuelles Modell) beherrschbar bleibt:

1. **„Beliebiger“ React-Code aus Agenten wird vollautomatisch visuell editierbar** — **Nein im MVP.** Stattdessen: **Contract-first** — Agenten arbeiten an **definierten Dateien/Schemas** und/oder an **eingrenzbaren Komponenten-Signaturen**. Freies TSX ohne Grenzen → **nachgelagert** (sonst explodiert Scope und Qualität).
2. **Vollstaendig gemanagte Self-Host-Infra (TLS-Hardening, Multi-Umgebungen, Compose/K8s)** — fuer den MVP reicht **einfaches Node-Deployment aus GitHub**. Enterprise-reife Betriebsaspekte → **Should**, nicht Blocker fuer „fuer mich selbst toll“.

### Strict MVP scope (ein Satz)

**Ein OpenFrame-Projekt mit Canonical Document, minimalem visuellen Editor und React-Preview, das lokal laeuft und sich einfach als Node-App aus GitHub deployen laesst (z. B. Hostinger), plus dokumentiertem Agenten-Datei-Workflow fuer Roundtrips — ohne Multiuser, ohne Marktplatz, ohne universellen TSX-Import.**

## Fundamental Design Decisions

1. **Single-repo TypeScript monolith (Next.js + React).**  
   Frontend (Editor/Preview) und Backend-Endpunkte laufen in einer Node-App, um den MVP schnell lokal und per GitHub-Deployment (z. B. Hostinger) betreibbar zu halten.

2. **Contract-First SSOT mit Canonical JSON.**  
   OpenFrame behandelt ein validiertes JSON-Dokument als einzige Quelle der Wahrheit. Editor, Renderer und externe Agenten arbeiten auf diesem Contract statt auf freiem TSX.

3. **AI integration via file/schema interop, not mandatory in-app agent.**  
   Der MVP setzt auf klar dokumentierte Dateien + Schema (Roundtrip-faehig), damit Claude/Cursor/Copilot-Workflows nutzbar sind, ohne sofort einen komplexen integrierten Chat-Agenten zu bauen.

4. **Bounded visual editing instead of universal code ingestion.**  
   Der visuelle Editor bearbeitet zunaechst ein begrenztes Komponenten-/Prop-Modell. Universeller Import beliebigen React-Codes ist explizit nicht Teil des ersten Releases.

5. **Simple persistence first.**  
   SQLite + Migrationen reichen fuer den MVP; komplexere Multi-tenant oder cloud-native Datenarchitekturen werden erst nach validiertem Kernloop betrachtet.

6. **Escape-Hatches statt „alles oder nichts“ (Hybrid-Modell).**  
   Statt zwischen coolem Code (Lenis, GSAP, THREE.js) und visuellem Editor zu wählen, gelten drei bewusst getrennte Ebenen:
   - **Route / ganze Seite code-first:** Eine Route darf **primär aus Code** bestehen; der volle Canvas-Editor greift dort nur eingeschränkt oder gar nicht — dafür maximale Freiheit für Libraries und imperative Logik.
   - **Insel / Slot auf einer Canvas-Seite:** Der Großteil der Seite bleibt **Canonical JSON + visuell editierbar**; ein Block-Typ kapselt **freien React-Code** (Modul-Referenz + klar begrenzte Props / Metadaten). So bleibt der Editor für den Rest produktiv.
   - **Begrenzte „Motion“-Komponenten:** Häufige Effekte als **Daten** (Enums, Keyframes, Presets), nicht als beliebiges Skript im Property Panel — das hält Roundtrips, KI-Interop und Stabilität intakt.

7. **Preview-Isolation für imperative Effekte.**  
   Scroll-Engine (z. B. Lenis), Timelines (GSAP) und WebGL (THREE) laufen **getrennt vom Editor-Chrome** (z. B. **iframe** für Site-Preview, strikte Mount/Unmount-Regeln), damit globale Listener den Builder nicht „kapern“.

8. **Optionales „Motion Layer“-Feature (nicht MVP-Kern, später ggf. OpenFrame-Premium-Produkt).**  
   Lenis und GSAP werden **nicht** als „roher Code-Editor für jeden Tween“ in v1 angeboten, sondern — wenn überhaupt — als **offiziell unterstützte Runtime** hinter einer **kleinen, versionierten JSON-DSL**, die im visuellen Editor bedienbar ist und sich mit Agenten-Workflows verträgt. (**Hinweis:** GSAP als Bibliothek ist **kostenlos**; „Premium“ bezieht sich auf **OpenFrame**-Angebot/Bündel, nicht auf eine GSAP-Kauf-Lizenz.) Vollständige Freiheit bleibt über **Escape-Hatches** (Route- oder Insel-Code) möglich.
