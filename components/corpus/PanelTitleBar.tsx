import { TITLE_HEIGHT } from "./layout";

type PanelTitleBarProps = {
  label: string;
  color: string;
  onCollapse: () => void;
};

// Colored name bar at the top of a panel, with a button that folds the panel into a narrow strip.
// Shared by the Corpus and Emotions pages.
export default function PanelTitleBar({ label, color, onCollapse }: PanelTitleBarProps) {
  return (
    <div
      className="relative flex items-center justify-center rounded-t-md px-8 text-sm font-semibold text-neutral-900"
      style={{ height: TITLE_HEIGHT, backgroundColor: color }}
    >
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
