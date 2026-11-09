"use client";

import { groupKey, type EmotionDisplayGroup } from "@/lib/emotion-layout";
import { LABEL_HEIGHT, ROW_HEIGHT, SUBGROUP_HEIGHT, TITLE_HEIGHT } from "../corpus/layout";

type EmotionColumnProps = {
  groups: EmotionDisplayGroup[];
  collapsedGroups: Set<string>;
  onToggleGroup: (key: string) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  canCollapseAll: boolean;
  canExpandAll: boolean;
  hoveredRowId: string | null;
  onHoverRow: (rowId: string | null) => void;
};

const CATEGORY_WIDTH = 44;
const EMOTION_COLUMNS = [
  { key: "name", label: "Affect", width: 200 },
  { key: "Basic Emotion", label: "Basic Emotion", width: 140 },
] as const;
export default function EmotionColumn({ groups, collapsedGroups, onToggleGroup, onCollapseAll, onExpandAll, canCollapseAll, canExpandAll, hoveredRowId, onHoverRow }: EmotionColumnProps) {
  const emotionCount = groups.reduce(
    (count, group) => count + group.rows.filter((row) => !row.isGroup).length,
    0,
  );

  return (
    <section className="sticky left-0 z-20 shrink-0 self-start rounded-md border border-neutral-300 bg-white">
      <table className="border-separate border-spacing-0 text-xs text-neutral-800">
        <caption className="sr-only">Emotions grouped by valence category</caption>
        <colgroup>
          <col style={{ width: CATEGORY_WIDTH }} />
          {EMOTION_COLUMNS.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-white">
          <tr>
            <th rowSpan={4} scope="col" className="border-r border-neutral-200 p-0 align-bottom">
              <div className="flex items-end justify-center rounded-tr-md pb-11" style={{ width: CATEGORY_WIDTH }}>
                <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                  Valence Category
                </span>
              </div>
            </th>
            <th colSpan={2} className="rounded-tr-md p-0 text-center text-sm font-semibold text-neutral-900">
              <div className="flex items-center justify-center rounded-tr-md bg-neutral-200" style={{ height: TITLE_HEIGHT }}>
                Emotions
              </div>
            </th>
          </tr>
          <tr>
            <th colSpan={2} className="p-0 text-center text-xs text-neutral-600">
              {/* <div className="flex items-center justify-center bg-neutral-100" style={{ height: SUBGROUP_HEIGHT }}>
                {emotionCount} emotions
              </div> */}
            </th>
          </tr>
          <tr>
            {EMOTION_COLUMNS.map((column) => (
              <th key={column.key} scope="col" className="border-b border-neutral-200 p-0">
                <div
                  className="flex items-end justify-start gap-1 px-2 pb-3 text-neutral-800"
                  style={{ height: LABEL_HEIGHT - 32, width: column.width }}
                >
                  <span>{column.label}</span>
                </div>
              </th>
            ))}
          </tr>
          <tr>
            <td colSpan={2} className="border-b border-neutral-200 bg-neutral-100 p-0 text-left">
              <div className="flex items-center px-2" style={{ height: 32 }}>
                <button
                  type="button"
                  onClick={canCollapseAll ? onCollapseAll : onExpandAll}
                  disabled={!canCollapseAll && !canExpandAll}
                  aria-label={canCollapseAll ? "Collapse all groups" : "Expand all groups"}
                  className="inline-flex h-7 cursor-pointer items-center gap-1 rounded-sm px-1 text-[11px] font-medium text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900 focus-visible:outline-2 focus-visible:outline-blue-600 disabled:cursor-default disabled:opacity-40"
                >
                  <span aria-hidden="true">{canCollapseAll ? "▾" : "▸"}</span>
                  <span>{canCollapseAll ? "Collapse all" : "Expand all"}</span>
                </button>
              </div>
            </td>
          </tr>
        </thead>
        {groups.map(({ category, rows }) => (
          <tbody key={category}>
            {rows.map((emotion, index) => (
              <tr
                key={emotion.id}
                style={{ opacity: hoveredRowId !== null && hoveredRowId !== groupKey(category, emotion.id) ? 0.6 : 1 }}
                onMouseEnter={() => onHoverRow(groupKey(category, emotion.id))}
                onMouseLeave={() => onHoverRow(null)}
              >
                {index === 0 && (
                  <th rowSpan={rows.length} scope="rowgroup" className={`border-r border-neutral-200 bg-neutral-50 p-0 align-middle ${category !== groups[0]?.category ? "border-t border-neutral-200" : ""}`}>
                    <div className="flex items-center justify-center" style={{ width: CATEGORY_WIDTH }}>
                      <span className="uppercase" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                        {category === "Main" ? "General" : category}
                      </span>
                    </div>
                  </th>
                )}
                <th scope="row" className={index === 0 && category !== groups[0]?.category ? "border-t border-neutral-200 p-0 text-left" : "p-0 text-left"}>
                  <div
                    title={emotion.name}
                    className={emotion.isChild ? "truncate pl-6 pr-2 font-normal" : "truncate px-2 font-semibold"}
                    style={{
                      height: ROW_HEIGHT,
                      lineHeight: `${ROW_HEIGHT}px`,
                      width: EMOTION_COLUMNS[0].width,
                      fontWeight: hoveredRowId === groupKey(category, emotion.id) ? 700 : undefined,
                    }}
                  >
                    {emotion.isGroup ? (
                      <button
                        type="button"
                        className="flex h-full w-full items-center gap-1 text-left font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                        aria-expanded={!collapsedGroups.has(groupKey(category, emotion.groupId!))}
                        onClick={() => onToggleGroup(groupKey(category, emotion.groupId!))}
                      >
                        <span aria-hidden="true">
                          {collapsedGroups.has(groupKey(category, emotion.groupId!)) ? "▸" : "▾"}
                        </span>
                        <span className="truncate">{emotion.name}</span>
                      </button>
                    ) : emotion.name}
                  </div>
                </th>
                <td className={index === 0 && category !== groups[0]?.category ? "border-t border-neutral-200 p-0" : "p-0"}>
                  <div
                    title={emotion.basicEmotion}
                    className={emotion.isGroup ? "truncate px-2 font-semibold" : "truncate px-2"}
                    style={{
                      height: ROW_HEIGHT,
                      lineHeight: `${ROW_HEIGHT}px`,
                      width: EMOTION_COLUMNS[1].width,
                      fontWeight: hoveredRowId === groupKey(category, emotion.id) ? 700 : undefined,
                    }}
                  >
                    {emotion.basicEmotion}
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
