import { countMarked, isFaded, isMarked } from "@/lib/data";
import type { Paper, SortState, SuperGroup } from "@/lib/types";
import Cell from "./Cell";
import {
  COLUMN_WIDTH,
  GROUP_GAP,
  LABEL_HEIGHT,
  ROW_HEIGHT,
  SUBGROUP_HEIGHT,
  TITLE_HEIGHT,
  tint,
} from "./layout";

type GroupPanelProps = {
  superGroup: SuperGroup;
  papers: Paper[];
  sort: SortState;
  onSort: (key: string) => void;
};

// One colored panel: a header with panel name, subgroups and rotated column names,
// and below it one row of squares per paper.
// Clicking a column name puts the papers marked in that column at the top.
export default function GroupPanel({ superGroup, papers, sort, onSort }: GroupPanelProps) {
  const { label, color, groups } = superGroup;

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
              {group.columns.map((column) => {
                const articleCount = countMarked(papers, column);

                return (
                  <button
                    key={column}
                    type="button"
                    onClick={() => onSort(column)}
                    className={`relative flex h-full shrink-0 cursor-pointer items-end justify-center py-1 ${
                      sort?.key === column ? "bg-neutral-200" : ""
                    }`}
                    style={{ width: COLUMN_WIDTH }}
                  >
                    {sort?.key === column && (
                      <span className="absolute top-1 text-sm font-bold text-black">
                        ▼
                      </span>
                    )}
                    <span
                      title={`${articleCount} articles`}
                      aria-label={`${column}: ${articleCount} articles`}
                      className="absolute inset-x-0 bottom-1 text-center text-[9px] font-medium tabular-nums text-neutral-600"
                    >
                      {articleCount}
                    </span>
                    <span
                      title={column}
                      className="absolute bottom-5 overflow-hidden text-ellipsis whitespace-nowrap text-[11px] text-neutral-800 [writing-mode:vertical-rl] rotate-180"
                      style={{ maxHeight: LABEL_HEIGHT - 44 }}
                    >
                      {column}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </header>

      <div className="px-1">
        {papers.map((paper) => (
          <div
            key={paper.AuthorYear + paper["Paper Nickname"]}
            className={isFaded(paper, sort) ? "flex opacity-40" : "flex"}
            style={{ gap: GROUP_GAP, height: ROW_HEIGHT }}
          >
            {groups.map((group) => (
              <div key={group.id} className="flex">
                {group.columns.map((column) => (
                  <Cell key={column} marked={isMarked(paper, column)} color={group.color} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
