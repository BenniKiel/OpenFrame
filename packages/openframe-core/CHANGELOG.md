# @benjaminkiel/openframe

## 0.2.2

### Patch Changes

- 66bafdd: Switch npm publish target from `@openframe/core` to `@benjaminkiel/openframe` (user scope), and update release/runbook references accordingly.

## 0.2.1

### Patch Changes

- Document built-in block types **`faq`**, **`testimonial`**, **`logo-cloud`**, and **`nav-header`** in `BUILTIN_BLOCK_TYPES` / `BuiltinBlockType` (renderer lives in OpenFrame Web).

## 0.2.0

### Minor Changes

- 84baeef: Prepare the first publishable `@benjaminkiel/openframe` package.

  - Extract canonical contracts into a self-contained package build (`dist/*`).
  - Export OpenFrame document schemas and motion contracts for integrators.
  - Wire release flow so only public core is published while web app and motion-pro remain private.
