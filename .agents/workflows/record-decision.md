---
description: Documents a significant architectural decision using the MADR standard.
---
# Record Decision Workflow

This workflow is used when the user explicitly requests an Architecture Decision Record (ADR) to be created, ensuring long-term project memory.

**Prerequisite:** The user states a decision to be recorded (e.g., "Record the decision to use the ECS pattern for NPCs instead of Object-Oriented").

## Step 1: Analyze Context
Gather contextual information from the user's prompt or the current project state (e.g., read `02_TechStack.md`) to understand *why* this decision is being made and what alternatives might exist.

## Step 2: Determine Next ADR Number
Look inside the `docs/decisions/` directory to see the highest numbered file (e.g., `0002-something.md`). The new ADR must be named with the sequence number `0003-<descriptive-kebab-case-title>.md`.

## Step 3: Implement the MADR File
Create the new markdown file in `docs/decisions/` strictly adhering to the template defined in the `architecture_decision_records` skill (Context, Drivers, Considered Options, Decision Outcome, Consequences).

## Step 4: Add to Tech Stack (If relevant)
If the decision involves adopting a new core technology or framework, automatically update `docs/02_TechStack.md` to reflect this outcome.

## Step 5: Notify User
Notify the user with the `notify_user` tool, presenting the paths to the newly created ADR and any updated documents.
