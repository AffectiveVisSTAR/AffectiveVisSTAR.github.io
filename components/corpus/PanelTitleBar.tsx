import { TITLE_HEIGHT } from "./layout";

type PanelTitleBarProps = {
  label: string;
  color: string;
  onCollapse: () => void;
};

// Colored name bar at the top of a panel, with a button that folds the panel into a narrow strip.
// The grip icon on the left is the handle for dragging the panel to a new place (see DraggablePanel);
// the rest of the bar stays normal text that can be selected.
// Shared by the Corpus and Emotions pages.
export default function PanelTitleBar({ label, color, onCollapse }: PanelTitleBarProps) {
  return (
    <div
      data-drag-preview
      className="group/title relative flex items-center justify-center rounded-t-md px-8 text-sm font-semibold text-neutral-900"
      style={{ height: TITLE_HEIGHT, backgroundColor: color }}
    >
      <span
        data-drag-handle
        draggable
        title="Drag to move panel"
        aria-hidden="true"
        className="absolute left-1.5 flex size-6 cursor-grab select-none items-center justify-center rounded text-neutral-800 opacity-60 hover:bg-black/10 group-hover/title:opacity-100 active:cursor-grabbing"
      >
        <GripIcon />
      </span>
      {label}
      <button
        type="button"
        onClick={onCollapse}
        title="Collapse panel"
        aria-label={`Collapse ${label}`}
        className="absolute right-1.5 flex size-6 cursor-pointer items-center justify-center rounded text-neutral-800 hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-blue-600"
      >
        <ChevronsIcon direction="left" />
      </button>
    </div>
  );
}

// Six dots, the usual sign that something can be dragged.
export function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <circle cx="9" cy="5" r="1.75" />
      <circle cx="15" cy="5" r="1.75" />
      <circle cx="9" cy="12" r="1.75" />
      <circle cx="15" cy="12" r="1.75" />
      <circle cx="9" cy="19" r="1.75" />
      <circle cx="15" cy="19" r="1.75" />
    </svg>
  );
}

// Double chevron: "left" (collapse) or "right" (expand).
export function ChevronsIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={direction === "right" ? { transform: "scaleX(-1)" } : undefined}
    >
      <path d="m11 17-5-5 5-5" />
      <path d="m18 17-5-5 5-5" />
    </svg>
  );
}
