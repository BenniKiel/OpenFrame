import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { describe, expect, it } from "vitest";

import * as schema from "@/db/schema";

import { createPageRepository } from "./page-repository";

function makeRepository() {
  const sqlite = new Database(":memory:");
  sqlite.exec(`
    CREATE TABLE \`pages\` (
      \`id\` text PRIMARY KEY NOT NULL,
      \`slug\` text NOT NULL,
      \`document_json\` text NOT NULL,
      \`updated_at\` integer NOT NULL
    );
    CREATE UNIQUE INDEX \`pages_slug_unique\` ON \`pages\` (\`slug\`);
  `);
  const database = drizzle(sqlite, { schema });
  return createPageRepository(database);
}

const minimalDoc = {
  version: 1 as const,
  root: {
    id: "home-root",
    type: "container",
    props: {},
    children: [],
  },
};

describe("createPageRepository", () => {
  it("upserts and reads by slug", () => {
    const repo = makeRepository();
    const up = repo.upsertPageFromInput("home", minimalDoc);
    expect(up.ok).toBe(true);

    const got = repo.getPageBySlug("home");
    expect(got.ok).toBe(true);
    if (got.ok) {
      expect(got.data.version).toBe(1);
      expect(got.data.root.id).toBe("home-root");
    }

    expect(repo.listPageSlugs()).toEqual(["home"]);
  });

  it("rejects invalid input on upsert", () => {
    const repo = makeRepository();
    const up = repo.upsertPageFromInput("home", { version: 2, root: minimalDoc.root });
    expect(up.ok).toBe(false);
  });

  it("returns not_found for missing slug", () => {
    const repo = makeRepository();
    const got = repo.getPageBySlug("missing");
    expect(got.ok).toBe(false);
    if (!got.ok) {
      expect(got.error).toBe("not_found");
    }
  });
});
