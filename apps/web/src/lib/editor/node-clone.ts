import type { PageNode } from "@/lib/openframe";

export function createEditorNodeId(kindHint: string): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${kindHint}-${Date.now()}`;
}

/** Deep clone with new ids everywhere (safe for paste / presets / duplicate). */
export function cloneSubtreeWithFreshIds(node: PageNode): PageNode {
  const propsCopy = JSON.parse(JSON.stringify(node.props)) as Record<string, unknown>;
  return {
    id: createEditorNodeId(node.type),
    type: node.type,
    props: propsCopy,
    name: node.name,
    children: node.children.map(cloneSubtreeWithFreshIds),
  };
}
