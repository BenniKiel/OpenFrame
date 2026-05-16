/**
 * Writes the canonical home showcase (`homeShowcasePageDocument`) to SQLite as slug `home`.
 *
 * Use when `/` still shows an old or polluted `home` row (e.g. after e2e tests shared `slug=home`)
 * while `openframe/examples/home-showcase.page.json` and `home-showcase-document.ts` were updated.
 *
 * Requires `--force` (or CI env below) so production DBs are not overwritten by accident.
 *
 * Usage (from repo root):
 *   pnpm seed:home -- --force
 *
 * Local dev: `pnpm dev` runs `next-dev-with-home-sync.ts`, which seeds `home` once and on each
 * save to `home-showcase-document.ts`. Use `pnpm dev:plain` or OPENFRAME_DEV_HOME_SYNC=0 to skip.
 *
 * Env:
 *   DATABASE_PATH — same as the Next app (default: apps/web/.data/openframe.db when cwd is apps/web)
 *   OPENFRAME_SEED_HOME_FORCE=1 — same as --force (for automation)
 */
import process from "node:process";

import { syncHomeShowcaseToDatabase } from "../src/lib/editor/sync-home-showcase-to-db";

const argv = process.argv.slice(2);
const forced =
  argv.includes("--force") ||
  process.env.OPENFRAME_SEED_HOME_FORCE === "1" ||
  process.env.OPENFRAME_SEED_HOME_FORCE === "true";

if (!forced) {
  console.error(
    [
      "Refusing to overwrite `home` without confirmation.",
      "",
      "This replaces the SQLite row for slug `home` with the canonical showcase from",
      "`apps/web/src/lib/editor/home-showcase-document.ts` (same tree as",
      "`openframe/examples/home-showcase.page.json`).",
      "",
      "Run:",
      "  pnpm seed:home -- --force",
      "",
      "Or set OPENFRAME_SEED_HOME_FORCE=1",
      "",
      `DATABASE_PATH (effective): ${process.env.DATABASE_PATH ?? "(default .data/openframe.db under cwd)"}`,
    ].join("\n"),
  );
  process.exit(1);
}

const result = syncHomeShowcaseToDatabase();

if (!result.ok) {
  console.error("Validation failed:", result.zodError.flatten());
  process.exit(1);
}

console.log(
  "OK: slug `home` now matches the canonical home showcase document.",
  "\nReload `/` or run `pnpm report:page-visual` to verify.",
);
