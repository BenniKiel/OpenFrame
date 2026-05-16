const { spawnSync } = require("node:child_process");
const path = require("node:path");

const webRoot = path.join(__dirname, "..");
const env = { ...process.env, SKIP_SCREENSHOT: "1" };

const r = spawnSync(
  "pnpm",
  ["exec", "playwright", "test", "e2e/page-visual-report.spec.ts"],
  { cwd: webRoot, stdio: "inherit", env, shell: true },
);

process.exit(r.status === null ? 1 : r.status);
