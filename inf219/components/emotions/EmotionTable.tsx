"use client";

import { useEffect, useState } from "react";
import { loadEmotions } from "@/lib/emotion-data";
import type { EmotionRow, Paper } from "@/lib/types";
import { loadPapers } from "@/lib/data";
import EmotionColumn from "./EmotionColumn";
import EmotionGroupPanel from "./EmotionGroupPanel";
import { SUPER_GROUPS } from "@/lib/columns";
import { getVisibleEmotionGroups } from "@/lib/emotion-layout";

// Loads the emotion data and places its panels in one scroll container.
export default function EmotionTable() {
  // Keep both datasets together; papers will be used for unique article counts.
  const [tableData, setTableData] = useState<{
    emotions: EmotionRow[];
    papers: Paper[];
  }>({ emotions: [], papers: [] });
  const emotions = tableData.emotions;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const groups = getVisibleEmotionGroups(emotions, collapsedGroups);
  function toggleGroup(key: string) {
    setCollapsedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  useEffect(() => {
    let active = true;

    Promise.all([loadEmotions(), loadPapers()])
      .then(([emotionRows, paperRows]) => {
        if (active) {
          setTableData({ emotions: emotionRows, papers: paperRows });
        }
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Ignore a request that finishes after leaving the page.
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="p-4 text-sm text-neutral-600" role="status">Loading emotions...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-red-700" role="alert">{error}</p>;
  }

  return (
    <div className="size-full overflow-auto bg-neutral-100">
      <div className="flex w-max items-start gap-3 p-3">
        {emotions.length === 0 ? (
          <p className="p-4 text-sm text-neutral-600">No emotions found.</p>
        ) : (
          <>
            <EmotionColumn groups={groups} collapsedGroups={collapsedGroups} onToggleGroup={toggleGroup} />
            {SUPER_GROUPS.map((superGroup) => (
              <EmotionGroupPanel key={superGroup.id} superGroup={superGroup} groups={groups} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
