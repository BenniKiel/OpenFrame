import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * Minimal persistence for the MVP scaffold.
 * Canonical page documents remain JSON (validated in app code); SQLite stores rows for lookup and future APIs.
 */
export const pages = sqliteTable("pages", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  documentJson: text("document_json").notNull(),
  updatedAt: integer("updated_at", { mode: "number" }).notNull(),
});
