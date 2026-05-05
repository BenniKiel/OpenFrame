import type { ReactNode } from "react";

import type { OpenframePageDocument, PageNode } from "@/lib/openframe";

import { UnknownTypeFallback, blockRegistry } from "./block-components";

/**
 * Pure projection: validated document → React tree. No I/O.
 */
export function renderPageDocument(doc: OpenframePageDocument): ReactNode {
  return renderNode(doc.root);
}

export function renderNode(node: PageNode): ReactNode {
  const Block = blockRegistry[node.type] ?? UnknownTypeFallback;
  const childNodes = node.children.map((child) => renderNode(child));

  return (
    <Block key={node.id} node={node}>
      {childNodes}
    </Block>
  );
}
