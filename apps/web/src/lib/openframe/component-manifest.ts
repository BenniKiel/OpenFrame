import { z } from "zod";

// ---------------------------------------------------------------------------
// Property Control Schemas
// ---------------------------------------------------------------------------

/**
 * Condition to hide a control based on the value of another prop.
 * Example: `{ "prop": "highlighted", "is": false }` hides the control when
 * `highlighted` is `false`.
 */
const hiddenConditionSchema = z.object({
  prop: z.string().min(1),
  is: z.unknown(),
});

const baseControlFields = {
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  hidden: hiddenConditionSchema.optional(),
};

type BaseControl = {
  title: string;
  description?: string;
  hidden?: { prop: string; is: unknown };
};

// --- Leaf controls (non-recursive) ---

const stringControlSchema = z.object({
  ...baseControlFields,
  type: z.literal("string"),
  defaultValue: z.string().optional(),
  placeholder: z.string().max(200).optional(),
  maxLength: z.number().int().min(1).max(10000).optional(),
  multiline: z.boolean().optional(),
});

const numberControlSchema = z.object({
  ...baseControlFields,
  type: z.literal("number"),
  defaultValue: z.number().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().positive().optional(),
  unit: z.string().max(20).optional(),
});

const booleanControlSchema = z.object({
  ...baseControlFields,
  type: z.literal("boolean"),
  defaultValue: z.boolean().optional(),
});

const enumControlSchema = z.object({
  ...baseControlFields,
  type: z.literal("enum"),
  options: z.array(z.string()).min(1).max(50),
  optionLabels: z.array(z.string()).max(50).optional(),
  defaultValue: z.string().optional(),
});

const colorControlSchema = z.object({
  ...baseControlFields,
  type: z.literal("color"),
  defaultValue: z.string().optional(),
});

const imageControlSchema = z.object({
  ...baseControlFields,
  type: z.literal("image"),
  defaultValue: z.string().optional(),
});

// --- Recursive controls ---

/**
 * Union of all property control types.  `array` and `object` are recursive
 * (their items / fields reference this union via `z.lazy`).
 */
export type PropertyControl =
  | z.infer<typeof stringControlSchema>
  | z.infer<typeof numberControlSchema>
  | z.infer<typeof booleanControlSchema>
  | z.infer<typeof enumControlSchema>
  | z.infer<typeof colorControlSchema>
  | z.infer<typeof imageControlSchema>
  | ArrayControl
  | ObjectControl;

type ArrayControl = BaseControl & {
  type: "array";
  itemControl: PropertyControl;
  maxItems?: number;
  defaultValue?: unknown[];
};

type ObjectControl = BaseControl & {
  type: "object";
  fields: Record<string, PropertyControl>;
  defaultValue?: Record<string, unknown>;
};

export const propertyControlSchema: z.ZodType<PropertyControl> = z.lazy(() =>
  z.discriminatedUnion("type", [
    stringControlSchema,
    numberControlSchema,
    booleanControlSchema,
    enumControlSchema,
    colorControlSchema,
    imageControlSchema,
    z.object({
      ...baseControlFields,
      type: z.literal("array"),
      itemControl: propertyControlSchema,
      maxItems: z.number().int().min(1).max(100).optional(),
      defaultValue: z.array(z.unknown()).optional(),
    }),
    z.object({
      ...baseControlFields,
      type: z.literal("object"),
      fields: z.record(z.string(), propertyControlSchema),
      defaultValue: z.record(z.string(), z.unknown()).optional(),
    }),
  ]),
);

// ---------------------------------------------------------------------------
// Component Manifest Schema
// ---------------------------------------------------------------------------

/**
 * Name pattern: lowercase, starts with a letter, may contain hyphens and
 * digits.  Must not collide with built-in block types.
 */
const componentNamePattern = /^[a-z][a-z0-9-]*$/;

export const componentManifestSchema = z.object({
  /** Schema version — currently always `1`. */
  version: z.literal(1),

  /** Machine-readable unique name.  Becomes the `PageNode.type` value. */
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(componentNamePattern, "Must start with lowercase letter, only lowercase alphanumeric and hyphens"),

  /** Human-readable name shown in the editor block picker. */
  displayName: z.string().min(1).max(100),

  /** Optional short description for tooltips / block picker. */
  description: z.string().max(500).optional(),

  /** Optional Lucide icon name for the block picker. */
  icon: z.string().max(50).optional(),

  /** Whether the component accepts `children` from the canonical tree. */
  acceptsChildren: z.boolean().default(false),

  /** Map of prop key → control definition. */
  propertyControls: z.record(z.string(), propertyControlSchema),
});

export type ComponentManifest = z.infer<typeof componentManifestSchema>;

// ---------------------------------------------------------------------------
// Parse helpers
// ---------------------------------------------------------------------------

export type ManifestParseResult =
  | { ok: true; data: ComponentManifest }
  | { ok: false; error: z.ZodError };

/** Validate an unknown value as a component manifest. */
export function parseComponentManifest(input: unknown): ManifestParseResult {
  const parsed = componentManifestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error };
  }
  return { ok: true, data: parsed.data };
}

/** Parse a JSON string into a validated component manifest. */
export function parseComponentManifestFromJson(text: string): ManifestParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text) as unknown;
  } catch {
    return {
      ok: false,
      error: new z.ZodError([{ code: "custom", message: "Invalid JSON", path: [] }]),
    };
  }
  return parseComponentManifest(raw);
}
