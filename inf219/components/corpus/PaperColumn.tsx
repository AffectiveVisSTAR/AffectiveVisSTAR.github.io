import { METADATA_COLUMNS } from "@/lib/columns";
import type { Paper } from "@/lib/types";
import { LABEL_HEIGHT, PAPER_COLUMN_WIDTHS, ROW_HEIGHT, SUBGROUP_HEIGHT, TITLE_HEIGHT } from "./layout";

type PaperColumnProps = {
  papers: Paper[];
};

// Left panel with author, year and nickname. It stays in place when scrolling sideways.
export default function PaperColumn({ papers }: PaperColumnProps) {
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
            <div
              key={key}
              className="px-2 pb-1 text-xs font-semibold text-neutral-800"
              style={{ width: PAPER_COLUMN_WIDTHS[key] }}
            >
              {label}
            </div>
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
