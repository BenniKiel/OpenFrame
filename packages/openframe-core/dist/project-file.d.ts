import { z } from "zod";
export declare const openframeProjectFileSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    name: z.ZodString;
    defaultPageSlug: z.ZodString;
}, z.core.$strip>;
export type OpenframeProjectFile = z.infer<typeof openframeProjectFileSchema>;
export type ProjectFileParseResult = {
    ok: true;
    data: OpenframeProjectFile;
} | {
    ok: false;
    error: z.ZodError;
};
export declare function parseProjectFile(input: unknown): ProjectFileParseResult;
export declare function parseProjectFileFromJson(text: string): ProjectFileParseResult;
