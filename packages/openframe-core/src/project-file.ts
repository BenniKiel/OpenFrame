import { z } from "zod";

export const openframeProjectFileSchema = z.object({
  version: z.literal(1),
  name: z.string().min(1),
  defaultPageSlug: z.string().min(1),
});

export type OpenframeProjectFile = z.infer<typeof openframeProjectFileSchema>;

export type ProjectFileParseResult =
  | { ok: true; data: OpenframeProjectFile }
  | { ok: false; error: z.ZodError };

function invalidJsonError(): z.ZodError {
  return new z.ZodError([
    {
      code: "custom",
      message: "Invalid JSON",
      path: [],
    },
  ]);
}

export function parseProjectFile(input: unknown): ProjectFileParseResult {
  const parsed = openframeProjectFileSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, data: parsed.data };
}

export function parseProjectFileFromJson(text: string): ProjectFileParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return { ok: false, error: invalidJsonError() };
  }
  return parseProjectFile(raw);
}
