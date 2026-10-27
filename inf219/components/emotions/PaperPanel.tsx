import type { PaperMetadata } from "@/lib/types";

// The cell the user clicked: an emotion row in one classification column.
export type SelectedCell = {
  key: string;
  title: string;
  authorYears: string[];
};

type PaperPanelProps = {
  cell: SelectedCell;
  metadata: Map<string, PaperMetadata>;
  onClose: () => void;
};

// Side panel listing the papers behind the selected heatmap square.
export default function PaperPanel({ cell, metadata, onClose }: PaperPanelProps) {
  return (
    <aside
      className="w-96 shrink-0 overflow-y-auto border-l border-neutral-300 bg-white p-4 text-xs text-neutral-800"
      aria-label="Papers"
      aria-live="polite"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Papers</h2>
        <button
          type="button"
          className="rounded px-2 text-lg leading-none text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-blue-600"
          aria-label="Close papers panel"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <h3 className="mt-3 text-sm font-semibold">{cell.title}</h3>
      <p className="mb-3 text-neutral-500">{cell.authorYears.length} papers</p>

      <div className="flex flex-col gap-2">
        {cell.authorYears.map((authorYear) => {
          const paper = metadata.get(authorYear);
          const doi = paper?.DOI ?? "";
          const doiHref = doi.startsWith("http") ? doi : `https://doi.org/${doi}`;

          return (
            <article key={authorYear} className="flex flex-col gap-1 rounded-md border border-neutral-200 p-2">
              <p>
                <strong>{authorYear}.</strong>{" "}
                {paper?.Title ? `${paper.Title}.` : "Metadata not found."}
              </p>
              {paper && (
                <>
                  <p className="text-neutral-500">
                    Journal: {paper.Journal || "Unknown"}. Country: {paper.Country || "Unknown"}. Domain: {paper.DomainApp || "Unknown"}.
                  </p>
                  {paper.Abstract && (
                    <details>
                      <summary className="cursor-pointer font-semibold">Abstract</summary>
                      <p className="mt-1">{paper.Abstract}</p>
                    </details>
                  )}
                  {doi && (
                    <p className="text-neutral-500">
                      DOI:{" "}
                      <a href={doiHref} target="_blank" rel="noreferrer" className="text-blue-600 underline">
                        {doi}
                      </a>
                    </p>
                  )}
                </>
              )}
            </article>
          );
        })}
      </div>
    </aside>
  );
}
