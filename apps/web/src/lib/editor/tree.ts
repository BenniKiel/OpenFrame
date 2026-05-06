import type { PageNode } from "@/lib/openframe";

/** Default tree label when `node.name` is unset (Framer-style layer titles). */
export function getDefaultLayerTitle(type: string): string {
  switch (type) {
    case "text":
      return "Text";
    case "frame":
      return "Frame";
    case "heading":
      return "Heading";
    case "link":
      return "Link";
    case "button":
      return "Button";
    case "image":
      return "Image";
    case "container":
      return "Container";
    case "section":
      return "Section";
    case "split":
      return "Split";
    case "card":
      return "Card";
    default:
      return type;
  }
}

/** Resolved label for the layer list (custom `name` or default from `type`). */
export function getDisplayLayerName(node: PageNode): string {
  const n = node.name?.trim();
  if (n) {
    return n;
  }
  if (node.id === "root" && node.type === "container") {
    return "Page";
  }
  return getDefaultLayerTitle(node.type);
}

/** Placeholder for the layer name field when `name` is empty (= default title). */
export function getLayerNamePlaceholder(node: PageNode): string {
  return getDisplayLayerName({ ...node, name: undefined });
}

export function findNodeById(root: PageNode, id: string): PageNode | null {
  if (root.id === id) {
    return root;
  }
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) {
      return found;
    }
  }
  return null;
}

/** Returns false if `targetId` is the root id. */
export function removeNodeById(root: PageNode, targetId: string): boolean {
  if (root.id === targetId) {
    return false;
  }
  const idx = root.children.findIndex((c) => c.id === targetId);
  if (idx >= 0) {
    root.children.splice(idx, 1);
    return true;
  }
  for (const child of root.children) {
    if (removeNodeById(child, targetId)) {
      return true;
    }
  }
  return false;
}

export function addChildNode(parent: PageNode, child: PageNode): void {
  parent.children.push(child);
}

export type MoveDirection = "up" | "down";

export function canMoveNodeById(root: PageNode, targetId: string, direction: MoveDirection): boolean {
  if (root.id === targetId) {
    return false;
  }
  const idx = root.children.findIndex((c) => c.id === targetId);
  if (idx >= 0) {
    return direction === "up" ? idx > 0 : idx < root.children.length - 1;
  }
  for (const child of root.children) {
    if (canMoveNodeById(child, targetId, direction)) {
      return true;
    }
  }
  return false;
}

export function moveNodeById(root: PageNode, targetId: string, direction: MoveDirection): boolean {
  if (root.id === targetId) {
    return false;
  }
  const idx = root.children.findIndex((c) => c.id === targetId);
  if (idx >= 0) {
    const swapWith = direction === "up" ? idx - 1 : idx + 1;
    if (swapWith < 0 || swapWith >= root.children.length) {
      return false;
    }
    const [node] = root.children.splice(idx, 1);
    root.children.splice(swapWith, 0, node);
    return true;
  }
  for (const child of root.children) {
    if (moveNodeById(child, targetId, direction)) {
      return true;
    }
  }
  return false;
}

export type ReorderPlacement = "before" | "after" | "inside";

function isDescendantOf(node: PageNode, maybeAncestorId: string): boolean {
  for (const child of node.children) {
    if (child.id === maybeAncestorId || isDescendantOf(child, maybeAncestorId)) {
      return true;
    }
  }
  return false;
}

function findParentAndIndex(root: PageNode, id: string): { parent: PageNode; index: number } | null {
  const idx = root.children.findIndex((c) => c.id === id);
  if (idx >= 0) {
    return { parent: root, index: idx };
  }
  for (const child of root.children) {
    const found = findParentAndIndex(child, id);
    if (found) {
      return found;
    }
  }
  return null;
}

/**
 * Move `activeId` relative to `overId`.
 * Supports same-parent and cross-parent moves when the optional parent acceptance rule allows it.
 * placement "inside" appends activeId as the last child of overId.
 */
export function moveNodeByIds(
  root: PageNode,
  activeId: string,
  overId: string,
  placement: ReorderPlacement = "after",
  canParentAcceptChild?: (parent: PageNode, child: PageNode) => boolean,
): boolean {
  if (activeId === overId || root.id === activeId) {
    return false;
  }
  const activeFound = findParentAndIndex(root, activeId);
  const overFound = findParentAndIndex(root, overId);
  if (!activeFound || !overFound) {
    return false;
  }
  const activeNode = activeFound.parent.children[activeFound.index];

  if (placement === "inside") {
    const overNode = overFound.parent.children[overFound.index];
    if (isDescendantOf(activeNode, overNode.id) || activeNode.id === overNode.id) {
      return false;
    }
    if (canParentAcceptChild && !canParentAcceptChild(overNode, activeNode)) {
      return false;
    }
    activeFound.parent.children.splice(activeFound.index, 1);
    const refreshedOverFound = findParentAndIndex(root, overId);
    if (!refreshedOverFound) {
      return false;
    }
    const refreshedOverNode = refreshedOverFound.parent.children[refreshedOverFound.index];
    refreshedOverNode.children.push(activeNode);
    return true;
  }

  const overParent = overFound.parent;
  if (isDescendantOf(activeNode, overParent.id)) {
    return false;
  }
  if (canParentAcceptChild && !canParentAcceptChild(overParent, activeNode)) {
    return false;
  }

  activeFound.parent.children.splice(activeFound.index, 1);

  const refreshedOver = findParentAndIndex(root, overId);
  if (!refreshedOver) {
    return false;
  }
  let insertIdx = refreshedOver.index + (placement === "after" ? 1 : 0);
  insertIdx = Math.max(0, Math.min(refreshedOver.parent.children.length, insertIdx));
  refreshedOver.parent.children.splice(insertIdx, 0, activeNode);
  return true;
}

/** Backward-compatible alias used by existing tests/callers. */
export const reorderNodeWithinParentByIds = moveNodeByIds;
