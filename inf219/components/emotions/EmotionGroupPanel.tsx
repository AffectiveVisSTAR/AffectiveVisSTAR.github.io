import { useMemo } from "react";
import type { Paper, SuperGroup } from "@/lib/types";
import { groupKey, getEmotionPapers, type EmotionDisplayGroup } from "@/lib/emotion-layout";
import type { SelectedCell } from "./PaperPanel";

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
  papers: Paper[];
  hoveredColumnId: string | null;
  onHoverColumn: (columnId: string | null) => void;
  hoveredRowId: string | null;
  onHoverRow: (rowId: string | null) => void;
  selectedKey: string | null;
  onSelectCell: (cell: SelectedCell) => void;
};

// Fixed colour strength based on the number of unique papers.
function getColorStrength(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return 0.1;
  if (count <= 4) return 0.25;
  if (count <= 6) return 0.5;
  if (count <= 8) return 0.75;
  return 1;
}

// Calculate an opaque colour to keep scrolling smooth in Safari.
function heatmapColor(hex: string, count: number, dimmed: boolean): string {
  const strength = getColorStrength(count) * (dimmed ? 0.4 : 1);
  const brightness = count >= 11 ? 0.95 : 1;

  const channels = [1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16);
    const darkenedChannel = channel * brightness;

    return Math.round(255 + (darkenedChannel - 255) * strength);
  });

  return `rgb(${channels.join(", ")})`;
}

// Corpus-style headers with numeric emotion counts shown as heatmap squares.
export default function EmotionGroupPanel({
  superGroup,
  groups: rowGroups,
  papers,
  hoveredRowId,
  hoveredColumnId,
  onHoverRow,
  onHoverColumn,
  selectedKey,
  onSelectCell,
}: GroupPanelProps) {
  const { label, color, groups } = superGroup;

  // Hovering changes the highlight, so reuse the existing article lists.
  const articlesByRow = useMemo(() => {
    const result = new Map<string, Map<string, string[]>>();
    for (const { category, rows } of rowGroups) {
      for (const row of rows) {
        const columns = new Map<string, string[]>();
        for (const group of groups) {
          for (const column of group.columns) {
            columns.set(column, getEmotionPapers(row, column, papers));
          }
        }
        result.set(groupKey(category, row.id), columns);
      }
    }
    return result;
  }, [rowGroups, groups, papers]);


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
                    style={{
                      maxHeight: LABEL_HEIGHT - 8,
                      opacity: hoveredColumnId !== null && hoveredColumnId !== groupKey(superGroup.id, column) ? 0.6 : 1,
                      fontWeight: hoveredColumnId === groupKey(superGroup.id, column) ? 700 : undefined,
                    }}
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
              <tr
                key={row.id}
                onMouseEnter={() => onHoverRow(groupKey(category, row.id))}
                onMouseLeave={() => onHoverRow(null)}
              >
                <td className={index === 0 ? "border-t border-slate-300 p-0" : "p-0"}>
                  <div className="flex px-1" style={{ gap: GROUP_GAP, height: ROW_HEIGHT }}>
                    {groups.map((group) => (
                      <div key={group.id} className="flex">
                        {group.columns.map((column) => {
                          const articles = articlesByRow.get(groupKey(category, row.id))!.get(column)!;
                          const count = articles.length;
                          const hasHover = hoveredRowId !== null || hoveredColumnId !== null;
                          const isActiveRow = hoveredRowId === groupKey(category, row.id);
                          const isActiveColumn = hoveredColumnId === groupKey(superGroup.id, column);
                          const dimmed = hasHover && !isActiveRow && !isActiveColumn;
                          const cellKey = JSON.stringify([category, row.id, column]);
                          const square = (
                            <span
                              className={cellKey === selectedKey ? "rounded-[2px] ring-2 ring-neutral-900 ring-offset-1" : "rounded-[2px]"}
                              style={{
                                width: CELL_SIZE,
                                height: CELL_SIZE,
                                backgroundColor: heatmapColor(color, count, dimmed),
                              }}
                            />
                          );
                          const label = `${category}, ${row.name}, ${column}: ${count}`;

                          // Only squares with papers open the side panel.
                          if (count === 0) {
                            return (
                              <div
                                key={column}
                                className="flex items-center justify-center"
                                style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                                role="img"
                                aria-label={label}
                                title={`${count}:`}
                              >
                                {square}
                              </div>
                            );
                          }

                          return (
                            <button
                              key={column}
                              type="button"
                              className="flex cursor-pointer items-center justify-center focus-visible:outline-2 focus-visible:outline-blue-600"
                              style={{ width: COLUMN_WIDTH, height: ROW_HEIGHT }}
                              onMouseEnter={() => onHoverColumn(groupKey(superGroup.id, column))}
                              onMouseLeave={() => onHoverColumn(null)}
                              aria-label={label}
                              aria-pressed={cellKey === selectedKey}
                              title={[`${count}:`, ...articles].join("\n")}
                              onClick={() =>
                                onSelectCell({ key: cellKey, title: `${row.name} / ${column}`, authorYears: articles })
                              }
                            >
                              {square}
                            </button>
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
