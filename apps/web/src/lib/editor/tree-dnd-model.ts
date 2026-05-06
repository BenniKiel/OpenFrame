import type { PageNode } from "@/lib/openframe";

export type DndPlacement = "before" | "after" | "inside";

export type TreeDndRow = {
  nodeId: string;
  parentId: string | null;
  depth: number;
  indexInParent: number;
};

export type TreeDndSlot = {
  overNodeId: string;
  placement: DndPlacement;
};

export function flattenVisibleTree(root: PageNode, collapsedIds: Set<string>): TreeDndRow[] {
  const rows: TreeDndRow[] = [];
  const walk = (node: PageNode, parentId: string | null, depth: number, indexInParent: number) => {
    rows.push({ nodeId: node.id, parentId, depth, indexInParent });
    if (collapsedIds.has(node.id)) {
      return;
    }
    node.children.forEach((child, idx) => walk(child, node.id, depth + 1, idx));
  };
  walk(root, null, 0, 0);
  return rows;
}

export function buildNodeMaps(root: PageNode): {
  nodeById: Map<string, PageNode>;
  parentIdByNodeId: Map<string, string | null>;
} {
  const nodeById = new Map<string, PageNode>();
  const parentIdByNodeId = new Map<string, string | null>();
  const walk = (node: PageNode, parentId: string | null) => {
    nodeById.set(node.id, node);
    parentIdByNodeId.set(node.id, parentId);
    node.children.forEach((child) => walk(child, node.id));
  };
  walk(root, null);
  return { nodeById, parentIdByNodeId };
}

/** Returns true if `maybeAncestorId` is an ancestor of `nodeId` (i.e. nodeId is in maybeAncestor's subtree). */
export function isDescendant(
  parentIdByNodeId: Map<string, string | null>,
  nodeId: string,
  maybeAncestorId: string,
): boolean {
  let cursor: string | null = nodeId;
  while (cursor) {
    if (cursor === maybeAncestorId) {
      return true;
    }
    cursor = parentIdByNodeId.get(cursor) ?? null;
  }
  return false;
}

export function isAllowedDropSlot(args: {
  activeId: string;
  slot: TreeDndSlot;
  nodeById: Map<string, PageNode>;
  parentIdByNodeId: Map<string, string | null>;
  canParentAcceptChild: (parent: PageNode, child: PageNode) => boolean;
}): boolean {
  const { activeId, slot, nodeById, parentIdByNodeId, canParentAcceptChild } = args;
  if (slot.overNodeId === activeId) {
    return false;
  }
  // Prevent dropping inside own subtree
  if (isDescendant(parentIdByNodeId, slot.overNodeId, activeId)) {
    return false;
  }
  const activeNode = nodeById.get(activeId);
  if (!activeNode) {
    return false;
  }

  if (slot.placement === "inside") {
    // The over-node itself must accept the active node as a child
    const overNode = nodeById.get(slot.overNodeId);
    if (!overNode) {
      return false;
    }
    return canParentAcceptChild(overNode, activeNode);
  }

  // before / after: the parent of the over-node must accept the active node
  const overParentId = parentIdByNodeId.get(slot.overNodeId) ?? null;
  const overParent = overParentId ? nodeById.get(overParentId) : null;
  if (!overParent) {
    return false;
  }
  return canParentAcceptChild(overParent, activeNode);
}
