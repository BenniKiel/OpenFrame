# Contributing to OpenFrame

Thanks for contributing.

## Development setup

1. Use Node.js 22+.
2. Install dependencies:
   - `pnpm install`
3. Start local dev:
   - `pnpm dev`

## Before opening a PR

- Run tests: `pnpm test`
- Ensure build passes: `pnpm exec next build`
- Update docs when behavior or architecture changes.

## Changesets for release notes

For user-facing package changes, add a changeset:

- `pnpm changeset`

Use clear release notes about **why** the change exists.

Current publish target:

- `@openframe/core` (public)

Excluded from publish:

- `@openframe/web` (app runtime)
- `@openframe/motion-pro` (private tier module)

## Scope guidelines

- Keep Open-Core and Motion Pro boundaries clear.
- Do not import `gsap` outside Motion Pro paths.
