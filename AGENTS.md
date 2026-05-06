<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Changeset Reminder Rule

When working in this repository, agents MUST proactively evaluate whether a changeset is required.

- Trigger this check for every task that touches `packages/openframe-core/**` or changes public exports/types/contracts used by npm consumers.
- If a changeset is required, remind the user and propose running `pnpm changeset` with the correct semver bump (`patch`, `minor`, `major`).
- If changes affect only `apps/web/**` or internal tooling/docs without public `@openframe/core` impact, explicitly state that no changeset is needed.
- Before finishing implementation work, include a short "Changeset: required / not required" note in the final response.
