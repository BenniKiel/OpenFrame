# Record architecture decisions with MADR

*Status: accepted*  
*Date: 2026-05-01*

## Context and Problem Statement

The project needs a durable, lightweight record of *why* important architectural choices were made. Without a shared format, decisions live only in chat or implicit code, and later contributors (or agents) lack rationale when evolving the system.

## Decision Drivers

* Traceability of significant technical choices over time
* Low ceremony: easy to write and review in Git alongside code
* Consistency so every decision document is skimmable

## Considered Options

* Ad-hoc notes in issues or wikis only
* Long-form design documents without a fixed template
* **MADR (Markdown ADR)** in `docs/decisions/` with numbered filenames

## Decision Outcome

We adopt **MADR-style Markdown ADRs** in `docs/decisions/` (e.g. `0001-...md`, `0002-...md`) for all significant architectural decisions, using the project’s agreed MADR sections (context, drivers, options, outcome, consequences).

### Positive Consequences

* Decisions stay versioned with the repository and are easy to discover
* A predictable template speeds up writing and reviewing ADRs

### Negative Consequences

* Numbering and index maintenance require light discipline when adding new ADRs
* Not every small change warrants an ADR; judgment is still required
