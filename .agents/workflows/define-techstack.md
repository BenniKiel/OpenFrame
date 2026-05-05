---
description: Defines the global technical architecture and tech stack based on the MVP before designing individual systems.
---

# Define Tech Stack Workflow

This workflow bridges the gap between MVP Ideation and System Design. It establishes the "C4 Level 1 & 2" architecture by defining the global tools and patterns required for the MVP.

**Prerequisite:** The idea has been validated (`/validate-idea`) and reduced to an MVP (`/define-mvp`). The `docs/01_Concept.md` holds the vision.

## Step 1: Requirements Analysis
Read `docs/01_Concept.md`. Understand the MVP scope. What kind of application is this? (e.g., A real-time multiplayer game requires different tech than a static blog).

## Step 2: Architecture Proposal
Determine the most pragmatic and efficient Engine/Framework, Language, Database, and State Management solution to build the MVP quickly. Follow the "Keep It Simple, Stupid" (KISS) principle.

## Step 3: Populate 02_TechStack.md
Update the `docs/02_TechStack.md` file with the finalized technologies. Add actual links to the documentation of the chosen libraries so future agents have easy access.

## Step 4: Populate Global Architecture
Update `docs/01_Concept.md` specifically under the `## Fundamental Design Decisions` section. Lock in the global architecture pattern (e.g., "We will use an Event-Driven Architecture with an SSOT pattern") based on the tech stack chosen.

## Step 5: Notify User
Notify the user with the `notify_user` tool. Provide the updated `02_TechStack.md` file. Ask the user: "Are you comfortable with this Tech Stack? If so, we can now start setting up the codebase with `/init-codebase`."