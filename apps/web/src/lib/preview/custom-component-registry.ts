import type { ComponentManifest } from "@/lib/openframe";

export type CustomComponentEntry = {
  manifest: ComponentManifest;
};

/** In-memory registry — populated via `loadCustomComponentManifests`. */
const customRegistry = new Map<string, CustomComponentEntry>();

/**
 * Load all component manifests from the discovery API.
 * Call once when the editor or preview frame mounts, and on manual reload.
 */
export async function loadCustomComponentManifests(): Promise<void> {
  try {
    const res = await fetch("/api/components");
    if (!res.ok) {
      console.warn("[custom-components] Failed to load manifests:", res.status);
      return;
    }
    const manifests: ComponentManifest[] = (await res.json()) as ComponentManifest[];
    customRegistry.clear();
    for (const m of manifests) {
      customRegistry.set(m.name, { manifest: m });
    }
  } catch (e) {
    console.warn("[custom-components] Error loading manifests:", e);
  }
}

/** Get a loaded manifest by component name (= PageNode.type). */
export function getCustomManifest(name: string): ComponentManifest | undefined {
  return customRegistry.get(name)?.manifest;
}

/** List all registered custom component manifests. */
export function listCustomComponents(): ComponentManifest[] {
  return Array.from(customRegistry.values()).map((e) => e.manifest);
}

/** Check if a PageNode.type corresponds to a registered custom component. */
export function isCustomComponent(type: string): boolean {
  return customRegistry.has(type);
}

/** Clear all entries (useful for testing). */
export function clearCustomRegistry(): void {
  customRegistry.clear();
}
