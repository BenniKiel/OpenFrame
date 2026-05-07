"use client";

import { useMemo } from "react";

import { resolveControlDefault } from "@/lib/openframe";

import type { BlockProps } from "./block-shared";
import { getCustomManifest } from "./custom-component-registry";
import { DynamicCustomComponent } from "./dynamic-custom-component";

/**
 * Generic block renderer for custom (code) components.
 *
 * Reads the component's manifest from the registry, merges default values
 * with the node's stored props, and renders the component.
 *
 * **MVP limitation:** In this first version the actual React component is NOT
 * dynamically loaded from the file system.  Instead, this block renders a
 * **visual placeholder** showing the component name and its resolved props.
 * Dynamic `import()` of user TSX files requires a bundler integration spike
 * (see implementation plan — Phase 1 technical spike).
 *
 * Once the dynamic loading path is validated, this component will use
 * `React.lazy(() => import(...))` to render the real component.
 */
export function CustomComponentBlock({ node, children }: BlockProps) {
  const manifest = getCustomManifest(node.type);

  // Resolve props: manifest defaults ← node.props overrides
  const resolvedProps = useMemo(() => {
    if (!manifest) return node.props;
    const result: Record<string, unknown> = {};
    for (const [key, control] of Object.entries(manifest.propertyControls)) {
      result[key] = node.props[key] ?? resolveControlDefault(control);
    }
    // Pass through any extra props not in the manifest
    for (const [key, val] of Object.entries(node.props)) {
      if (!(key in result)) {
        result[key] = val;
      }
    }
    return result;
  }, [node.props, manifest]);

  if (!manifest) {
    return (
      <div
        data-of-node-id={node.id}
        className="my-2 rounded-md border border-sky-300 bg-sky-50 p-3 text-sm text-sky-950"
      >
        <div className="font-semibold">Custom component not found</div>
        <div className="mt-1 font-mono text-xs">
          type={node.type} id={node.id}
        </div>
      </div>
    );
  }

  return (
    <div data-of-node-id={node.id} className="relative w-full">
      <DynamicCustomComponent componentName={manifest.name} resolvedProps={resolvedProps}>
        {manifest.acceptsChildren ? children : undefined}
      </DynamicCustomComponent>
    </div>
  );
}
