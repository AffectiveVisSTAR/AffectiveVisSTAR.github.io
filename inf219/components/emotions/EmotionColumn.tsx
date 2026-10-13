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

export default function EmotionColumn({ emotions }: EmotionColumnProps) {
  const groups = groupByValence(emotions);

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
              <tr key={emotion.name}>
                {index === 0 && (
                  <th rowSpan={rows.length} scope="rowgroup" className="border-r-2 border-t border-slate-300 bg-slate-50 p-0 align-middle">
                    <div className="flex items-center justify-center" style={{ width: CATEGORY_WIDTH }}>
                      <span className="uppercase" style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}>
                        {category === "Main" ? "General" : category}
                      </span>
                    </div>
                  </th>
                )}
                {EMOTION_COLUMNS.map((column) => (
                  <td key={column.key} className={index === 0 ? "border-t border-slate-300 p-0" : "p-0"}>
                    <div
                      title={emotion[column.key]}
                      className={emotion.isAggregate === "X" ? "truncate px-2 font-semibold" : "truncate px-2"}
                      style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px`, width: column.width }}
                    >
                      {column.key === "Basic Emotion" && emotion.isAggregate === "X"
                        ? "–"
                        : emotion[column.key]}
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  );
}
