import { CELL_SIZE, COLUMN_WIDTH, ROW_HEIGHT } from "./layout";

type CellProps = {
  marked: boolean;
  color: string;
  dimmed: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
};

// One square in the table: full color if the paper is marked with X, empty when unmarked. Dim colours are blended with white to stay opaque.
export default function Cell({ marked, color, dimmed, onMouseEnter, onMouseLeave }: CellProps) {
  const backgroundColor = marked
    ? `rgb(${[1, 3, 5].map((offset) => {
        const channel = parseInt(color.slice(offset, offset + 2), 16);
        return Math.round(255 + (channel - 255) * (dimmed ? 0.6 : 1));
      }).join(", ")})`
    : "transparent";

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex shrink-0 items-center justify-center"
      style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
    >
      <div
        className="rounded-[2px]"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor,
        }}
      />
    </div>
  );
}
