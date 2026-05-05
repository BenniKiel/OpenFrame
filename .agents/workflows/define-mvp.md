---
description: Condenses the validated vision into an absolute Minimum Viable Product (MVP) to prevent feature creep.
---
# Define MVP Workflow

This workflow acts as a strict filter to ensure the project doesn't suffer from feature creep and can be launched/tested in a realistic timeframe (2-4 weeks).

**Prerequisite:** The idea has been validated (`/validate-idea` run) and the `docs/01_Concept.md` has the high-level vision and Target Audience defined.

## Step 1: MoSCoW Method Analysis
Read `docs/01_Concept.md`. Break down the user's vision using the MoSCoW method:
- **M**ust-Haves: What is the absolute core loop or singular feature that proves the concept to the target audience?
- **S**hould-Haves: Important, but not time-critical for launch day 1.
- **C**ould-Haves: Nice bonuses if time permits (usually pushed to v2.0).
- **W**on't-Haves: Explicitly out of scope for the MVP.

## Step 2: The "Ruthless Cut"
Act as an uncompromising Product Owner. Identify at least 1-2 features the user *thinks* are Must-Haves, but are actually Should-Haves, and propose moving them to Post-MVP. The goal is the *quickest path to market/testing*.

## Step 3: MVP Definition
Present the strict MVP scope (the extracted Must-Haves) to the user via the `notify_user` tool. 

## Step 4: Documentation Update
Once the user agrees, update `docs/01_Concept.md` by adding a highly visible `## MVP Scope` section. Any feature outside this scope is strictly forbidden from being architected or coded during the initial iteration phase.
