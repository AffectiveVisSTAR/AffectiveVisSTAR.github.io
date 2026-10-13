import { getEmotionCount, type EmotionDisplayGroup } from "@/lib/emotion-layout";
import type { SuperGroup } from "@/lib/types";

import {
  CELL_SIZE,
  COLUMN_WIDTH,
  GROUP_GAP,
  LABEL_HEIGHT,
  ROW_HEIGHT,
  SUBGROUP_HEIGHT,
  TITLE_HEIGHT,
  tint,
} from "../corpus/layout";

type GroupPanelProps = {
  superGroup: SuperGroup;
  groups: EmotionDisplayGroup[];
};

// Corpus-style headers with numeric emotion counts shown as heatmap squares.
export default function EmotionGroupPanel({ superGroup, groups: rowGroups }: GroupPanelProps) {
  const { label, color, groups } = superGroup;
  const maximums = new Map<string, number>();
  for (const group of groups) {
    for (const column of group.columns) {
      maximums.set(column, Math.max(1, ...rowGroups.flatMap((section) =>
        section.rows.map((row) => getEmotionCount(row, column)),
      )));
    }
  }

  return (
    <section className="shrink-0 rounded-md border border-neutral-300 bg-white">
      <header className="sticky top-0 z-10 rounded-t-md bg-white">
        <div
          className="flex items-center justify-center rounded-t-md px-3 text-sm font-semibold text-neutral-900"
          style={{ height: TITLE_HEIGHT, backgroundColor: color }}
        >
          {label}
        </div>

        <div className="flex px-1" style={{ gap: GROUP_GAP, backgroundColor: tint(color, "66") }}>
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex items-center justify-center text-center text-xs leading-tight text-neutral-800"
              style={{ width: group.columns.length * COLUMN_WIDTH, height: SUBGROUP_HEIGHT }}
            >
              {group.label}
            </div>
          ))}
        </div>

        <div
          className="flex border-b border-neutral-200 px-1"
          style={{ gap: GROUP_GAP, height: LABEL_HEIGHT }}
        >
          {groups.map((group) => (
            <div key={group.id} className="flex">
              {group.columns.map((column) => (
                <div
                  key={column}
                  className="flex h-full shrink-0 items-end justify-center py-1"
                  style={{ width: COLUMN_WIDTH }}
                >
                  <span
                    title={column}
                    className="overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-neutral-800 [writing-mode:vertical-rl] rotate-180"
                    style={{ maxHeight: LABEL_HEIGHT - 8 }}
                  >
                    {column}
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </header>

      <table className="border-separate border-spacing-0">
        <caption className="sr-only">{label}: counts by emotion</caption>
        {rowGroups.map(({ category, rows }) => (
          <tbody key={category}>
            {rows.map((row, index) => (
              <tr key={row.id}>
                <td className={index === 0 ? "border-t border-slate-300 p-0" : "p-0"}>
                  <div className="flex px-1" style={{ gap: GROUP_GAP, height: ROW_HEIGHT }}>
                    {groups.map((group) => (
                      <div key={group.id} className="flex">
                        {group.columns.map((column) => {
                          const count = getEmotionCount(row, column);
                          const maxCount = maximums.get(column)!;
                          return (
                            <div
                              key={column}
                              className="flex items-center justify-center"
                              style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                              role="img"
                              aria-label={`${category}, ${row.name}, ${column}: ${count}`}
                              title={`${row.name} / ${column}: ${count}`}
                            >
                              <span
                                className="rounded-[2px]"
                                style={{
                                  width: CELL_SIZE,
                                  height: CELL_SIZE,
                                  backgroundColor: group.color,
                                  opacity: count === 0 ? 0.08 : 0.2 + 0.8 * count / maxCount,
                                }}
                              />
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  );
}
