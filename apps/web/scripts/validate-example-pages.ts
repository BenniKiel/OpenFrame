/**
 * Agent / CI helper (Stufe A): validate every `openframe/examples/*.page.json`
 * with the same `parsePageDocumentFromJson` gate as the app.
 *
 * Usage (from repo root):
 *   pnpm validate:examples
 *   pnpm validate:examples -- --json
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parsePageDocumentFromJson } from "../src/lib/openframe/page-document";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** Repo root (this file: apps/web/scripts/…). */
const repoRoot = path.resolve(__dirname, "../../..");
const examplesDir = path.join(repoRoot, "openframe/examples");

const jsonMode = process.argv.includes("--json");

const files = readdirSync(examplesDir)
  .filter((f) => f.endsWith(".page.json"))
  .sort();

type IssueRow = { path: string[]; message: string };

const results: { file: string; ok: boolean; issues: IssueRow[] }[] = [];

for (const name of files) {
  const full = path.join(examplesDir, name);
  const text = readFileSync(full, "utf8");
  const r = parsePageDocumentFromJson(text);
  if (r.ok) {
    results.push({ file: name, ok: true, issues: [] });
  } else {
    results.push({
      file: name,
      ok: false,
      issues: r.error.issues.map((i) => ({
        path: i.path.map(String),
        message: i.message,
      })),
    });
  }
}

const failed = results.filter((x) => !x.ok);

if (jsonMode) {
  console.log(JSON.stringify({ ok: failed.length === 0, examplesDir, results }, null, 2));
} else {
  console.log(`Validating ${files.length} file(s) under openframe/examples/*.page.json\n`);
  for (const r of results) {
    if (r.ok) {
      console.log(`ok  ${r.file}`);
    } else {
      console.log(`FAIL ${r.file}`);
      for (const issue of r.issues) {
        const p = issue.path.length ? issue.path.join(".") : "(root)";
        console.log(`  ${p}: ${issue.message}`);
      }
    }
  }
  if (failed.length > 0) {
    console.log(`\n${failed.length} file(s) failed parsePageDocumentFromJson.`);
  }
}

process.exit(failed.length > 0 ? 1 : 0);
