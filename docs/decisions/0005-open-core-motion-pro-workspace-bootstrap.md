# Open-Core + Motion-Pro workspace bootstrap

*Status: accepted*  
*Date: 2026-05-05*

## Context and Problem Statement

OpenFrame needs a practical path to ship Open-Core and premium features without splitting into two repositories too early. We need clear boundaries now, while preserving the existing local development flow.

## Decision Drivers

* Keep current app productive during transition.
* Prevent accidental GSAP coupling in Open-Core code.
* Enable package-based releases with minimal process overhead.

## Considered Options

* Immediate hard split into two repositories.
* Keep single package and rely only on env flags.
* Bootstrap a workspace with package boundaries while root app remains runtime host.

## Decision Outcome

We chose a **workspace bootstrap**:

* Add `pnpm-workspace.yaml`.
* Introduce package entrypoints:
  * `packages/openframe-core`
  * `packages/openframe-motion-pro`
* Keep current app in root temporarily to avoid disruptive move.
* Add lint guard: forbid `gsap` imports outside `src/lib/preview/motion-pro/*`.
* Add Changesets + CI/release workflows.

### Positive Consequences

* Open-Core vs Motion-Pro boundaries are explicit in code and tooling.
* Local dev (`pnpm dev`) remains unchanged.
* Future extraction to `apps/web` and fully published packages is incremental.

### Negative Consequences

* Transitional state: root app and workspace packages coexist.
* Package entrypoints currently re-export internal modules and are not fully decoupled yet.
