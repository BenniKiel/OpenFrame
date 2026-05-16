/**
 * Starts `next dev` and (unless OPENFRAME_DEV_HOME_SYNC is disabled) syncs slug `home`
 * from `home-showcase-document.ts` on startup and whenever that file is saved — no manual
 * `pnpm seed:home -- --force` during iteration.
 */
import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");

function syncDisabled(): boolean {
  const v = process.env.OPENFRAME_DEV_HOME_SYNC?.trim().toLowerCase();
  return v === "0" || v === "false" || v === "off";
}

function seed(): void {
  execSync("pnpm exec tsx scripts/seed-home-showcase.ts -- --force", {
    cwd: appRoot,
    stdio: "inherit",
    env: { ...process.env, OPENFRAME_SEED_HOME_FORCE: "1" },
  });
}

function main(): void {
  if (syncDisabled()) {
    const plain = spawn("pnpm", ["exec", "next", "dev"], {
      cwd: appRoot,
      stdio: "inherit",
    });
    plain.on("exit", (code) => process.exit(code ?? 0));
    return;
  }

  try {
    seed();
    console.log("[openframe] Dev: synced canonical home showcase → SQLite (before dev server).");
  } catch {
    console.warn("[openframe] Initial home sync failed — fix errors or run `pnpm seed:home -- --force`.");
  }

  const canonicalPath = path.join(appRoot, "src/lib/editor/home-showcase-document.ts");
  let debounce: ReturnType<typeof setTimeout> | undefined;

  try {
    if (fs.existsSync(canonicalPath)) {
      fs.watch(canonicalPath, { persistent: true }, () => {
        if (debounce) {
          clearTimeout(debounce);
        }
        debounce = setTimeout(() => {
          console.log("[openframe] home-showcase-document.ts changed — syncing SQLite…");
          try {
            seed();
          } catch {
            console.warn("[openframe] Seed after file change failed.");
          }
        }, 450);
      });
    }
  } catch {
    console.warn("[openframe] Could not watch home-showcase-document.ts.");
  }

  const next = spawn("pnpm", ["exec", "next", "dev"], {
    cwd: appRoot,
    stdio: "inherit",
  });

  const forwardSignal = () => {
    next.kill("SIGTERM");
  };
  process.on("SIGINT", forwardSignal);
  process.on("SIGTERM", forwardSignal);

  next.on("exit", (code) => process.exit(code ?? 0));
}

main();
