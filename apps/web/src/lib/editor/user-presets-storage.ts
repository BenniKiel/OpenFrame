import { pageNodeSchema, type PageNode } from "@/lib/openframe";

const STORAGE_KEY = "openframe:user-presets:v1";

export type StoredUserPreset = {
  id: string;
  name: string;
  description?: string;
  /** ISO 8601 */
  createdAt: string;
  root: PageNode;
};

function safeRandomId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `up-${Date.now()}`;
}

export function loadUserPresets(): StoredUserPreset[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const out: StoredUserPreset[] = [];
    for (const row of parsed) {
      if (!row || typeof row !== "object") {
        continue;
      }
      const r = row as Partial<StoredUserPreset>;
      if (typeof r.id !== "string" || typeof r.name !== "string" || !r.root) {
        continue;
      }
      const rootParsed = pageNodeSchema.safeParse(r.root);
      if (!rootParsed.success) {
        continue;
      }
      out.push({
        id: r.id,
        name: r.name.slice(0, 128),
        description: typeof r.description === "string" ? r.description.slice(0, 500) : undefined,
        createdAt: typeof r.createdAt === "string" ? r.createdAt : new Date().toISOString(),
        root: rootParsed.data,
      });
    }
    return out;
  } catch {
    return [];
  }
}

export function persistUserPresets(presets: StoredUserPreset[]): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // quota / private mode
  }
}

export function addUserPreset(entry: Omit<StoredUserPreset, "id" | "createdAt"> & { id?: string }): StoredUserPreset {
  const presets = loadUserPresets();
  const record: StoredUserPreset = {
    id: entry.id ?? safeRandomId(),
    name: entry.name.trim().slice(0, 128),
    description: entry.description?.trim().slice(0, 500),
    createdAt: new Date().toISOString(),
    root: entry.root,
  };
  presets.push(record);
  persistUserPresets(presets);
  return record;
}

export function deleteUserPreset(id: string): void {
  const next = loadUserPresets().filter((p) => p.id !== id);
  persistUserPresets(next);
}
