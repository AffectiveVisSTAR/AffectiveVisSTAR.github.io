import type { DragEvent, ReactNode } from "react";
import type { PanelOrder } from "./usePanelOrder";

type DraggablePanelProps = {
  id: string;
  panelOrder: PanelOrder;
  children: ReactNode;
};

// Wraps one colored panel so it can be dragged to a new place.
// Only elements marked data-drag-handle start a move: the grip icon in the title bar and the
// collapsed strip. They are always draggable, so the browser never mistakes the drag for
// selecting text, and all other text in the panel can still be selected as normal.
export default function DraggablePanel({ id, panelOrder, children }: DraggablePanelProps) {
  const { draggedId, dropTarget, startDrag, dragOver, drop, endDrag } = panelOrder;

  function handleDragStart(event: DragEvent<HTMLDivElement>) {
    const target = event.target instanceof Element ? event.target : null;
    const handle = target?.closest<HTMLElement>("[data-drag-handle]");
    // Not from a handle (e.g. dragging selected text): leave it to the browser.
    if (!handle) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", id);
    // Show the whole title bar under the pointer (not just the small grip, nor the whole tall panel).
    const preview = handle.closest<HTMLElement>("[data-drag-preview]") ?? handle;
    const rect = preview.getBoundingClientRect();
    event.dataTransfer.setDragImage(preview, event.clientX - rect.left, event.clientY - rect.top);
    startDrag(id);
  }

  function handleDragOver(event: DragEvent<HTMLDivElement>) {
    if (draggedId === null) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    const rect = event.currentTarget.getBoundingClientRect();
    dragOver(id, event.clientX < rect.left + rect.width / 2 ? "before" : "after");
  }

  function handleDragEnd() {
    endDrag();
  }

  const showLine = dropTarget?.id === id && draggedId !== id ? dropTarget.side : null;

  return (
    <div
      className={`relative flex shrink-0 items-start self-stretch transition-opacity ${draggedId === id ? "opacity-40" : ""}`}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDrop={(event) => {
        event.preventDefault();
        drop();
      }}
      onDragEnd={handleDragEnd}
    >
      {children}
      {showLine && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-y-0 z-30 w-[3px] rounded-full bg-neutral-800 ${
            showLine === "before" ? "-left-[7.5px]" : "-right-[7.5px]"
          }`}
        />
      )}
    </div>
  );
}
