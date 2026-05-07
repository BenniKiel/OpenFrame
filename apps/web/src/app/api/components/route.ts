import { NextResponse } from "next/server";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { parseComponentManifest, type ComponentManifest } from "@/lib/openframe";

/**
 * Directory where custom component folders live.
 * Each sub-folder must contain a `component.manifest.json`.
 */
const COMPONENTS_DIR = path.resolve(process.cwd(), "../../openframe/components");

const MANIFEST_FILENAME = "component.manifest.json";

/**
 * GET /api/components — returns all valid component manifests.
 *
 * Scans `openframe/components/` for sub-directories containing a
 * `component.manifest.json`, validates each via Zod, and returns the
 * valid manifests.  Invalid manifests are logged and skipped.
 */
export async function GET() {
  let entries: string[];
  try {
    entries = await readdir(COMPONENTS_DIR);
  } catch {
    // Directory doesn't exist yet — fine, no custom components.
    return NextResponse.json([]);
  }

  const manifests: ComponentManifest[] = [];

  for (const entry of entries) {
    const manifestPath = path.join(COMPONENTS_DIR, entry, MANIFEST_FILENAME);
    let raw: string;
    try {
      raw = await readFile(manifestPath, "utf-8");
    } catch {
      // No manifest in this directory — skip silently.
      continue;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw) as unknown;
    } catch {
      console.warn(`[components] Invalid JSON in ${manifestPath}`);
      continue;
    }

    const result = parseComponentManifest(parsed);
    if (!result.ok) {
      console.warn(`[components] Invalid manifest in ${manifestPath}:`, result.error.issues);
      continue;
    }

    // Verify the manifest name matches the directory name.
    if (result.data.name !== entry) {
      console.warn(
        `[components] Manifest name "${result.data.name}" does not match directory "${entry}" — skipping`,
      );
      continue;
    }

    manifests.push(result.data);
  }

  return NextResponse.json(manifests);
}
