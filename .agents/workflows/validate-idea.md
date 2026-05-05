---
description: Validates a raw project idea regarding target audience, USP, and market viability before writing any code.
---
# Validate Idea Workflow

This workflow forces the Agent to act as a critical Product Manager. It runs *before* any architecture is designed or code is written.

**Prerequisite:** The user pitches a raw idea (e.g., "I want to build a fitness app that connects with smart fridges").

## Step 1: Deep Search & Fact-Checking
The Agent MUST use the `search_web` tool to validate the idea:
- Does this already exist? Who are the top 3 competitors?
- Is there a real problem being solved, or is it a "solution looking for a problem"?

## Step 2: Critical Interrogation
The Agent responds to the user by asking 3-4 highly critical, fundamental questions:
- **Target Audience:** Who *exactly* is the first 100 users?
- **USP (Unique Selling Proposition):** Why would they switch from an existing solution to yours?
- **Core Risk:** What is the biggest technical or market risk that could destroy this project?

## Step 3: Document Validation
If the user's answers are satisfactory and the idea proves viable, the Agent creates or updates `docs/01_Concept.md` to include a new section `## Market Positioning & Target Audience`. This section strictly defines the "Who" and the "Why".

## Step 4: Gatekeeping
The Agent explicitly states whether they recommend proceeding to the MVP phrasing step (`/define-mvp`) or if the idea needs a pivot based on the market data.
