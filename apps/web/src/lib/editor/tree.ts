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
