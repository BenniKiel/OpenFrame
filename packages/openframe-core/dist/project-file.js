import { z } from "zod";
export const openframeProjectFileSchema = z.object({
    version: z.literal(1),
    name: z.string().min(1),
    defaultPageSlug: z.string().min(1),
});
function invalidJsonError() {
    return new z.ZodError([
        {
            code: "custom",
            message: "Invalid JSON",
            path: [],
        },
    ]);
}
export function parseProjectFile(input) {
    const parsed = openframeProjectFileSchema.safeParse(input);
    if (!parsed.success) {
        return { ok: false, error: parsed.error };
    }
    return { ok: true, data: parsed.data };
}
export function parseProjectFileFromJson(text) {
    let raw;
    try {
        raw = JSON.parse(text);
    }
    catch {
        return { ok: false, error: invalidJsonError() };
    }
    return parseProjectFile(raw);
}
