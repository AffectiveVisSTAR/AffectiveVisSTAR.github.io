import { ChevronsIcon } from "./PanelTitleBar";
import { COLLAPSED_PANEL_WIDTH, HEADER_HEIGHT, TITLE_HEIGHT, tint } from "./layout";

type CollapsedPanelProps = {
  label: string;
  color: string;
  onExpand: () => void;
};

// A folded panel: a narrow strip in the panel color with the name written vertically.
// It stretches to the height of the other panels so the table keeps its shape.
export default function CollapsedPanel({ label, color, onExpand }: CollapsedPanelProps) {
  return (
    <section
      className="shrink-0 self-stretch rounded-md border border-neutral-300"
      style={{ width: COLLAPSED_PANEL_WIDTH, backgroundColor: tint(color) }}
      aria-label={`${label} (collapsed)`}
    >
      <button
        type="button"
        onClick={onExpand}
        title="Expand panel"
        aria-label={`Expand ${label}`}
        className="sticky top-0 z-10 flex w-full cursor-pointer flex-col items-center rounded-t-md text-neutral-900 hover:brightness-95 focus-visible:outline-2 focus-visible:outline-blue-600"
        style={{ height: HEADER_HEIGHT, backgroundColor: color }}
      >
        <span className="flex shrink-0 items-center justify-center" style={{ height: TITLE_HEIGHT }}>
          <ChevronsIcon direction="right" />
        </span>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap text-sm font-semibold [writing-mode:vertical-rl] rotate-180">
          {label}
        </span>
      </button>
    </section>
  );
}
