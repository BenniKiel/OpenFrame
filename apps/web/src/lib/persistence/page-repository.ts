import { asc, eq } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { pages } from "@/db/schema";
import type * as schema from "@/db/schema";
import { parsePageDocument, type OpenframePageDocument } from "@/lib/openframe";
import type { ZodError } from "zod";

export type AppDb = BetterSQLite3Database<typeof schema>;

export type GetPageResult =
  | { ok: true; data: OpenframePageDocument }
  | { ok: false; error: "not_found" }
  | { ok: false; error: "invalid_json" }
  | { ok: false; error: "invalid_stored"; zodError: ZodError };

export type UpsertPageFromInputResult =
  | { ok: true; data: OpenframePageDocument }
  | { ok: false; zodError: ZodError };

export type UpsertPageDocumentResult =
  | { ok: true; data: OpenframePageDocument }
  | { ok: false; zodError: ZodError };

/**
 * MVP policy: `id` column equals `slug` for a single stable identifier per row.
 */
export function createPageRepository(database: AppDb) {
  function upsertPageDocument(slug: string, doc: OpenframePageDocument): UpsertPageDocumentResult {
    const parse = parsePageDocument(doc);
    if (!parse.ok) {
      return { ok: false, zodError: parse.error };
    }

    const documentJson = JSON.stringify(parse.data);
    const updatedAt = Date.now();

    database
      .insert(pages)
      .values({
        id: slug,
        slug,
        documentJson,
        updatedAt,
      })
      .onConflictDoUpdate({
        target: pages.slug,
        set: {
          id: slug,
          documentJson,
          updatedAt,
        },
      })
      .run();

    return { ok: true, data: parse.data };
  }

  return {
    listPageSlugs(): string[] {
      const rows = database.select({ slug: pages.slug }).from(pages).orderBy(asc(pages.slug)).all();
      return rows.map((r) => r.slug);
    },

    getPageBySlug(slug: string): GetPageResult {
      const row = database.select().from(pages).where(eq(pages.slug, slug)).get();
      if (!row) {
        return { ok: false, error: "not_found" };
      }

      let raw: unknown;
      try {
        raw = JSON.parse(row.documentJson) as unknown;
      } catch {
        return { ok: false, error: "invalid_json" };
      }

      const parse = parsePageDocument(raw);
      if (!parse.ok) {
        return { ok: false, error: "invalid_stored", zodError: parse.error };
      }

      return { ok: true, data: parse.data };
    },

    upsertPageFromInput(slug: string, input: unknown): UpsertPageFromInputResult {
      const parse = parsePageDocument(input);
      if (!parse.ok) {
        return { ok: false, zodError: parse.error };
      }
      return upsertPageDocument(slug, parse.data);
    },

    upsertPageDocument,
  };
}

export type PageRepository = ReturnType<typeof createPageRepository>;
