# Open-Core Release Runbook

## Purpose

This runbook defines the repeatable release flow for the public package `@openframe/core`.
It avoids ad-hoc releases and keeps versioning/changelog/publish behavior deterministic.

## Scope

- Public package: `@openframe/core`
- Not published: `@openframe/web`, `@openframe/motion-pro`

## Required secrets and access

- npm token with publish rights: `NPM_TOKEN`
- GitHub permissions for Actions on `main`

## Local preflight checklist

1. Ensure clean install:
   - `pnpm install`
2. Ensure tests and app build pass:
   - `pnpm test`
   - `pnpm build`
3. Ensure core package builds and packs:
   - `pnpm --filter @openframe/core build`
   - `pnpm --filter @openframe/core pack`

## Create a release change

1. Create a changeset:
   - `pnpm changeset`
2. Select `@openframe/core`
3. Choose semver bump:
   - `patch` for fixes
   - `minor` for backwards-compatible features
   - `major` for breaking changes
4. Write concise release notes (why, not only what)

## Version and publish flow

### Preferred (GitHub Actions)

1. Merge PR with `.changeset/*.md` to `main`
2. Release workflow runs (`.github/workflows/release.yml`)
3. Changesets action creates/updates release PR with version bumps
4. Merge release PR
5. Changesets action publishes `@openframe/core` to npm

### Manual fallback (maintainer machine)

1. Apply versions:
   - `pnpm version-packages`
2. Commit generated version/changelog updates
3. Publish:
   - `pnpm release-packages`

## Post-release verification

1. Verify package on npm:
   - `npm view @openframe/core version`
2. Verify install in a temp project:
   - `pnpm add @openframe/core`
3. Smoke test imports:
   - `parsePageDocument`, `parseProjectFile`, `normalizeBlockMotion`

## Failure handling

### Publish failed in CI

- Check `NPM_TOKEN` validity and npm org access
- Re-run workflow after fixing secrets

### Wrong semver bump

- Add corrective changeset and release again
- Do not unpublish stable versions unless absolutely necessary

### Package contents incorrect

- Fix `packages/openframe-core/package.json` (`files`, `exports`, `prepack`)
- Rebuild and run `pnpm --filter @openframe/core pack` before re-release

## Notes

- Keep this runbook updated whenever release automation changes.
- If future public packages are added, extend this runbook with a package matrix.
