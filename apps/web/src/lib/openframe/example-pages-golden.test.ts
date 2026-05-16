import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { parsePageDocumentFromJson } from "./page-document";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Stufe A — golden files: any `openframe/examples/*.page.json` must parse.
 * Keeps agent-edited examples aligned with `parsePageDocument` / Zod.
 */
const EXAMPLES_DIR = path.resolve(__dirname, "../../../../../openframe/examples");

describe("openframe/examples *.page.json (golden)", () => {
  const files = readdirSync(EXAMPLES_DIR)
    .filter((f) => f.endsWith(".page.json"))
    .sort();

  expect(files.length).toBeGreaterThan(0);

  it.each(files)("%s parses", (filename) => {
    const full = path.join(EXAMPLES_DIR, filename);
    const text = readFileSync(full, "utf8");
    const r = parsePageDocumentFromJson(text);
    expect(
      r.ok,
      r.ok ? "" : JSON.stringify(r.error.issues.map((i) => ({ path: i.path, message: i.message })), null, 2),
    ).toBe(true);
  });
});
