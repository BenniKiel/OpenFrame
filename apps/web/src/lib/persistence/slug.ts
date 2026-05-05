/**
 * Slugs that would shadow Next.js routes or framework internals — never assignable to a page.
 * Match is case-insensitive (slugs themselves stay case-sensitive).
 */
export const RESERVED_PAGE_SLUGS: readonly string[] = [
  "admin",
  "api",
  "_next",
  "preview",
  "assets",
];

/**
 * Reject path traversal, odd characters, and reserved framework segments
 * for dynamic API and public route segments.
 */
export function isSafePageSlug(slug: string): boolean {
  if (slug.length === 0 || slug.length > 128) {
    return false;
  }
  if (slug.includes("/") || slug.includes("..") || slug.includes("\\")) {
    return false;
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(slug)) {
    return false;
  }
  return !RESERVED_PAGE_SLUGS.includes(slug.toLowerCase());
}
