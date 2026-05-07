import { describe, it, expect } from "vitest";

import {
  parseComponentManifest,
  parseComponentManifestFromJson,
  componentManifestSchema,
} from "./component-manifest";

// ---------------------------------------------------------------------------
// Minimal valid manifest
// ---------------------------------------------------------------------------

const MINIMAL_MANIFEST = {
  version: 1,
  name: "my-widget",
  displayName: "My Widget",
  propertyControls: {},
};

const FULL_MANIFEST = {
  version: 1,
  name: "pricing-card",
  displayName: "Pricing Card",
  description: "A pricing card with plan name, price, features and CTA.",
  icon: "credit-card",
  acceptsChildren: false,
  propertyControls: {
    planName: {
      type: "string",
      title: "Plan Name",
      defaultValue: "Pro",
      placeholder: "e.g. Pro, Enterprise",
      maxLength: 100,
    },
    price: {
      type: "number",
      title: "Price",
      defaultValue: 29,
      min: 0,
      max: 99999,
      step: 1,
      unit: "$/mo",
    },
    highlighted: {
      type: "boolean",
      title: "Highlighted",
      defaultValue: false,
    },
    features: {
      type: "array",
      title: "Features",
      maxItems: 20,
      itemControl: {
        type: "string",
        title: "Feature",
        defaultValue: "Feature item",
      },
    },
    accentColor: {
      type: "color",
      title: "Accent Color",
      defaultValue: "#6366f1",
    },
    ctaVariant: {
      type: "enum",
      title: "CTA Style",
      options: ["primary", "secondary", "ghost"],
      optionLabels: ["Primary", "Secondary", "Ghost"],
      defaultValue: "primary",
    },
    badgeText: {
      type: "string",
      title: "Badge",
      defaultValue: "",
      hidden: { prop: "highlighted", is: false },
    },
    backgroundImage: {
      type: "image",
      title: "Background Image",
    },
  },
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("componentManifestSchema", () => {
  it("accepts a minimal valid manifest", () => {
    const result = componentManifestSchema.safeParse(MINIMAL_MANIFEST);
    expect(result.success).toBe(true);
  });

  it("accepts a full manifest with all control types", () => {
    const result = componentManifestSchema.safeParse(FULL_MANIFEST);
    expect(result.success).toBe(true);
  });

  it("defaults acceptsChildren to false", () => {
    const result = componentManifestSchema.parse(MINIMAL_MANIFEST);
    expect(result.acceptsChildren).toBe(false);
  });

  it("rejects version !== 1", () => {
    const result = componentManifestSchema.safeParse({ ...MINIMAL_MANIFEST, version: 2 });
    expect(result.success).toBe(false);
  });

  it("rejects names with uppercase letters", () => {
    const result = componentManifestSchema.safeParse({ ...MINIMAL_MANIFEST, name: "MyWidget" });
    expect(result.success).toBe(false);
  });

  it("rejects names starting with a digit", () => {
    const result = componentManifestSchema.safeParse({ ...MINIMAL_MANIFEST, name: "1widget" });
    expect(result.success).toBe(false);
  });

  it("accepts kebab-case names", () => {
    const result = componentManifestSchema.safeParse({ ...MINIMAL_MANIFEST, name: "my-cool-widget-2" });
    expect(result.success).toBe(true);
  });

  it("rejects empty displayName", () => {
    const result = componentManifestSchema.safeParse({ ...MINIMAL_MANIFEST, displayName: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing propertyControls", () => {
    const { propertyControls: _, ...rest } = MINIMAL_MANIFEST;
    const result = componentManifestSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it("validates nested object control", () => {
    const manifest = {
      ...MINIMAL_MANIFEST,
      propertyControls: {
        settings: {
          type: "object",
          title: "Settings",
          fields: {
            label: { type: "string", title: "Label" },
            count: { type: "number", title: "Count", min: 0 },
          },
        },
      },
    };
    const result = componentManifestSchema.safeParse(manifest);
    expect(result.success).toBe(true);
  });

  it("validates hidden condition on controls", () => {
    const manifest = {
      ...MINIMAL_MANIFEST,
      propertyControls: {
        toggle: { type: "boolean", title: "Toggle" },
        detail: {
          type: "string",
          title: "Detail",
          hidden: { prop: "toggle", is: false },
        },
      },
    };
    const result = componentManifestSchema.safeParse(manifest);
    expect(result.success).toBe(true);
  });

  it("rejects enum with no options", () => {
    const manifest = {
      ...MINIMAL_MANIFEST,
      propertyControls: {
        variant: { type: "enum", title: "Variant", options: [] },
      },
    };
    const result = componentManifestSchema.safeParse(manifest);
    expect(result.success).toBe(false);
  });
});

describe("parseComponentManifest", () => {
  it("returns ok for valid input", () => {
    const result = parseComponentManifest(FULL_MANIFEST);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.name).toBe("pricing-card");
    }
  });

  it("returns error for invalid input", () => {
    const result = parseComponentManifest({ version: 99 });
    expect(result.ok).toBe(false);
  });
});

describe("parseComponentManifestFromJson", () => {
  it("parses valid JSON string", () => {
    const result = parseComponentManifestFromJson(JSON.stringify(MINIMAL_MANIFEST));
    expect(result.ok).toBe(true);
  });

  it("returns error for broken JSON", () => {
    const result = parseComponentManifestFromJson("{nope");
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.issues[0].message).toBe("Invalid JSON");
    }
  });

  it("returns Zod error for valid JSON but invalid schema", () => {
    const result = parseComponentManifestFromJson(JSON.stringify({ version: 1 }));
    expect(result.ok).toBe(false);
  });
});
