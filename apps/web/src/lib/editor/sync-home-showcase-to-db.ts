import { db } from "@/db/client";
import { homeShowcasePageDocument } from "@/lib/editor/home-showcase-document";
import { createPageRepository } from "@/lib/persistence/page-repository";

/** Writes the canonical home showcase document to SQLite as slug `home`. */
export function syncHomeShowcaseToDatabase() {
  const repo = createPageRepository(db);
  return repo.upsertPageDocument("home", structuredClone(homeShowcasePageDocument));
}
