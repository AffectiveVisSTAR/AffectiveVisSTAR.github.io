"use client";

import { useEffect, useMemo, useState } from "react";
import { loadEmotions } from "@/lib/emotion-data";
import type { EmotionRow, Paper, PaperMetadata } from "@/lib/types";
import { loadPaperMetadata, loadPapers } from "@/lib/data";
import EmotionColumn from "./EmotionColumn";
import EmotionGroupPanel from "./EmotionGroupPanel";
import PaperPanel, { type SelectedCell } from "./PaperPanel";
import { SUPER_GROUPS } from "@/lib/columns";
import { groupKey, getVisibleEmotionGroups } from "@/lib/emotion-layout";

// Loads the emotion data and places its panels in one scroll container.
export default function EmotionTable() {
  // Keep both datasets together; papers will be used for unique article counts.
  const [tableData, setTableData] = useState<{
    emotions: EmotionRow[];
    papers: Paper[];
    metadata: PaperMetadata[];
  }>({ emotions: [], papers: [], metadata: [] });
  const emotions = tableData.emotions;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set());
  const [hoveredRowId, setHoveredRowId] = useState<string | null>(null);
  const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
  const groups = useMemo(
    () => getVisibleEmotionGroups(emotions, collapsedGroups),
    [emotions, collapsedGroups],
  );
  const collapsibleGroupKeys = groups.flatMap(({ category, rows }) =>
    rows.filter((row) => row.isGroup).map((row) => groupKey(category, row.groupId!)),
  );
  const canCollapseAll = collapsibleGroupKeys.some((key) => !collapsedGroups.has(key));
  const canExpandAll = collapsibleGroupKeys.some((key) => collapsedGroups.has(key));

  function setAllGroupsCollapsed(collapsed: boolean) {
    setHoveredRowId(null);
    setHoveredColumnId(null);
    setCollapsedGroups(collapsed ? new Set(collapsibleGroupKeys) : new Set());
  }

  function toggleGroup(key: string) {
    setHoveredRowId(null);
    setHoveredColumnId(null);
    setCollapsedGroups((previous) => {
      const next = new Set(previous);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  useEffect(() => {
    let active = true;

    Promise.all([loadEmotions(), loadPapers(), loadPaperMetadata()])
      .then(([emotionRows, paperRows, metadataRows]) => {
        if (active) {
          setTableData({ emotions: emotionRows, papers: paperRows, metadata: metadataRows });
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
    <div className="flex size-full">
      <div className="min-w-0 flex-1 overflow-auto bg-neutral-100">
        <div className="flex w-max items-start gap-3 p-3">
          {emotions.length === 0 ? (
            <p className="p-4 text-sm text-neutral-600">No emotions found.</p>
          ) : (
            <>
              <EmotionColumn
                groups={groups}
                collapsedGroups={collapsedGroups}
                onToggleGroup={toggleGroup}
                onCollapseAll={() => setAllGroupsCollapsed(true)}
                onExpandAll={() => setAllGroupsCollapsed(false)}
                canCollapseAll={canCollapseAll}
                canExpandAll={canExpandAll}
                hoveredRowId={hoveredRowId}
                onHoverRow={setHoveredRowId}
              />
              {SUPER_GROUPS.map((superGroup) => (
                <EmotionGroupPanel
                  key={superGroup.id}
                  superGroup={superGroup}
                  groups={groups}
                  papers={tableData.papers}
                  hoveredRowId={hoveredRowId}
                  onHoverRow={setHoveredRowId}
                  hoveredColumnId={hoveredColumnId}
                  onHoverColumn={setHoveredColumnId}
                  selectedKey={selectedCell?.key ?? null}
                  onSelectCell={setSelectedCell}
                />
              ))}
            </>
          )}
        </div>
      </div>
      {selectedCell && (
        <PaperPanel key={selectedCell.key} cell={selectedCell} metadata={tableData.metadata} onClose={() => setSelectedCell(null)} />
      )}
    </div>
  );
}
