"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/16/solid";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type FeatureFilter = "all" | "X" | "empty";
type CorpusRow = Record<string, string | null>;

type ResizeState = {
    columnId: string;
    startX: number;
    startWidth: number;
};

export type DataTableColumn = {
    dataKey: string;
    minWidth?: number;
    initialWidth?: number;
    filterType: "text" | "feature";
};

export type DataTableGroup = {
    name: string;
    color: string;
    columns: DataTableColumn[];
};

type ResolvedDataTableColumn = DataTableColumn & {
    id: string;
    label: string;
    groupName: string;
    groupColor: string;
    minWidth: number;
    initialWidth: number;
};

type DataTableProps = {
    groups: DataTableGroup[];
    dataUrl: string;
    title: string;
    debug?: boolean;
};

function normalizeValue(value: string | null): string {
    return (value?.toString() ?? "").trim().toLowerCase();
}

function hasYes(value: string | null): boolean {
    return normalizeValue(value) === "x";
}

function hasLow(value: string | null): boolean {
    return normalizeValue(value) === "low";
}

function matchesFeatureFilter(value: string | null, filter: FeatureFilter): boolean {
    const normalized = normalizeValue(value);
    if (filter === "all") {
        return true;
    }
    if (filter === "empty") {
        return normalized === "";
    }
    return normalized === filter;
}

function toColumnId(dataKey: string): string {
    return dataKey.replace(/\s+/g, "");
}

const DEFAULT_MIN_WIDTH = 22;
const DEFAULT_INITIAL_WIDTH = 22;
const MAX_COLUMN_LABEL_LENGTH = 30;

function truncateLabel(label: string, maxLength: number = MAX_COLUMN_LABEL_LENGTH): string {
    if (label.length <= maxLength) {
        return label;
    }
    return `${label.slice(0, maxLength - 3)}...`;
}

