"use client";

import { useEffect, useState } from "react";
import { SUPER_GROUPS } from "@/lib/columns";
import { loadPapers, nextSort, sortPapers } from "@/lib/data";
import type { Paper, SortState } from "@/lib/types";
import GroupPanel from "./GroupPanel";
import PaperColumn from "./PaperColumn";

// The whole Corpus table. Loads the data and places the panels side by side
// in one scroll container, so all panels scroll together.
export default function CorpusTable() {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState>(null);

  useEffect(() => {
    loadPapers()
      .then(setPapers)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <p className="p-4 text-sm text-neutral-600">Loading...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-red-700">{error}</p>;
  }

  // Every panel gets the same sorted list, so the rows stay lined up.
  const sortedPapers = sortPapers(papers, sort);

  return (
    <div className="size-full overflow-auto bg-neutral-100">
      <div className="flex w-max items-start gap-3 p-3">
        <PaperColumn papers={sortedPapers} sort={sort} onSort={(key) => setSort(nextSort(sort, key))} />
        {SUPER_GROUPS.map((superGroup) => (
          <GroupPanel key={superGroup.id} superGroup={superGroup} papers={sortedPapers} />
        ))}
      </div>
    </div>
  );
}
