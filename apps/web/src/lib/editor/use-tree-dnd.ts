import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DragEndEvent, DragOverEvent, DragStartEvent } from "@dnd-kit/core";

import type { PageNode } from "@/lib/openframe";

import { isAllowedDropSlot, buildNodeMaps, type DndPlacement, type TreeDndSlot } from "./tree-dnd-model";

const AUTO_EXPAND_DELAY_MS = 600;

export function useTreeDnd(args: {
  documentRoot: PageNode | null;
  canParentAcceptChild: (parent: PageNode, child: PageNode) => boolean;
  isCollapsed?: (id: string) => boolean;
  onAutoExpand?: (id: string) => void;
}) {
  const { documentRoot, canParentAcceptChild, isCollapsed, onAutoExpand } = args;
  const [dragActiveId, setDragActiveId] = useState<string | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<TreeDndSlot | null>(null);

  const maps = useMemo(() => {
    if (!documentRoot) {
      return {
        nodeById: new Map<string, PageNode>(),
        parentIdByNodeId: new Map<string, string | null>(),
      };
    }
    return buildNodeMaps(documentRoot);
  }, [documentRoot]);

  const onDragStart = useCallback((event: DragStartEvent) => {
    setDragActiveId(String(event.active.id));
    setDragOverSlot(null);
  }, []);

  const onDragOver = useCallback(
    (event: DragOverEvent) => {
      const activeId = event.active ? String(event.active.id) : null;
      const overId = event.over ? String(event.over.id) : null;
      if (!activeId || !overId || activeId === overId) {
        setDragOverSlot(null);
        return;
      }

      const activeParentId = maps.parentIdByNodeId.get(activeId) ?? null;
      const overParentId = maps.parentIdByNodeId.get(overId) ?? null;
      const overNode = maps.nodeById.get(overId);
      const activeNode = maps.nodeById.get(activeId);

      // Special-case root as "place among top-level children"
      if (overId === "root") {
        const rootNode = maps.nodeById.get("root");
        if (!rootNode || rootNode.children.length === 0) {
          setDragOverSlot(null);
          return;
        }
        const activeRect = event.active.rect.current.translated;
        const overRect = event.over?.rect;
        const pointerY = activeRect && overRect ? activeRect.top + activeRect.height / 2 : Number.POSITIVE_INFINITY;
        const rootMidY = overRect ? overRect.top + overRect.height / 2 : Number.POSITIVE_INFINITY;
        const targetNodeId = pointerY <= rootMidY ? rootNode.children[0]?.id : rootNode.children[rootNode.children.length - 1]?.id;
        const targetPlacement: DndPlacement = pointerY <= rootMidY ? "before" : "after";
        if (!targetNodeId) {
          setDragOverSlot(null);
          return;
        }
        const rootSlot: TreeDndSlot = { overNodeId: targetNodeId, placement: targetPlacement };
        setDragOverSlot(isAllowedDropSlot({ activeId, slot: rootSlot, ...maps, canParentAcceptChild }) ? rootSlot : null);
        return;
      }

      // Container-capable = over node may receive children at all
      const overCanReceiveActive = !!(
        overNode && activeNode && canParentAcceptChild(overNode, activeNode)
      );

      // Determine placement from pointer Y relative to the over-element
      const activeRect = event.active.rect.current.translated;
      const overRect = event.over?.rect;
      let placement: DndPlacement = "after";
      if (activeRect && overRect) {
        const pointerY = activeRect.top + activeRect.height / 2;
        const relY = (pointerY - overRect.top) / Math.max(1, overRect.height);
        if (overCanReceiveActive) {
          // 3 zones: before / inside / after
          if (relY < 0.28) {
            placement = "before";
          } else if (relY > 0.72) {
            placement = "after";
          } else {
            placement = "inside";
          }
        } else {
          // 2 zones only: leaf-style row → before / after
          placement = relY < 0.5 ? "before" : "after";
        }
      }

      // Reordering inside same parent should behave like move up/down: before/after only.
      if (activeParentId && overParentId && activeParentId === overParentId) {
        placement = placement === "before" ? "before" : "after";
      }

      // Try the computed placement, then sensible fallbacks
      const trySlot = (p: DndPlacement): TreeDndSlot | null => {
        const s: TreeDndSlot = { overNodeId: overId, placement: p };
        return isAllowedDropSlot({ activeId, slot: s, ...maps, canParentAcceptChild }) ? s : null;
      };

      const resolved =
        trySlot(placement) ??
        (placement === "inside" ? trySlot("after") ?? trySlot("before") : null) ??
        trySlot("after") ??
        trySlot("before") ??
        null;

      setDragOverSlot(resolved);
    },
    [canParentAcceptChild, maps],
  );

  const onDragCancel = useCallback(() => {
    setDragActiveId(null);
    setDragOverSlot(null);
  }, []);

  const consumeDrop = useCallback(
    (event: DragEndEvent): { activeId: string; slot: TreeDndSlot } | null => {
      void event;
      const slot = dragOverSlot;
      const activeId = dragActiveId;
      setDragActiveId(null);
      setDragOverSlot(null);
      if (!activeId || !slot) {
        return null;
      }
      if (!isAllowedDropSlot({ activeId, slot, ...maps, canParentAcceptChild })) {
        return null;
      }
      return { activeId, slot };
    },
    [canParentAcceptChild, dragActiveId, dragOverSlot, maps],
  );

  // Auto-expand collapsed parent on sustained Inside hover (Framer-style)
  const expandTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
      expandTimerRef.current = null;
    }
    if (!dragOverSlot || dragOverSlot.placement !== "inside") {
      return;
    }
    if (!isCollapsed || !onAutoExpand) {
      return;
    }
    const id = dragOverSlot.overNodeId;
    if (!isCollapsed(id)) {
      return;
    }
    expandTimerRef.current = setTimeout(() => {
      onAutoExpand(id);
    }, AUTO_EXPAND_DELAY_MS);
    return () => {
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
        expandTimerRef.current = null;
      }
    };
  }, [dragOverSlot, isCollapsed, onAutoExpand]);

  return {
    dragActiveId,
    dragOverSlot,
    onDragStart,
    onDragOver,
    onDragCancel,
    consumeDrop,
  };
}
