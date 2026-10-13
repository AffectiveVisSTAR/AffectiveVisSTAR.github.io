import type { EmotionRow } from "@/lib/types";
import {
  LABEL_HEIGHT,
  ROW_HEIGHT,
  SUBGROUP_HEIGHT,
  TITLE_HEIGHT,
} from "../corpus/layout";

type EmotionColumnProps = {
  emotions: EmotionRow[];
};

// Keys select JSON fields; labels and widths control their presentation.
const EMOTION_COLUMNS = [
  { key: "name", label: "Affect", width: 200 },
  { key: "Basic Emotion", label: "Basic Emotion", width: 140 },
  { key: "Valence Category", label: "Valence Category", width: 140 },
] as const;

// Uses the same header bands and row height as the corpus panels.
export default function EmotionColumn({ emotions }: EmotionColumnProps) {
  return (
    <section className="sticky left-0 z-20 shrink-0 self-start overflow-clip rounded-md border border-neutral-300 bg-white">
      <table className="border-separate border-spacing-0 text-xs text-neutral-800">
        <caption className="sr-only">Emotion names and categories</caption>
        <colgroup>
          {EMOTION_COLUMNS.map((column) => (
            <col key={column.key} style={{ width: column.width }} />
          ))}
        </colgroup>
        <thead className="sticky top-0 z-10 bg-white">
          <tr>
            <th colSpan={3} className="bg-neutral-200 p-0 text-sm font-semibold text-neutral-900">
              <div className="flex items-center justify-center" style={{ height: TITLE_HEIGHT }}>
                Emotions
              </div>
            </th>
          </tr>
          <tr>
            <td colSpan={3} className="bg-neutral-100 p-0 text-center text-neutral-600">
              <div className="flex items-center justify-center" style={{ height: SUBGROUP_HEIGHT }}>
                {emotions.length} rows
              </div>
            </td>
          </tr>
          <tr>
            {EMOTION_COLUMNS.map((column) => (
              <th key={column.key} scope="col" className="border-b border-neutral-200 p-0 text-left">
                <div
                  className="flex items-end px-2 pb-1"
                  style={{ height: LABEL_HEIGHT, width: column.width }}
                >
                  {column.label}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {emotions.map((emotion) => (
            <tr key={emotion.name}>
              {EMOTION_COLUMNS.map((column) => (
                <td key={column.key} className="p-0">
                  <div
                    title={emotion[column.key]}
                    className="truncate px-2"
                    style={{ height: ROW_HEIGHT, lineHeight: `${ROW_HEIGHT}px`, width: column.width }}
                  >
                    {emotion[column.key]}
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