export default function Table({ groups, dataUrl, title, debug = false }: DataTableProps) {
    const tableWrapRef = useRef<HTMLDivElement | null>(null);
    const normalizedColumns = useMemo(() => {
        const seen = new Set<string>();
        return groups.reduce<ResolvedDataTableColumn[]>((acc, group) => {
            for (const column of group.columns) {
                const id = toColumnId(column.dataKey);
                if (!id || seen.has(id)) {
                    continue;
                }
                seen.add(id);
                acc.push({
                    ...column,
                    id,
                    label: column.dataKey,
                    groupName: group.name,
                    groupColor: group.color,
                    minWidth: column.minWidth ?? DEFAULT_MIN_WIDTH,
                    initialWidth: column.initialWidth ?? DEFAULT_INITIAL_WIDTH,
                });
            }
            return acc;
        }, []);
    }, [groups]);

    const columnsById = useMemo<Record<string, ResolvedDataTableColumn>>(
        () =>
            normalizedColumns.reduce<Record<string, ResolvedDataTableColumn>>((acc, column) => {
                acc[column.id] = column;
                return acc;
            }, {}),
        [normalizedColumns]
    );

    const guidingColumnId = normalizedColumns[0]?.id ?? "";

    const [rows, setRows] = useState<CorpusRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [sortRules, setSortRules] = useState<any[]>(
        guidingColumnId ? [{ columnId: guidingColumnId, direction: "asc" }] : []
    );
    const [columnOrder, setColumnOrder] = useState<string[]>(normalizedColumns.map((column) => column.id));
    const [draggedColumnId, setDraggedColumnId] = useState<string | null>(null);
    const [columnWidths, setColumnWidths] = useState<Record<string, number>>(() =>
        normalizedColumns.reduce<Record<string, number>>((acc, column) => {
            acc[column.id] = column.initialWidth;
            return acc;
        }, {})
    );
    const [resizeState, setResizeState] = useState<ResizeState | null>(null);
    const [tableWrapWidth, setTableWrapWidth] = useState(0);
    const [textFilters, setTextFilters] = useState<Record<string, string>>(() => {
        const initial: Record<string, string> = {};
        for (const column of normalizedColumns) {
            if (column.filterType === "text") {
                initial[column.id] = "";
            }
        }
        return initial;
    });
    const [featureFilters, setFeatureFilters] = useState<Record<string, FeatureFilter>>(() => {
        const initial: Record<string, FeatureFilter> = {};
        for (const column of normalizedColumns) {
            if (column.id !== guidingColumnId && column.filterType === "feature") {
                initial[column.id] = "all";
            }
        }
        return initial;
    });

    const getCellText = useCallback(
        (row: CorpusRow, columnId: string): string => {
            const definition = columnsById[columnId];
            if (!definition) {
                return "";
            }
            return row[definition.dataKey] ?? "";
        },
        [columnsById]
    );

    useEffect(() => {
        setColumnOrder(normalizedColumns.map((column) => column.id));
        setSortRules((prev) => {
            const validColumnIds = new Set(normalizedColumns.map((column) => column.id));
            const next = prev.filter((rule) => validColumnIds.has(rule.columnId));
            if (next.length === 0 && guidingColumnId) {
                return [{ columnId: guidingColumnId, direction: "asc" }];
            }
            return next;
        });
        setColumnWidths((prev) => {
            const next: Record<string, number> = {};
            for (const column of normalizedColumns) {
                next[column.id] = prev[column.id] ?? column.initialWidth;
            }
            return next;
        });
        setFeatureFilters((prev) => {
            const next: Record<string, FeatureFilter> = {};
            for (const column of normalizedColumns) {
                if (column.id !== guidingColumnId && column.filterType === "feature") {
                    next[column.id] = prev[column.id] ?? "all";
                }
            }
            return next;
        });
        setTextFilters((prev) => {
            const next: Record<string, string> = {};
            for (const column of normalizedColumns) {
                if (column.filterType === "text") {
                    next[column.id] = prev[column.id] ?? "";
                }
            }
            return next;
        });
    }, [normalizedColumns, guidingColumnId]);

    useEffect(() => {
        let isActive = true;

        async function loadData() {
            try {
                const res = await fetch(dataUrl, { cache: "no-store" });
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                const data = (await res.json()) as CorpusRow[];
                if (isActive) {
                    setRows(Array.isArray(data) ? data : []);
                    setError(null);
                }
            } catch (e) {
                if (isActive) {
                    const message = e instanceof Error ? e.message : "Unknown error while loading table data.";
                    setError(message);
                    setRows([]);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        setLoading(true);
        loadData();

        return () => {
            isActive = false;
        };
    }, [dataUrl]);

    useEffect(() => {
        const element = tableWrapRef.current;
        if (!element) {
            return;
        }

        const updateWidth = () => {
            setTableWrapWidth(element.clientWidth);
        };

        updateWidth();

        const observer = new ResizeObserver((entries) => {
            const width = entries[0]?.contentRect.width ?? element.clientWidth;
            setTableWrapWidth(width);
        });

        observer.observe(element);

        return () => {
            observer.disconnect();
        };
    }, []);

    useEffect(() => {
        if (!resizeState) {
            return;
        }

        const handleMouseMove = (event: MouseEvent) => {
            const definition = columnsById[resizeState.columnId];
            if (!definition) {
                return;
            }
            const delta = event.clientX - resizeState.startX;
            const nextWidth = Math.max(definition.minWidth, resizeState.startWidth + delta);
            setColumnWidths((prev) => ({
                ...prev,
                [resizeState.columnId]: nextWidth,
            }));
        };

        const handleMouseUp = () => {
            setResizeState(null);
        };

        window.addEventListener("mousemove", handleMouseMove);
        window.addEventListener("mouseup", handleMouseUp);
        return () => {
            window.removeEventListener("mousemove", handleMouseMove);
            window.removeEventListener("mouseup", handleMouseUp);
        };
    }, [resizeState, columnsById]);

    const rowCount = useMemo(() => rows.length, [rows]);

    const filteredRows = useMemo(() => {
        return rows.filter((row) => {
            for (const columnId of columnOrder) {
                const definition = columnsById[columnId];
                if (!definition) {
                    continue;
                }

                if (definition.filterType !== "text") {
                    continue;
                }

                const query = (textFilters[columnId]?.toString() ?? "").trim().toLowerCase();
                if (!query) {
                    continue;
                }

                const value = getCellText(row, columnId).toString().toLowerCase();
                if (!value.includes(query)) {
                    return false;
                }
            }

            for (const columnId of columnOrder) {
                const definition = columnsById[columnId];
                if (!definition || columnId === guidingColumnId || definition.filterType !== "feature") {
                    continue;
                }
                const filter = featureFilters[columnId] ?? "all";
                if (!matchesFeatureFilter(getCellText(row, columnId), filter)) {
                    return false;
                }
            }

            return true;
        });
    }, [rows, columnOrder, columnsById, featureFilters, textFilters, getCellText, guidingColumnId]);

    const sortedRows = useMemo(() => {
        if (sortRules.length === 0) {
            return filteredRows;
        }

        const sorted = [...filteredRows].sort((a, b) => {
            for (const rule of sortRules) {
                const aValue = normalizeValue(getCellText(a, rule.columnId));
                const bValue = normalizeValue(getCellText(b, rule.columnId));
                const comparison = aValue.localeCompare(bValue);
                if (comparison !== 0) {
                    return rule.direction === "asc" ? comparison : -comparison;
                }
            }
            return 0;
        });

        return sorted;
    }, [filteredRows, sortRules, getCellText]);

    const featureXCounts = useMemo(() => {
        const counts: Record<string, number> = {};

        for (const columnId of columnOrder) {
            const definition = columnsById[columnId];
            if (!definition || definition.filterType !== "feature") {
                continue;
            }
            counts[columnId] = 0;
        }

        for (const row of filteredRows) {
            for (const columnId of columnOrder) {
                const definition = columnsById[columnId];
                if (!definition || definition.filterType !== "feature") {
                    continue;
                }
                if (hasYes(getCellText(row, columnId))) {
                    counts[columnId] = (counts[columnId] ?? 0) + 1;
                }
            }
        }

        return counts;
    }, [columnOrder, columnsById, filteredRows, getCellText]);

    const groupedHeaderSegments = useMemo(() => {
        const segments: { label: string; span: number; color: string }[] = [];
        for (const columnId of columnOrder) {
            const definition = columnsById[columnId];
            if (!definition) {
                continue;
            }
            const last = segments[segments.length - 1];
            if (last && last.label === definition.groupName) {
                last.span += 1;
            } else {
                segments.push({ label: definition.groupName, span: 1, color: definition.groupColor });
            }
        }
        return segments;
    }, [columnOrder, columnsById]);

    const effectiveColumnWidths = useMemo<Record<string, number>>(() => {
        if (columnOrder.length === 0) {
            return {};
        }

        const baseWidths = columnOrder.map((columnId) => {
            const definition = columnsById[columnId];
            const width = columnWidths[columnId] ?? definition?.initialWidth ?? DEFAULT_INITIAL_WIDTH;
            const minWidth = definition?.minWidth ?? DEFAULT_MIN_WIDTH;
            return Math.max(width, minWidth);
        });

        const totalBaseWidth = baseWidths.reduce((sum, width) => sum + width, 0);
        const extraPerColumn =
            tableWrapWidth > totalBaseWidth ? (tableWrapWidth - totalBaseWidth) / columnOrder.length : 0;

        return columnOrder.reduce<Record<string, number>>((acc, columnId, index) => {
            acc[columnId] = baseWidths[index] + extraPerColumn;
            return acc;
        }, {});
    }, [columnOrder, columnsById, columnWidths, tableWrapWidth]);

    const renderLevelBox = (value: string | null, color: string) => {
        if (!hasYes(value) && !hasLow(value)) {
            return null;
        }

        return (
            <div
                className="level-box"
                style={{
                    width: 10,
                    height: 10,
                    borderRadius: 2,
                    backgroundColor: color,
                    opacity: hasLow(value) ? 0.35 : 1,
                    margin: "0 auto",
                }}
            />
        );
    };

    const isRowHighlighted = (row: CorpusRow, rowIndex: number) => {
        if (hoveredRow === rowIndex) {
            return true;
        }

        if (!hoveredColumnId || hoveredColumnId === guidingColumnId) {
            return false;
        }

        const hoveredDefinition = columnsById[hoveredColumnId];
        if (!hoveredDefinition || hoveredDefinition.filterType !== "feature") {
            return false;
        }

        const value = getCellText(row, hoveredColumnId);
        return hasYes(value) || hasLow(value);
    };

    const hasActiveHighlight =
        hoveredRow !== null ||
        (hoveredColumnId !== null &&
            hoveredColumnId !== guidingColumnId &&
            columnsById[hoveredColumnId]?.filterType === "feature");

    const handleSort = (columnId: string, additive: boolean) => {
        setSortRules((prev) => {
            const existingIndex = prev.findIndex((rule) => rule.columnId === columnId);

            if (!additive) {
                if (existingIndex === 0 && prev.length === 1) {
                    return [{ columnId, direction: prev[0].direction === "asc" ? "desc" : "asc" }];
                }
                const existingDirection = existingIndex >= 0 ? prev[existingIndex].direction : "asc";
                return [{ columnId, direction: existingDirection === "asc" ? "desc" : "asc" }];
            }

            if (existingIndex < 0) {
                return [...prev, { columnId, direction: "asc" }];
            }

            const existingRule = prev[existingIndex];
            if (existingRule.direction === "asc") {
                const next = [...prev];
                next[existingIndex] = { ...existingRule, direction: "desc" };
                return next;
            }

            const next = prev.filter((rule) => rule.columnId !== columnId);
            if (next.length === 0 && guidingColumnId) {
                return [{ columnId: guidingColumnId, direction: "asc" }];
            }
            return next;
        });
    };

    const moveColumn = (fromId: string, toId: string) => {
        if (fromId === toId) {
            return;
        }

        setColumnOrder((prev) => {
            const next = [...prev];
            const fromIndex = next.indexOf(fromId);
            const toIndex = next.indexOf(toId);
            if (fromIndex < 0 || toIndex < 0) {
                return prev;
            }

            const [moved] = next.splice(fromIndex, 1);
            next.splice(toIndex, 0, moved);
            return next;
        });
    };

    if (normalizedColumns.length === 0) {
        return (
            <div className="page">
                <div className="container">
                    <div className="error">No columns configured.</div>
                </div>
            </div>
        );
    }

    return (
        <div className="page">
            <div className="">
                <h1 className="title">{title}</h1>
                <p className="subtitle">
                    Showing {sortedRows.length} of {rowCount} entries from {dataUrl.replace(/^\//, "")}
                </p>

                {loading && <div className="status">Loading data...</div>}

                {!loading && error && <div className="error">{error}</div>}

                {!loading && !error && rowCount === 0 && (
                    <div className="status">
                        No rows loaded. Check that {dataUrl} is reachable and returns a JSON array.
                    </div>
                )}

                {debug && !loading && (
                    <pre className="debug">
                        {JSON.stringify(
                            {
                                dataUrl,
                                rowCount,
                                columns: normalizedColumns.map((col) => col.dataKey),
                                firstRowKeys: rows[0] ? Object.keys(rows[0]) : [],
                            },
                            null,
                            2
                        )}
                    </pre>
                )}

                {!loading && !error && rowCount > 0 && (
                    <div className="table-wrap" ref={tableWrapRef}>
                        <table className="dense-table">
                            <colgroup>
                                {columnOrder.map((columnId) => (
                                    <col key={columnId} style={{ width: `${effectiveColumnWidths[columnId] ?? 60}px` }} />
                                ))}
                            </colgroup>
                            <thead>
                                <tr className="group-row">
                                    {groupedHeaderSegments.map((segment, index) => (
                                        <th
                                            key={`${segment.label}-${segment.span}-${index}`}
                                            colSpan={segment.span}
                                            className="group-th"
                                            style={{ background: segment.color }}
                                        >
                                            <span className="group-label">{segment.label}</span>
                                        </th>
                                    ))}
                                </tr>
                                <tr>
                                    {columnOrder.map((columnId) => {
                                        const definition = columnsById[columnId];
                                        if (!definition) {
                                            return null;
                                        }

                                        return (
                                            <th
                                                key={columnId}
                                                draggable
                                                className={`w-full col col-${columnId} ${draggedColumnId === columnId ? "column-dragging" : ""}`}
                                                onMouseEnter={() => setHoveredColumnId(columnId)}
                                                onMouseLeave={() => setHoveredColumnId(null)}
                                                onClick={(event) => handleSort(columnId, event.shiftKey)}
                                                onDragStart={(event) => {
                                                    event.dataTransfer.effectAllowed = "move";
                                                    setDraggedColumnId(columnId);
                                                }}
                                                onDragOver={(event) => {
                                                    event.preventDefault();
                                                    event.dataTransfer.dropEffect = "move";
                                                }}
                                                onDrop={() => {
                                                    if (draggedColumnId) {
                                                        moveColumn(draggedColumnId, columnId);
                                                    }
                                                    setDraggedColumnId(null);
                                                }}
                                                onDragEnd={() => setDraggedColumnId(null)}
                                            >
                                                <div
                                                    className="resize-handle"
                                                    onMouseDown={(event) => {
                                                        event.preventDefault();
                                                        event.stopPropagation();
                                                        setResizeState({
                                                            columnId,
                                                            startX: event.clientX,
                                                            startWidth: columnWidths[columnId] ?? definition.initialWidth,
                                                        });
                                                    }}
                                                />
                                                <div className="flex flex-col gap-2 justify-center items-center">
                                                    {(() => {
                                                        const sortIndex = sortRules.findIndex((rule) => rule.columnId === columnId);
                                                        if (sortIndex < 0) {
                                                            return null;
                                                        }
                                                        const direction = sortRules[sortIndex].direction;
                                                        return (
                                                            <span className="sort-indicator">
                                                                {direction === "asc" ? (
                                                                    <ArrowUpIcon className="size-3" />
                                                                ) : (
                                                                    <ArrowDownIcon className="size-3" />
                                                                )}
                                                                <span className="sort-rank">{sortIndex + 1}</span>
                                                            </span>
                                                        );
                                                    })()}
                                                    <span className="vertical-label" title={definition.label}>
                                                        {truncateLabel(definition.label)}
                                                    </span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                                <tr className="filter-row">
                                    {columnOrder.map((columnId) => {
                                        const definition = columnsById[columnId];
                                        if (!definition) {
                                            return null;
                                        }

                                        return (
                                            <th key={`count-${columnId}`} className={`count-row-th col col-${columnId}`}>
                                                {definition.filterType === "feature" ? (
                                                    <span className="feature-count-label">{featureXCounts[columnId] ?? 0}</span>
                                                ) : null}
                                            </th>
                                        );
                                    })}
                                </tr>
                                <tr className="filter-row">
                                    {columnOrder.map((columnId) => {
                                        const definition = columnsById[columnId];
                                        if (!definition) {
                                            return null;
                                        }

                                        return (
                                            <th key={`filter-${columnId}`} className={`col col-${columnId}`}>
                                                {definition.filterType === "text" ? (
                                                    <input
                                                        className="filter-input"
                                                        type="text"
                                                        value={textFilters[columnId] ?? ""}
                                                        onChange={(event) =>
                                                            setTextFilters((prev) => ({
                                                                ...prev,
                                                                [columnId]: event.target.value,
                                                            }))
                                                        }
                                                        onClick={(event) => event.stopPropagation()}
                                                        placeholder="Filter"
                                                    />
                                                ) : definition.filterType === "feature" ? (
                                                    <select
                                                        className={`filter-select ${((featureFilters[columnId] ?? "all") !== "all") ? "filter-select-active" : ""}`}
                                                        value={featureFilters[columnId] ?? "all"}
                                                        onChange={(event) =>
                                                            setFeatureFilters((prev) => ({
                                                                ...prev,
                                                                [columnId]: event.target.value as FeatureFilter,
                                                            }))
                                                        }
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        <option value="all">All</option>
                                                        <option value="x">X</option>
                                                        <option value="empty">Empty</option>
                                                    </select>
                                                ) : null}
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className={hasActiveHighlight ? "highlight-mode" : ""}>
                                {sortedRows.map((row, index) => (
                                    <tr
                                        key={`${getCellText(row, guidingColumnId) || "row"}-${index}`}
                                        className={isRowHighlighted(row, index) ? "row-highlighted" : ""}
                                        onMouseEnter={() => setHoveredRow(index)}
                                        onMouseLeave={() => setHoveredRow(null)}
                                    >
                                        {columnOrder.map((columnId) => {
                                            const definition = columnsById[columnId];
                                            if (!definition) {
                                                return null;
                                            }
                                            const value = getCellText(row, columnId);

                                            return (
                                                <td key={`${columnId}-${index}`} className={`col col-${columnId}`}>
                                                    {columnId === guidingColumnId
                                                        ? value
                                                        : definition.filterType === "feature"
                                                            ? renderLevelBox(value, definition.groupColor)
                                                            : value}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 12px;
          background: #f5f7fa;
        }
        .container {
          width: 100%;
          margin: 0 auto;
        }
        .title {
          margin: 0 0 4px;
          font-size: 1.8rem;
          line-height: 1.2;
          font-weight: 700;
          color: #111827;
        }
        .subtitle {
          margin: 0 0 12px;
          color: #4b5563;
          font-size: 0.95rem;
        }
        .status {
          padding: 16px;
          text-align: center;
          color: #334155;
          background: #fff;
          border: 1px solid #e2e8f0;
        }
        .error {
          padding: 10px 12px;
          color: #991b1b;
          background: #fee2e2;
          border: 1px solid #fecaca;
          border-radius: 6px;
        }
        .table-wrap {
          --table-viewport-offset: 140px;
          width: 100%;
          background: #fff;
          max-height: max(320px, calc(100dvh - var(--table-viewport-offset)));
          overflow: auto;
          border: 1px solid #e2e8f0;
        }
        .dense-table {
          width: 100%;
          min-width: 100%;
          border-collapse: collapse;
        }
        .dense-table thead {
          position: sticky;
          top: 0;
          z-index: 4;
        }
        .group-row .group-th {
          height:24px;
          padding: 0px 4px;
          vertical-align: middle;
          text-align: center;
          background: #eef2ff;
          cursor: default;
        }
        .group-label {
          font-size: 0.60rem;
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          color: #334155;
        }
        .dense-table th {
          padding: 2px 4px;
          vertical-align: bottom;
          text-align: center;
          background: #f8fafc;
          cursor: grab;
          user-select: none;
          position: relative;
          z-index: 5;
        }
        .filter-row th {
          height: auto;
          padding: 2px 4px;
          background: #f9fafb;
          cursor: default;
        }
        .count-row-th {
          height: auto;
          padding: 2px 4px;
          background: #f8fafc;
          cursor: default;
        }
        .feature-count-label {
          display: inline-block;
          font-size: 0.60rem;
          font-weight: 700;
          color: #334155;
          line-height: 1;
        }
        .dense-table td {
          height: 16px;
          padding: 2px 4px;
          font-size: 0.75rem;
          line-height: 0.5rem;
        }
        .col {
          max-width: none;
          min-width: 10px;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .dense-table tbody tr:last-child td {
          border-bottom: none;
        }
        .vertical-label {
          display: inline-block;
          writing-mode: vertical-rl;
          transform: rotate(180deg);
          white-space: nowrap;
          font-weight: 550;
          line-height: 1.1;
          font-size: small;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sort-indicator {
          display: flex;
          align-items: center;
          gap: 2px;
        }
        .sort-rank {
          font-size: 0.65rem;
          font-weight: 700;
          line-height: 1;
        }
        .highlight-mode tr:not(.row-highlighted) td {
          opacity: 0.4;
        }
        .column-dragging {
          opacity: 0.6;
        }
        .filter-input,
        .filter-select {
          width: 100%;
          height: 22px;
          border: 1px solid #cbd5e1;
          background: #ffffff;
          border-radius: 3px;
          font-size: 0.72rem;
          color: #1f2937;
          padding: 0 6px;
        }
        .filter-select-active {
          background: #dbeafe;
          border-color: #93c5fd;
        }
        .filter-input:focus,
        .filter-select:focus {
          outline: 1px solid #3b82f6;
          border-color: #3b82f6;
        }
        .resize-handle {
          position: absolute;
          top: 0;
          right: -4px;
          width: 8px;
          height: 100%;
          cursor: col-resize;
          z-index: 2;
        }
        .resize-handle:hover {
          background: rgba(37, 99, 235, 0.2);
        }
      `}</style>
        </div>
    );
}
