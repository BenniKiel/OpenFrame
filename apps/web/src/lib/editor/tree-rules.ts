import type { PageNode } from "@/lib/openframe";

function isRootNode(node: PageNode): boolean {
  return node.id === "root" && node.type === "container";
}

/**
 * Parent/child constraints for tree drag-and-drop.
 *
 * Current product constraints:
 * - `root` is the only document container node.
 * - `section` and `container` can only exist directly under `root`.
 */
export function canParentAcceptChild(parent: PageNode, child: PageNode): boolean {
  if (isRootNode(parent)) {
    return true;
  }
  if (child.type === "section" || child.type === "container") {
    return false;
  }
  if (
    parent.type === "faq" ||
    parent.type === "testimonial" ||
    parent.type === "logo-cloud" ||
    parent.type === "nav-header"
  ) {
    return false;
  }
  return (
    parent.type === "container" ||
    parent.type === "frame" ||
    parent.type === "section" ||
    parent.type === "split" ||
    parent.type === "card"
  );
}

