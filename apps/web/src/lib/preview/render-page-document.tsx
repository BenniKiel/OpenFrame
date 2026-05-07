import type { ComponentType, ReactNode } from "react";

import type { OpenframePageDocument, PageNode } from "@/lib/openframe";

import { UnknownTypeFallback, blockRegistry, type BlockProps } from "./block-components";
import { CustomComponentBlock } from "./custom-component-block";
import { isCustomComponent } from "./custom-component-registry";

/**
 * Resolve the React component for a given block type.
 *
 * Lookup chain:
 * 1. Built-in block registry (hardcoded blocks like container, frame, text …)
 * 2. Custom component registry (user-defined code components)
 * 3. UnknownTypeFallback (visible placeholder for unrecognised types)
 */
export function resolveBlock(type: string): ComponentType<BlockProps> {
  if (type in blockRegistry) return blockRegistry[type];
  if (isCustomComponent(type)) return CustomComponentBlock;
  return UnknownTypeFallback;
}

/**
 * Pure projection: validated document → React tree. No I/O.
 */
export function renderPageDocument(doc: OpenframePageDocument): ReactNode {
  return renderNode(doc.root);
}

export function renderNode(node: PageNode): ReactNode {
  const Block = resolveBlock(node.type);
  const childNodes = node.children.map((child) => renderNode(child));

  return (
    <Block key={node.id} node={node}>
      {childNodes}
    </Block>
  );
}
