import { z } from "zod";
/** Phase 3.1 — page shell tokens (bounded enums; no raw CSS in JSON). */
export declare const pageThemeSchema: z.ZodObject<{
    radius: z.ZodOptional<z.ZodEnum<{
        none: "none";
        sm: "sm";
        md: "md";
        lg: "lg";
        xl: "xl";
    }>>;
    colorScheme: z.ZodOptional<z.ZodEnum<{
        light: "light";
        dark: "dark";
    }>>;
    typographyScale: z.ZodOptional<z.ZodEnum<{
        default: "default";
        large: "large";
    }>>;
}, z.core.$strip>;
export type PageTheme = z.infer<typeof pageThemeSchema>;
/** Phase 3.3 — optional SEO / social fields (see ADR 0002). */
export declare const pageMetaSchema: z.ZodObject<{
    title: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
    ogImage: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type PageMeta = z.infer<typeof pageMetaSchema>;
/**
 * Recursive node model for the canonical page document.
 * Keep intentionally small for MVP; extend via versioned migrations later.
 */
export declare const pageNodeSchema: z.ZodType<PageNode>;
export type PageNode = {
    id: string;
    type: string;
    /** Optional display name in the editor layer tree; stable `id` is unchanged. */
    name?: string;
    props: Record<string, unknown>;
    children: PageNode[];
};
export declare const openframePageDocumentSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    root: z.ZodType<PageNode, unknown, z.core.$ZodTypeInternals<PageNode, unknown>>;
    theme: z.ZodOptional<z.ZodObject<{
        radius: z.ZodOptional<z.ZodEnum<{
            none: "none";
            sm: "sm";
            md: "md";
            lg: "lg";
            xl: "xl";
        }>>;
        colorScheme: z.ZodOptional<z.ZodEnum<{
            light: "light";
            dark: "dark";
        }>>;
        typographyScale: z.ZodOptional<z.ZodEnum<{
            default: "default";
            large: "large";
        }>>;
    }, z.core.$strip>>;
    meta: z.ZodOptional<z.ZodObject<{
        title: z.ZodOptional<z.ZodString>;
        description: z.ZodOptional<z.ZodString>;
        ogImage: z.ZodOptional<z.ZodString>;
    }, z.core.$strip>>;
}, z.core.$strip>;
export type OpenframePageDocument = z.infer<typeof openframePageDocumentSchema>;
export type PageDocumentParseResult = {
    ok: true;
    data: OpenframePageDocument;
} | {
    ok: false;
    error: z.ZodError;
};
/**
 * Validates unknown input (e.g. POST body, agent output) and enforces unique `id` across the tree.
 */
export declare function parsePageDocument(input: unknown): PageDocumentParseResult;
/**
 * Same as {@link parsePageDocument}, but accepts a JSON string (file on disk, fetch response).
 */
export declare function parsePageDocumentFromJson(text: string): PageDocumentParseResult;
