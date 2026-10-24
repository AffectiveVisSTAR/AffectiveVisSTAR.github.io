import { METADATA_COLUMNS } from "@/lib/columns";
import type { MetadataKey, Paper, SortState } from "@/lib/types";
import { LABEL_HEIGHT, PAPER_COLUMN_WIDTHS, ROW_HEIGHT, SUBGROUP_HEIGHT, TITLE_HEIGHT } from "./layout";

type PaperColumnProps = {
  papers: Paper[];
  sort: SortState;
  onSort: (key: MetadataKey) => void;
};

// Left panel with author, year and nickname. It stays in place when scrolling sideways.
// Clicking a column name sorts the table by that column.
export default function PaperColumn({ papers, sort, onSort }: PaperColumnProps) {
  return (
    <section className="sticky left-0 z-20 shrink-0 rounded-md border border-neutral-300 bg-white">
      <header className="sticky top-0 z-10 rounded-t-md bg-white">
        <div
          className="flex items-center justify-center rounded-t-md bg-neutral-200 text-sm font-semibold text-neutral-900"
          style={{ height: TITLE_HEIGHT }}
        >
          Papers
        </div>

        <div
          className="flex items-center justify-center bg-neutral-100 text-xs text-neutral-600"
          style={{ height: SUBGROUP_HEIGHT }}
        >
          {papers.length} papers
        </div>

        <div className="flex items-end border-b border-neutral-200" style={{ height: LABEL_HEIGHT }}>
          {METADATA_COLUMNS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onSort(key)}
              className="flex cursor-pointer items-center gap-1 px-2 pb-1 text-xs font-semibold text-neutral-800"
              style={{ width: PAPER_COLUMN_WIDTHS[key] }}
            >
              {label}
              <span className="text-sm font-bold text-black">
                {sort?.key !== key ? "⇅" : sort.direction === "asc" ? "▲" : "▼"}
              </span>
            </button>
          ))}
        </div>
      </header>

      <div>
        {papers.map((paper) => (
          <div
            key={paper.AuthorYear + paper["Paper Nickname"]}
            className="flex items-center text-xs text-neutral-800"
            style={{ height: ROW_HEIGHT }}
          >
            {METADATA_COLUMNS.map(({ key }) => (
              <div
                key={key}
                title={String(paper[key] ?? "")}
                className="truncate px-2"
                style={{ width: PAPER_COLUMN_WIDTHS[key] }}
              >
                {paper[key]}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
