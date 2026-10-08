import { CELL_SIZE, COLUMN_WIDTH, ROW_HEIGHT, tint } from "./layout";

type CellProps = {
  marked: boolean;
  color: string;
};

// One square in the table: full color if the paper is marked with X, otherwise a faint tint.
export default function Cell({ marked, color }: CellProps) {
  return (
    <div
      className="flex shrink-0 items-center justify-center"
      style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
    >
      <div
        className="rounded-[2px]"
        style={{
          width: CELL_SIZE,
          height: CELL_SIZE,
          backgroundColor: marked ? color : tint(color, "1a"),
        }}
      />
    </div>
  );
}
