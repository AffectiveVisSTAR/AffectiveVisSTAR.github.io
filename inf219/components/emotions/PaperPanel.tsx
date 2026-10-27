"use client";

import { useState } from "react";
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

// Dropdown filters shown above the paper list.
const FILTERS = [
  { field: "Journal", label: "Journal", allLabel: "All journals" },
  { field: "Country", label: "Country", allLabel: "All countries" },
  { field: "DomainApp", label: "Domain", allLabel: "All domains" },
] as const;

type FilterField = (typeof FILTERS)[number]["field"];

const ALL = "all";

// Split values like "Climate, Public Health" so each part becomes its own option.
function splitValues(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
}

// Side panel listing the papers behind the selected heatmap square.
// The parent gives the panel a new key for each cell, so the filters reset on a new selection.
export default function PaperPanel({ cell, metadata, onClose }: PaperPanelProps) {
  const [filters, setFilters] = useState<Record<FilterField, string>>({
    Journal: ALL,
    Country: ALL,
    DomainApp: ALL,
  });

  const papers = cell.authorYears.map((authorYear) => ({ authorYear, paper: metadata.get(authorYear) }));

  // Keep a paper if it matches every filter that is not set to "all".
  const visiblePapers = papers.filter(({ paper }) =>
    FILTERS.every(({ field }) =>
      filters[field] === ALL || splitValues(paper?.[field]).includes(filters[field]),
    ),
  );

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
      <p className="mb-3 text-neutral-500">
        {visiblePapers.length} of {papers.length} papers
      </p>

      <div className="mb-3 grid grid-cols-3 gap-2">
        {FILTERS.map(({ field, label, allLabel }) => {
          const options = [...new Set(papers.flatMap(({ paper }) => splitValues(paper?.[field])))].sort();

          return (
            <label key={field} className="flex flex-col gap-1 rounded-md border border-neutral-200 bg-slate-50 p-2 font-semibold">
              {label}
              <select
                className="w-full rounded border border-neutral-300 bg-white p-1 font-normal"
                value={filters[field]}
                onChange={(event) => setFilters((previous) => ({ ...previous, [field]: event.target.value }))}
              >
                <option value={ALL}>{allLabel}</option>
                {options.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        {visiblePapers.length === 0 && (
          <p className="text-neutral-500">No papers match the selected filters.</p>
        )}
        {visiblePapers.map(({ authorYear, paper }) => {
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
