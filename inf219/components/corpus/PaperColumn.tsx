import { METADATA_COLUMNS } from "@/lib/columns";
import { isFaded } from "@/lib/data";
import type { MetadataKey, Paper, SortState } from "@/lib/types";
import {
  LABEL_HEIGHT,
  PAPER_COLUMN_WIDTHS,
  ROW_HEIGHT,
  SEARCH_HEIGHT,
  SUBGROUP_HEIGHT,
  TITLE_HEIGHT,
} from "./layout";

type PaperColumnProps = {
  papers: Paper[];
  hoveredRowId: string | null;
  onHoverRow: (rowId: string | null) => void;
  selectedRowId: string | null;
  onSelectPaper: (paper: Paper) => void;
  sort: SortState;
  onSort: (key: MetadataKey) => void;
  query: string;
  onQueryChange: (query: string) => void;
};

// Left panel with author, year and nickname. It stays in place when scrolling sideways.
// Clicking a column name sorts the table by that column.
// The search field below the column names filters the papers on author, year and nickname.
// Clicking a row opens that paper in the side panel.
export default function PaperColumn({
  papers,
  hoveredRowId,
  onHoverRow,
  selectedRowId,
  onSelectPaper,
  sort,
  onSort,
  query,
  onQueryChange,
}: PaperColumnProps) {
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

        {/* Same height as the label band in the other panels, so the rows stay lined up. */}
        <div className="flex flex-col justify-end border-b border-neutral-200" style={{ height: LABEL_HEIGHT }}>
          <div className="flex items-end">
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

          <label className="flex items-center gap-1 border-t border-neutral-200 bg-neutral-100 px-2" style={{ height: SEARCH_HEIGHT }}>
            <svg aria-hidden="true" viewBox="0 0 16 16" className="size-3 shrink-0 text-neutral-500" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="7" cy="7" r="5" />
              <path d="M11 11l4 4" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              placeholder="Search"
              aria-label="Search papers by author, year or nickname"
              className="w-full bg-transparent text-xs text-neutral-800 outline-none placeholder:text-neutral-500"
            />
          </label>
        </div>
      </header>

      <div>
        {papers.length === 0 && (
          <div className="flex items-center px-2 text-xs text-neutral-500" style={{ height: ROW_HEIGHT }}>
            No papers match
          </div>
        )}
        {papers.map((paper) => (
          <button
            key={paper.AuthorYear + paper["Paper Nickname"]}
            type="button"
            className={`flex cursor-pointer items-center text-left text-xs text-neutral-800 focus-visible:outline-2 focus-visible:outline-blue-600 ${
              selectedRowId === paper.AuthorYear + paper["Paper Nickname"] ? "bg-neutral-200" : ""
            }`}
            onClick={() => onSelectPaper(paper)}
            onMouseEnter={() => onHoverRow(paper.AuthorYear + paper["Paper Nickname"])}
            onMouseLeave={() => onHoverRow(null)}
            style={{
              height: ROW_HEIGHT,
              fontWeight: hoveredRowId === paper.AuthorYear + paper["Paper Nickname"] ? 700 : undefined,
              // Papers not marked in the sorted column stay faded; other rows fade while hovering.
              opacity: isFaded(paper, sort)
                ? 0.4
                : hoveredRowId !== null && hoveredRowId !== paper.AuthorYear + paper["Paper Nickname"] ? 0.6 : 1,
            }}
          >
            {METADATA_COLUMNS.map(({ key }) => (
              <span
                key={key}
                title={String(paper[key] ?? "")}
                className="truncate px-2"
                style={{ width: PAPER_COLUMN_WIDTHS[key] }}
              >
                {paper[key]}
              </span>
            ))}
          </button>
        ))}
      </div>
    </section>
  );
}
