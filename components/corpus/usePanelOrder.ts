import { useState } from "react";
import { SUPER_GROUPS } from "@/lib/columns";
import type { SuperGroup } from "@/lib/types";

export type DropSide = "before" | "after";

// Order of the colored panels, changed by dragging a panel's grip icon (or a collapsed strip).
// Resets on page reload.
export default function usePanelOrder() {
  const [order, setOrder] = useState<string[]>(() => SUPER_GROUPS.map((superGroup) => superGroup.id));
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{ id: string; side: DropSide } | null>(null);

  const orderedGroups: SuperGroup[] = order.map((id) => SUPER_GROUPS.find((superGroup) => superGroup.id === id)!);

  function startDrag(id: string) {
    setDraggedId(id);
  }

  function dragOver(id: string, side: DropSide) {
    // Back over the dragged panel itself: no target, so dropping there leaves the order as it is.
    if (id === draggedId) {
      if (dropTarget !== null) setDropTarget(null);
      return;
    }
    if (dropTarget?.id !== id || dropTarget.side !== side) setDropTarget({ id, side });
  }

  function drop() {
    if (draggedId && dropTarget && draggedId !== dropTarget.id) {
      setOrder((previous) => {
        const next = previous.filter((id) => id !== draggedId);
        const targetIndex = next.indexOf(dropTarget.id);
        next.splice(dropTarget.side === "before" ? targetIndex : targetIndex + 1, 0, draggedId);
        return next;
      });
    }
    endDrag();
  }

  function endDrag() {
    setDraggedId(null);
    setDropTarget(null);
  }

  return { orderedGroups, draggedId, dropTarget, startDrag, dragOver, drop, endDrag };
}

export type PanelOrder = ReturnType<typeof usePanelOrder>;
