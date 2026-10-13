"use client";

import { useState } from "react";
import type { EmotionRow } from "@/lib/types";
import { LABEL_HEIGHT, ROW_HEIGHT, SUBGROUP_HEIGHT, TITLE_HEIGHT } from "../corpus/layout";

type EmotionColumnProps = {
  emotions: EmotionRow[];
};

const CATEGORY_WIDTH = 44;
const EMOTION_COLUMNS = [
  { key: "name", label: "Affect", width: 200 },
  { key: "Basic Emotion", label: "Basic Emotion", width: 140 },
] as const;
const CATEGORY_ORDER = ["Negative", "Positive", "Neutral", "Main"];

// Put rows with the same valence together without changing the source data.
function groupByValence(emotions: EmotionRow[]) {
  const groups = new Map<string, EmotionRow[]>();
  for (const emotion of emotions) {
    const category = emotion["Valence Category"];
    const rows = groups.get(category) ?? [];
    rows.push(emotion);
    groups.set(category, rows);
  }
  const categories = [
    ...CATEGORY_ORDER.filter((category) => groups.has(category)),
    ...Array.from(groups.keys()).filter((category) => !CATEGORY_ORDER.includes(category)),
  ];
  return categories.map((category) => ({ category, rows: groups.get(category)! }));
}

type DisplayRow = {
  id: string;
  name: string;
  basicEmotion: string;
  isGroup: boolean;
  isChild: boolean;
  groupId?: string;
};

// The original table hides category totals and groups the remaining emotions.
function buildDisplayRows(rows: EmotionRow[]): DisplayRow[] {
  const basics = new Map<string, EmotionRow[]>();
  for (const row of rows) {
    if (row.isAggregate === "X") continue;
    const basic = row["Basic Emotion"];
    const members = basics.get(basic) ?? [];
    members.push(row);
    basics.set(basic, members);
  }

  const result: DisplayRow[] = [];
  const names = Array.from(basics.keys()).sort((a, b) =>
    a === "_" ? -1 : b === "_" ? 1 : a.localeCompare(b),
  );

  for (const basic of names) {
    const members = basics.get(basic)!;
    const hasGroup = basic !== "_" && members.length > 1;
    if (hasGroup) {
      result.push({
        id: "group:" + basic,
        name: basic,
        basicEmotion: basic,
        isGroup: true,
        isChild: false,
        groupId: basic,
      });
    }
    for (const member of [...members].sort((a, b) => a.name.localeCompare(b.name))) {
      result.push({
        id: "emotion:" + member.name,
        name: member.name,
        basicEmotion: basic === "_" ? "–" : basic,
        isGroup: false,
        isChild: hasGroup,
        groupId: hasGroup ? basic : undefined,
      });
    }
  }
  return result;
}

export default function EmotionColumn({ emotions }: EmotionColumnProps) {
  // Include the valence category: Negative/Action and Positive/Action toggle independently.
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const groupKey = (category: string, basic: string) => JSON.stringify([category, basic]);

  function toggleGroup(key: string) {
    setExpandedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const groups = groupByValence(emotions).map((group) => ({
    category: group.category,
    rows: buildDisplayRows(group.rows).filter((row) =>
      !row.isChild || expandedGroups.has(groupKey(group.category, row.groupId!)),
    ),
  })).filter((group) => group.rows.length > 0);

  return (
    <section className="sticky left-0 z-20 shrink-0 self-start border-r-2 border-slate-500 bg-white">
      <table className="border-separate border-spacing-0 text-xs text-neutral-800">
        <caption className="sr-only">Emotions grouped by valence category</caption>
        <colgroup>
          <col style={{ width: CATEGORY_WIDTH }} />
          {EMOTION_COLUMNS.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr>
            <th rowSpan={3} scope="col" className="border-r-2 border-slate-500 p-0 align-bottom">
              <div className="flex items-end justify-center pb-3" style={{ width: CATEGORY_WIDTH }}>
                <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                  Valence Category
                </span>
              </div>
            </th>
            <th colSpan={2} className="p-0 text-center text-xs font-semibold uppercase" style={{ backgroundColor: "#f6f0f0" }}>
              <div className="flex items-center justify-center" style={{ height: TITLE_HEIGHT }}>
                Emotions
              </div>
            </th>
          </tr>
          <tr>
            <th colSpan={2} className="p-0 text-center text-xs font-semibold uppercase" style={{ backgroundColor: "#f6f0f0" }}>
              <div className="flex items-center justify-center" style={{ height: SUBGROUP_HEIGHT }}>
                Emotions
              </div>
            </th>
          </tr>
          <tr>
            {EMOTION_COLUMNS.map((column) => (
              <th key={column.key} scope="col" className="border-b border-slate-200 p-0">
                <div
                  className="flex items-end justify-center pb-3"
                  style={{ height: LABEL_HEIGHT, width: column.width }}
                >
                  <span style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                    {column.label}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        {groups.map(({ category, rows }) => (
          <tbody key={category}>
            {rows.map((emotion, index) => (
              <tr key={emotion.id}>
                {index === 0 && (
                  <th rowSpan={rows.length} scope="rowgroup" className="border-r-2 border-t border-slate-300 bg-slate-50 p-0 align-middle">
                    <div className="flex items-center justify-center" style={{ width: CATEGORY_WIDTH }}>
                      <span className="uppercase" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                        {category === "Main" ? "General" : category}
                      </span>
                    </div>
                  </th>
                )}
                <th scope="row" className={index === 0 ? "border-t border-slate-300 p-0 text-left" : "p-0 text-left"}>
                  <div
                    title={emotion.name}
                    className={emotion.isChild ? "truncate pl-6 pr-2 font-normal" : "truncate px-2 font-semibold"}
                    style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px`, width: EMOTION_COLUMNS[0].width }}
                  >
                    {emotion.isGroup ? (
                      <button
                        type="button"
                        className="flex h-full w-full items-center gap-1 text-left font-semibold hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                        aria-expanded={expandedGroups.has(groupKey(category, emotion.groupId!))}
                        onClick={() => toggleGroup(groupKey(category, emotion.groupId!))}
                      >
                        <span aria-hidden="true">
                          {expandedGroups.has(groupKey(category, emotion.groupId!)) ? "▾" : "▸"}
                        </span>
                        <span className="truncate">{emotion.name}</span>
                      </button>
                    ) : emotion.name}
                  </div>
                </th>
                <td className={index === 0 ? "border-t border-slate-300 p-0" : "p-0"}>
                  <div
                    title={emotion.basicEmotion}
                    className={emotion.isGroup ? "truncate px-2 font-semibold" : "truncate px-2"}
                    style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px`, width: EMOTION_COLUMNS[1].width }}
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
