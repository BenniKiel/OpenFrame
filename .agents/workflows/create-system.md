---
description: Creates a new system with proper interface documentation.
---
# Create System Workflow

This workflow creates a new system with a rigorous focus on design and clear component boundaries.

**Prerequisites:** 
- The user has requested a new system (e.g., "Quest System", "Economy System").
- `docs/` structure is already initialized.

## Step 1: Research & Setup
Read the relevant core concepts in `docs/` (`01_Concept.md` and `02_TechStack.md`). If the requested system interacts with existing systems, read their docs in `docs/systems/` as well.

## Step 2: Documentation drafting (Concept phase)
Create the system documentation file in `docs/systems/<System_Name>.md`. 
**CRITICAL:** You MUST strictly follow the `system_design_standards` template (Component Overview, Architecture Diagram, Public Interfaces, Dependencies, Data Structures, Known Limitations, Testing & Verification).

## Step 3: User Review Gate
Stop and notify the user using the `notify_user` tool. Provide the new `docs/systems/<System_Name>.md` document for review. State explicitly:
"I have drafted the C4 design for the new system. Please review the architecture. Am I clear to proceed with the implementation, or should we design the next system first?"

**CRITICAL NOTE FOR AGENT:** 
The `/create-system` workflow ENDS HERE. Do NOT write any codebase code during this workflow. You are acting exclusively as an Architect. Implementation is a separate step that the user must explicitly request after approving the design.
