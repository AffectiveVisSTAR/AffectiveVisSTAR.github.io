import { isMarked } from "@/lib/data";
import type { Paper, SuperGroup } from "@/lib/types";
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
};

// One colored panel: a header with panel name, subgroups and rotated column names,
// and below it one row of squares per paper.
export default function GroupPanel({ superGroup, papers }: GroupPanelProps) {
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

      <div className="px-1">
        {papers.map((paper) => (
          <div
            key={paper.AuthorYear + paper["Paper Nickname"]}
            className="flex"
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
