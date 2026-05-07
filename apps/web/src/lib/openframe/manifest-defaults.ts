import type { ComponentManifest, PropertyControl } from "./component-manifest";

// ---------------------------------------------------------------------------
// Default value helpers
// ---------------------------------------------------------------------------

/** Fallback default for a given control type when no explicit `defaultValue` is set. */
function typeDefault(type: PropertyControl["type"]): unknown {
  switch (type) {
    case "string":
      return "";
    case "number":
      return 0;
    case "boolean":
      return false;
    case "enum":
      return "";
    case "color":
      return "#000000";
    case "image":
      return "";
    case "array":
      return [];
    case "object":
      return {};
    default:
      return undefined;
  }
}

/** Resolve the effective default value for a single property control. */
export function resolveControlDefault(control: PropertyControl): unknown {
  if (control.defaultValue !== undefined) {
    return control.defaultValue;
  }

  // For enums, prefer the first option when no explicit default is given.
  if (control.type === "enum" && control.options.length > 0) {
    return control.options[0];
  }

  return typeDefault(control.type);
}

/**
 * Build a complete default `props` record from a component manifest.
 *
 * Used when inserting a new custom component node into the canonical tree
 * (equivalent to `defaultFaqPropsRecord()` etc. for built-in blocks).
 */
export function buildDefaultPropsFromManifest(
  manifest: ComponentManifest,
): Record<string, unknown> {
  const props: Record<string, unknown> = {};
  for (const [key, control] of Object.entries(manifest.propertyControls)) {
    props[key] = resolveControlDefault(control);
  }
  return props;
}
