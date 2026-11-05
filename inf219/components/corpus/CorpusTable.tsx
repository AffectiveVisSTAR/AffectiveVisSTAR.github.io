"use client";

import { useEffect, useState } from "react";
import { SUPER_GROUPS } from "@/lib/columns";
import { filterPapers, findPaperMetadata, loadPaperMetadata, loadPapers, nextSort, sortPapers } from "@/lib/data";
import type { Paper, PaperMetadata, SortState } from "@/lib/types";
import GroupPanel from "./GroupPanel";
import PaperColumn from "./PaperColumn";
import PaperDetailPanel from "./PaperDetailPanel";

// The whole Corpus table. Loads the data and places the panels side by side
// in one scroll container, so all panels scroll together.
export default function CorpusTable() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [metadata, setMetadata] = useState<PaperMetadata[]>([]);
  const [selectedPaper, setSelectedPaper] = useState<Paper | null>(null);
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    Promise.all([loadPapers(), loadPaperMetadata()])
      .then(([paperRows, metadataRows]) => {
        setPapers(paperRows);
        setMetadata(metadataRows);
      })
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-4 text-sm text-neutral-600">Loading...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-red-700">{error}</p>;
  }

  // Every panel gets the same filtered and sorted list, so the rows stay lined up.
  const visiblePapers = sortPapers(filterPapers(papers, query), sort);
  const selectedRowId = selectedPaper && selectedPaper.AuthorYear + selectedPaper["Paper Nickname"];

  return (
    <div className="flex size-full">
      <div className="min-w-0 flex-1 overflow-auto bg-neutral-100">
        <div className="flex w-max items-start gap-3 p-3">
          <PaperColumn
            papers={visiblePapers}
            hoveredRowId={hoveredRowId}
            onHoverRow={setHoveredRowId}
            selectedRowId={selectedRowId}
            onSelectPaper={setSelectedPaper}
            sort={sort}
            onSort={(key) => setSort(nextSort(sort, key))}
            query={query}
            onQueryChange={setQuery}
          />
          {SUPER_GROUPS.map((superGroup) => (
            <GroupPanel
              key={superGroup.id}
              superGroup={superGroup}
              papers={visiblePapers}
              hoveredRowId={hoveredRowId}
              onHoverRow={setHoveredRowId}
              hoveredColumnId={hoveredColumnId}
              onHoverColumn={setHoveredColumnId}
              selectedRowId={selectedRowId}
              onSelectPaper={setSelectedPaper}
              sort={sort}
              // Classification columns only toggle between "marked papers first" and no sorting.
              onSort={(key) => setSort(sort?.key === key ? null : { key, direction: "asc" })}
            />
          ))}
        </div>
      </div>
      {selectedPaper && (
        <PaperDetailPanel
          authorYear={selectedPaper.AuthorYear}
          metadata={findPaperMetadata(selectedPaper, metadata)}
          onClose={() => setSelectedPaper(null)}
        />
      )}
    </div>
  );
}
