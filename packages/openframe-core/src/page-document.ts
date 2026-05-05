import { z } from "zod";

/** Phase 3.1 — page shell tokens (bounded enums; no raw CSS in JSON). */
export const pageThemeSchema = z.object({
  radius: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  colorScheme: z.enum(["light", "dark"]).optional(),
  typographyScale: z.enum(["default", "large"]).optional(),
});

export type PageTheme = z.infer<typeof pageThemeSchema>;

/** Phase 3.3 — optional SEO / social fields (see ADR 0002). */
export const pageMetaSchema = z.object({
  title: z.string().max(200).optional(),
  description: z.string().max(2000).optional(),
  ogImage: z.string().max(2048).optional(),
});

export type PageMeta = z.infer<typeof pageMetaSchema>;

/**
 * Recursive node model for the canonical page document.
 * Keep intentionally small for MVP; extend via versioned migrations later.
 */
export const pageNodeSchema: z.ZodType<PageNode> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    /** Optional human-readable layer name (editor / tree); omit or empty for auto label from `type`. */
    name: z
      .union([z.string(), z.number(), z.null(), z.undefined()])
      .optional()
      .transform((val) => {
        if (val == null) {
          return undefined;
        }
        const t = String(val).trim().slice(0, 128);
        return t === "" ? undefined : t;
      }),
    props: z.record(z.string(), z.unknown()).default({}),
    children: z.array(pageNodeSchema).default([]),
  }),
);

export type PageNode = {
  id: string;
  type: string;
  /** Optional display name in the editor layer tree; stable `id` is unchanged. */
  name?: string;
  props: Record<string, unknown>;
  children: PageNode[];
};

export const openframePageDocumentSchema = z.object({
  version: z.literal(1),
  root: pageNodeSchema,
  theme: pageThemeSchema.optional(),
  meta: pageMetaSchema.optional(),
});

export type OpenframePageDocument = z.infer<typeof openframePageDocumentSchema>;

export type PageDocumentParseResult =
  | { ok: true; data: OpenframePageDocument }
  | { ok: false; error: z.ZodError };

function collectDuplicateNodeIds(root: PageNode): string[] {
  const counts = new Map<string, number>();

  function walk(node: PageNode): void {
    counts.set(node.id, (counts.get(node.id) ?? 0) + 1);
    for (const child of node.children) {
      walk(child);
    }
  }

  walk(root);

  const duplicates: string[] = [];
  for (const [id, n] of counts) {
    if (n > 1) {
      duplicates.push(id);
    }
  }
  return duplicates.sort();
}

function duplicateIdsError(duplicateIds: string[]): z.ZodError {
  return new z.ZodError([
    {
      code: "custom",
      message: `Duplicate node ids: ${duplicateIds.join(", ")}`,
      path: ["root"],
    },
  ]);
}

function invalidJsonError(): z.ZodError {
  return new z.ZodError([
    {
      code: "custom",
      message: "Invalid JSON",
      path: [],
    },
  ]);
}

/**
 * Validates unknown input (e.g. POST body, agent output) and enforces unique `id` across the tree.
 */
export function parsePageDocument(input: unknown): PageDocumentParseResult {
  const parsed = openframePageDocumentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }

  const duplicateIds = collectDuplicateNodeIds(parsed.data.root);
  if (duplicateIds.length > 0) {
    return { ok: false, error: duplicateIdsError(duplicateIds) };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Same as {@link parsePageDocument}, but accepts a JSON string (file on disk, fetch response).
 */
export function parsePageDocumentFromJson(text: string): PageDocumentParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: invalidJsonError() };
  }
  return parsePageDocument(raw);
}
