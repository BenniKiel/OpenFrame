---
description: Scaffolds the initial codebase/framework based on the finalized 02_TechStack.md.
---
# Init Codebase Workflow

This workflow executes the physical initialization of the project repository (installing frameworks, setting up build tools, etc.) before individual C4 systems are designed.

**Prerequisite:** The global architecture and tech stack have been locked in (`docs/02_TechStack.md` is filled out).

## Step 1: Tech Stack Analysis
Read `docs/02_TechStack.md` to determine the chosen Framework, Language, and core libraries.

## Step 2: CLI Scaffolding
Use your `run_command` tool to execute the appropriate CLI commands to scaffold the project in the root directory. 
- Execute commands non-interactively.
- If it's a web project, use tools like `npx -y create-vite@latest ./ --template react-ts` or `npx -y create-next-app@latest .`. 
- DO NOT overwrite the `docs/` or `.agents/` folder.
- If it's a Roblox/Unity project, set up the standard directory structure (e.g., `src/`, `ReplicatedStorage/`, etc.) if no CLI tool exists.

## Step 3: Base Configuration
Make initial configuration changes (e.g., tweaking `tsconfig.json`, `tailwind.config.ts`, `rojo.json`) to align with the core decisions made in `01_Concept.md`.

## Step 4: Verification Gate
Stop and notify the user using the `notify_user` tool:
"I have initialized the base framework according to our Tech Stack. Please verify that the folder structure looks correct. If everything is fine, we can now start designing individual systems using `/create-system`."
