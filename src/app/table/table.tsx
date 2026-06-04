"use client";

import { ArrowDownIcon, ArrowUpIcon } from "@heroicons/react/16/solid";
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from "react";

type FeatureFilter = "all" | "X" | "empty";
type CorpusRow = Record<string, unknown>;
type SortDirection = "asc" | "desc";
type SortRule = { columnId: string; direction: SortDirection };
export type DataTableInitialSortRule = { dataKey: string; direction: SortDirection };

type ResizeState = {
    columnId: string;
    startX: number;
    startWidth: number;
};

export type DataTableColumn = {
    dataKey: string;
    label?: string;
    getValue?: (row: CorpusRow) => string;
    minWidth?: number;
    initialWidth?: number;
    filterType: "text" | "feature" | "numeric-heatmap";
};

export type DataTableGroup = {
    name: string;
    color: string;
    superGroupName?: string;
    superGroupColor?: string;
    columns: DataTableColumn[];
};

type ResolvedDataTableColumn = DataTableColumn & {
    id: string;
    label: string;
    hasExplicitSuperGroup: boolean;
    superGroupName: string;
    superGroupColor: string;
    groupName: string;
    groupColor: string;
    minWidth: number;
    initialWidth: number;
};

type DataTableProps = {
    groups: DataTableGroup[];
    dataUrl: string;
    title?: string;
    footer?: ReactNode;
    debug?: boolean;
    initialSortRules?: DataTableInitialSortRule[];
    getCellTooltip?: (row: CorpusRow, columnId: string) => string | null;
    onCellClick?: (row: CorpusRow, columnId: string, tooltip: string | null) => void;
    disableHoverFade?: boolean;
    aggregateRowsAsHeaders?: boolean;
    aggregateRowsByColumn?: string;
    hideTopLevelAggregateRows?: boolean;
    rowGroupByColumn?: string;
    rowGroupColumnLabel?: string;
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

function parseNumericValue(value: string | null): number | null {
    if (value === null) {
        return null;
    }
    const normalized = value.toString().trim().replace(",", ".");
    if (normalized.length === 0) {
        return null;
    }
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : null;
}

function isAggregateRow(row: CorpusRow): boolean {
    return normalizeValue(row.isAggregate === null || row.isAggregate === undefined ? null : String(row.isAggregate)) === "x";
}

function getValenceAffectLabel(value: string): string | null {
    const normalized = normalizeValue(value);
    if (normalized === "positive") {
        return "Positive Affect";
    }
    if (normalized === "negative") {
        return "Negative Affect";
    }
    if (normalized === "neutral") {
        return "Neutral Affect";
    }
    return null;
}

function stripAggregateLabel(value: string): string {
    return value.replace(/\s*\(Aggregate\)\s*$/i, "").trim();
}

function getRowGroupLabel(value: string): string {
    return normalizeValue(value) === "main" ? "General" : value;
}

const DEFAULT_MIN_WIDTH = 22;
const DEFAULT_INITIAL_WIDTH = 22;
const MAX_COLUMN_LABEL_LENGTH = 30;
const SCROLLBAR_GUTTER_PX = 16;
const MIN_UNIQUE_EMOTIONS_FOR_AGGREGATE = 3;
const ROW_GROUP_COLUMN_WIDTH = 72;

function truncateLabel(label: string, maxLength: number = MAX_COLUMN_LABEL_LENGTH): string {
    if (label.length <= maxLength) {
        return label;
    }
    return `${label.slice(0, maxLength - 3)}...`;
}

export default function Table({
    groups,
    dataUrl,
    title,
    footer,
    debug = false,
    initialSortRules,
    getCellTooltip,
    onCellClick,
    disableHoverFade = false,
    aggregateRowsAsHeaders = false,
    aggregateRowsByColumn,
    hideTopLevelAggregateRows = false,
    rowGroupByColumn,
    rowGroupColumnLabel,
}: DataTableProps) {
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
                    label: column.label ?? column.dataKey,
                    hasExplicitSuperGroup: Boolean(group.superGroupName),
                    superGroupName: group.superGroupName ?? group.name,
                    superGroupColor: group.superGroupColor ?? group.color,
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
    const resolvedInitialSortRules = useMemo<SortRule[]>(() => {
        if (!initialSortRules || initialSortRules.length === 0) {
            return guidingColumnId ? [{ columnId: guidingColumnId, direction: "asc" }] : [];
        }

        return initialSortRules
            .map((rule) => ({
                columnId: toColumnId(rule.dataKey),
                direction: rule.direction,
            }))
            .filter((rule) => Boolean(columnsById[rule.columnId]));
    }, [columnsById, guidingColumnId, initialSortRules]);

    const [rows, setRows] = useState<CorpusRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredColumnId, setHoveredColumnId] = useState<string | null>(null);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [expandedAggregateRows, setExpandedAggregateRows] = useState<Set<string>>(() => new Set());
    const [sortRules, setSortRules] = useState<SortRule[]>(resolvedInitialSortRules);
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
            if (definition.getValue) {
                return definition.getValue(row);
            }
            const value = row[definition.dataKey];
            return value === null || value === undefined ? "" : String(value);
        },
        [columnsById]
    );

    const getRawCellText = useCallback((row: CorpusRow, dataKey: string): string => {
        const value = row[dataKey];
        return value === null || value === undefined ? "" : String(value);
    }, []);

    useEffect(() => {
        setColumnOrder(normalizedColumns.map((column) => column.id));
        setSortRules((prev) => {
            const validColumnIds = new Set(normalizedColumns.map((column) => column.id));
            const next = prev.filter((rule) => validColumnIds.has(rule.columnId));
            if (next.length === 0 && guidingColumnId) {
                return resolvedInitialSortRules.length > 0
                    ? resolvedInitialSortRules
                    : [{ columnId: guidingColumnId, direction: "asc" }];
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
    }, [normalizedColumns, guidingColumnId, resolvedInitialSortRules]);

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

    const sortTableRows = useCallback((rowsToSort: CorpusRow[]) => {
        if (sortRules.length === 0) {
            return rowsToSort;
        }

        return [...rowsToSort].sort((a, b) => {
            for (const rule of sortRules) {
                const definition = columnsById[rule.columnId];
                if (!definition) {
                    continue;
                }

                let comparison = 0;
                if (definition.filterType === "numeric-heatmap") {
                    const aValue = parseNumericValue(getCellText(a, rule.columnId));
                    const bValue = parseNumericValue(getCellText(b, rule.columnId));
                    if (aValue === null && bValue === null) {
                        comparison = 0;
                    } else if (aValue === null) {
                        comparison = 1;
                    } else if (bValue === null) {
                        comparison = -1;
                    } else {
                        comparison = aValue - bValue;
                    }
                } else {
                    const aValue = normalizeValue(getCellText(a, rule.columnId));
                    const bValue = normalizeValue(getCellText(b, rule.columnId));
                    comparison = aValue.localeCompare(bValue);
                }

                if (comparison !== 0) {
                    return rule.direction === "asc" ? comparison : -comparison;
                }

                if (definition.dataKey === "Valence Category") {
                    const aIsAggregate = isAggregateRow(a);
                    const bIsAggregate = isAggregateRow(b);
                    if (aIsAggregate !== bIsAggregate) {
                        return aIsAggregate ? -1 : 1;
                    }
                }
            }
            return 0;
        });
    }, [sortRules, getCellText, columnsById]);

    const sortedRows = useMemo(() => sortTableRows(filteredRows), [filteredRows, sortTableRows]);
    const aggregateRowsByColumnId = aggregateRowsByColumn ? toColumnId(aggregateRowsByColumn) : null;

    const { visibleRows, expandableAggregateKeys } = useMemo(() => {
        if (!aggregateRowsAsHeaders) {
            return {
                visibleRows: sortedRows.map((row, index) => ({
                    row,
                    sourceIndex: index,
                    isAggregateHeader: false,
                    aggregateKey: null,
                })),
                expandableAggregateKeys: [],
            };
        }

        if (aggregateRowsByColumnId && !rows.some(isAggregateRow)) {
            const groupByDefinition = columnsById[aggregateRowsByColumnId];
            if (!groupByDefinition) {
                return {
                    visibleRows: sortedRows.map((row, index) => ({
                        row,
                        sourceIndex: index,
                        isAggregateHeader: false,
                        aggregateKey: null,
                    })),
                    expandableAggregateKeys: [],
                };
            }

            const groupsByValue = new Map<string, { label: string; detailRows: { row: CorpusRow; sourceIndex: number }[] }>();
            rows.forEach((row, index) => {
                if (isAggregateRow(row)) {
                    return;
                }

                const label = getCellText(row, aggregateRowsByColumnId).trim();
                if (!label) {
                    return;
                }

                const normalizedLabel = normalizeValue(label);
                const group = groupsByValue.get(normalizedLabel) ?? { label, detailRows: [] };
                group.detailRows.push({ row, sourceIndex: index });
                groupsByValue.set(normalizedLabel, group);
            });

            const filteredRowSet = new Set(filteredRows);
            const aggregateGroups = Array.from(groupsByValue.entries()).map(([normalizedLabel, group], groupIndex) => {
                const filteredDetailRows = group.detailRows.filter(({ row }) => filteredRowSet.has(row));
                const aggregateRow: CorpusRow = {
                    isAggregate: "X",
                    [columnsById[guidingColumnId]?.dataKey ?? guidingColumnId]: group.label,
                    [groupByDefinition.dataKey]: group.label,
                    childEmotions: group.detailRows
                        .map(({ row }) => getCellText(row, guidingColumnId).trim())
                        .filter(Boolean),
                    publications: Array.from(new Set(
                        group.detailRows.flatMap(({ row }) => {
                            const publications = row.publications;
                            return Array.isArray(publications)
                                ? publications.filter((publication): publication is string => typeof publication === "string")
                                : [];
                        })
                    )),
                };

                for (const column of normalizedColumns) {
                    if (column.filterType !== "numeric-heatmap") {
                        continue;
                    }

                    const total = group.detailRows.reduce((sum, { row }) => {
                        const value = parseNumericValue(getCellText(row, column.id));
                        return value === null ? sum : sum + value;
                    }, 0);
                    aggregateRow[column.dataKey] = total;
                }

                return {
                    aggregateRow,
                    aggregateKey: `${aggregateRowsByColumnId}-${normalizedLabel}`,
                    aggregateSourceIndex: -groupIndex - 1,
                    filteredDetailRows,
                };
            }).filter((group) => group.filteredDetailRows.length > 0);

            const nextRows: {
                row: CorpusRow;
                sourceIndex: number;
                isAggregateHeader: boolean;
                aggregateKey: string | null;
            }[] = [];
            const expandableKeys = aggregateGroups.map(({ aggregateKey }) => aggregateKey);

            for (const group of sortTableRows(aggregateGroups.map(({ aggregateRow }) => aggregateRow))) {
                const aggregateGroup = aggregateGroups.find(({ aggregateRow }) => aggregateRow === group);
                if (!aggregateGroup) {
                    continue;
                }

                nextRows.push({
                    row: aggregateGroup.aggregateRow,
                    sourceIndex: aggregateGroup.aggregateSourceIndex,
                    isAggregateHeader: true,
                    aggregateKey: aggregateGroup.aggregateKey,
                });

                if (expandedAggregateRows.has(aggregateGroup.aggregateKey)) {
                    const detailSourceIndexByRow = new Map(
                        aggregateGroup.filteredDetailRows.map(({ row, sourceIndex }) => [row, sourceIndex])
                    );
                    for (const row of sortTableRows(aggregateGroup.filteredDetailRows.map(({ row }) => row))) {
                        nextRows.push({
                            row,
                            sourceIndex: detailSourceIndexByRow.get(row) ?? nextRows.length,
                            isAggregateHeader: false,
                            aggregateKey: aggregateGroup.aggregateKey,
                        });
                    }
                }
            }

            return { visibleRows: nextRows, expandableAggregateKeys: expandableKeys };
        }

        const filteredRowSet = new Set(filteredRows);
        const groupByDefinition = aggregateRowsByColumnId ? columnsById[aggregateRowsByColumnId] : undefined;
        const aggregateGroups: {
            aggregateRow: CorpusRow;
            aggregateSourceIndex: number;
            aggregateKey: string;
            detailRows: { row: CorpusRow; sourceIndex: number }[];
        }[] = [];
        const standaloneRows: { row: CorpusRow; sourceIndex: number }[] = [];
        let currentGroup: (typeof aggregateGroups)[number] | null = null;

        rows.forEach((row, index) => {
            if (isAggregateRow(row)) {
                currentGroup = {
                    aggregateRow: row,
                    aggregateSourceIndex: index,
                    aggregateKey: `${getCellText(row, guidingColumnId) || "aggregate"}-${index}`,
                    detailRows: [],
                };
                aggregateGroups.push(currentGroup);
                return;
            }

            if (currentGroup) {
                currentGroup.detailRows.push({ row, sourceIndex: index });
                return;
            }

            standaloneRows.push({ row, sourceIndex: index });
        });

        const nextRows: {
            row: CorpusRow;
            sourceIndex: number;
            isAggregateHeader: boolean;
            aggregateKey: string | null;
        }[] = [];
        const expandableKeys: string[] = [];

        for (const group of aggregateGroups) {
            const filteredDetailRows = group.detailRows.filter(({ row }) => filteredRowSet.has(row));
            const shouldShowAggregate = filteredRowSet.has(group.aggregateRow) || filteredDetailRows.length > 0;
            if (!shouldShowAggregate) {
                continue;
            }

            if (!hideTopLevelAggregateRows) {
                nextRows.push({
                    row: group.aggregateRow,
                    sourceIndex: group.aggregateSourceIndex,
                    isAggregateHeader: true,
                    aggregateKey: group.aggregateKey,
                });
            }
            expandableKeys.push(group.aggregateKey);

            const detailGroups = aggregateRowsByColumnId && groupByDefinition
                ? Array.from(
                    filteredDetailRows.reduce<
                        Map<string, { label: string; detailRows: { row: CorpusRow; sourceIndex: number }[] }>
                    >((detailRowsByGroup, detailRow) => {
                        const label = getCellText(detailRow.row, aggregateRowsByColumnId).trim();
                        if (!label || normalizeValue(label) === "aggregate") {
                            return detailRowsByGroup;
                        }

                        const normalizedLabel = normalizeValue(label);
                        const detailGroup = detailRowsByGroup.get(normalizedLabel) ?? { label, detailRows: [] };
                        detailGroup.detailRows.push(detailRow);
                        detailRowsByGroup.set(normalizedLabel, detailGroup);
                        return detailRowsByGroup;
                    }, new Map()).entries()
                ).map(([normalizedLabel, detailGroup], detailGroupIndex) => {
                    const aggregateRow: CorpusRow = {
                        isAggregate: "X",
                        [columnsById[guidingColumnId]?.dataKey ?? guidingColumnId]: detailGroup.label,
                        [groupByDefinition.dataKey]: detailGroup.label,
                        "Valence Category": getRawCellText(group.aggregateRow, "Valence Category"),
                        childEmotions: detailGroup.detailRows
                            .map(({ row }) => getCellText(row, guidingColumnId).trim())
                            .filter(Boolean),
                        publications: Array.from(new Set(
                            detailGroup.detailRows.flatMap(({ row }) => {
                                const publications = row.publications;
                                return Array.isArray(publications)
                                    ? publications.filter((publication): publication is string => typeof publication === "string")
                                    : [];
                            })
                        )),
                    };

                    for (const column of normalizedColumns) {
                        if (column.filterType !== "numeric-heatmap") {
                            continue;
                        }

                        const total = detailGroup.detailRows.reduce((sum, { row }) => {
                            const value = parseNumericValue(getCellText(row, column.id));
                            return value === null ? sum : sum + value;
                        }, 0);
                        aggregateRow[column.dataKey] = total;
                    }

                    return {
                        aggregateRow,
                        aggregateKey: `${group.aggregateKey}-${aggregateRowsByColumnId}-${normalizedLabel}`,
                        aggregateSourceIndex: -(group.aggregateSourceIndex + 1) * 1000 - detailGroupIndex - 1,
                        detailRows: detailGroup.detailRows,
                        shouldAggregate:
                            new Set(
                                detailGroup.detailRows
                                    .map(({ row }) => normalizeValue(getCellText(row, guidingColumnId)))
                                    .filter(Boolean)
                            ).size >= MIN_UNIQUE_EMOTIONS_FOR_AGGREGATE,
                    };
                })
                : null;

            if (detailGroups) {
                expandableKeys.push(
                    ...detailGroups
                        .filter(({ shouldAggregate }) => shouldAggregate)
                        .map(({ aggregateKey }) => aggregateKey)
                );
            }

            if (hideTopLevelAggregateRows || expandedAggregateRows.has(group.aggregateKey)) {
                if (detailGroups) {
                    for (const detailAggregateRow of sortTableRows(detailGroups.map(({ aggregateRow }) => aggregateRow))) {
                        const detailGroup = detailGroups.find(
                            ({ aggregateRow }) => aggregateRow === detailAggregateRow
                        );
                        if (!detailGroup) {
                            continue;
                        }

                        if (detailGroup.shouldAggregate) {
                            nextRows.push({
                                row: detailGroup.aggregateRow,
                                sourceIndex: detailGroup.aggregateSourceIndex,
                                isAggregateHeader: true,
                                aggregateKey: detailGroup.aggregateKey,
                            });
                        }

                        if (!detailGroup.shouldAggregate || expandedAggregateRows.has(detailGroup.aggregateKey)) {
                            const detailSourceIndexByRow = new Map(
                                detailGroup.detailRows.map(({ row, sourceIndex }) => [row, sourceIndex])
                            );
                            for (const row of sortTableRows(detailGroup.detailRows.map(({ row }) => row))) {
                                nextRows.push({
                                    row,
                                    sourceIndex: detailSourceIndexByRow.get(row) ?? nextRows.length,
                                    isAggregateHeader: false,
                                    aggregateKey: detailGroup.shouldAggregate ? detailGroup.aggregateKey : group.aggregateKey,
                                });
                            }
                        }
                    }
                } else {
                    const detailSourceIndexByRow = new Map(filteredDetailRows.map(({ row, sourceIndex }) => [row, sourceIndex]));
                    for (const row of sortTableRows(filteredDetailRows.map(({ row }) => row))) {
                        nextRows.push({
                            row,
                            sourceIndex: detailSourceIndexByRow.get(row) ?? nextRows.length,
                            isAggregateHeader: false,
                            aggregateKey: group.aggregateKey,
                        });
                    }
                }
            }
        }

        for (const row of sortTableRows(standaloneRows.filter(({ row }) => filteredRowSet.has(row)).map(({ row }) => row))) {
            nextRows.push({
                row,
                sourceIndex: standaloneRows.find((standaloneRow) => standaloneRow.row === row)?.sourceIndex ?? nextRows.length,
                isAggregateHeader: false,
                aggregateKey: null,
            });
        }

        return { visibleRows: nextRows, expandableAggregateKeys: expandableKeys };
    }, [
        aggregateRowsAsHeaders,
        aggregateRowsByColumnId,
        expandedAggregateRows,
        filteredRows,
        getCellText,
        getRawCellText,
        guidingColumnId,
        hideTopLevelAggregateRows,
        normalizedColumns,
        columnsById,
        rows,
        sortTableRows,
        sortedRows,
    ]);

    const rowGroupSpans = useMemo(() => {
        const spans = new Map<number, { label: string; span: number }>();
        if (!rowGroupByColumn) {
            return spans;
        }

        let groupStartIndex: number | null = null;
        let groupLabel = "";

        const flushGroup = (endIndex: number) => {
            if (groupStartIndex === null || !groupLabel) {
                return;
            }
            spans.set(groupStartIndex, { label: getRowGroupLabel(groupLabel), span: endIndex - groupStartIndex });
        };

        visibleRows.forEach(({ row }, index) => {
            const nextLabel = getRawCellText(row, rowGroupByColumn).trim();
            if (!nextLabel) {
                flushGroup(index);
                groupStartIndex = null;
                groupLabel = "";
                return;
            }

            if (groupStartIndex === null) {
                groupStartIndex = index;
                groupLabel = nextLabel;
                return;
            }

            if (normalizeValue(nextLabel) !== normalizeValue(groupLabel)) {
                flushGroup(index);
                groupStartIndex = index;
                groupLabel = nextLabel;
            }
        });

        flushGroup(visibleRows.length);
        return spans;
    }, [getRawCellText, rowGroupByColumn, visibleRows]);

    const rowGroupEndIndexes = useMemo(() => {
        const indexes = new Set<number>();
        for (const [startIndex, { span }] of rowGroupSpans.entries()) {
            indexes.add(startIndex + span - 1);
        }
        return indexes;
    }, [rowGroupSpans]);

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

    const showSuperGroupRow = useMemo(
        () => normalizedColumns.some((column) => column.hasExplicitSuperGroup),
        [normalizedColumns]
    );

    const superGroupedHeaderSegments = useMemo(() => {
        const segments: { label: string; span: number; color: string }[] = [];
        if (!showSuperGroupRow) {
            return segments;
        }
        for (const columnId of columnOrder) {
            const definition = columnsById[columnId];
            if (!definition) {
                continue;
            }
            const last = segments[segments.length - 1];
            if (last && last.label === definition.superGroupName) {
                last.span += 1;
            } else {
                segments.push({
                    label: definition.superGroupName,
                    span: 1,
                    color: definition.superGroupColor,
                });
            }
        }
        return segments;
    }, [columnOrder, columnsById, showSuperGroupRow]);

    const superGroupBoundaryColumnIds = useMemo(() => {
        const ends = new Set<string>();
        if (!showSuperGroupRow) {
            return ends;
        }

        for (let index = 0; index < columnOrder.length; index += 1) {
            const columnId = columnOrder[index];
            const definition = columnsById[columnId];
            if (!definition) {
                continue;
            }
            const nextColumnId = index < columnOrder.length - 1 ? columnOrder[index + 1] : null;
            const nextDefinition = nextColumnId ? columnsById[nextColumnId] : undefined;
            if (!nextDefinition || nextDefinition.superGroupName !== definition.superGroupName) {
                ends.add(columnId);
            }
        }

        return ends;
    }, [columnOrder, columnsById, showSuperGroupRow]);

    const getSuperGroupBoundaryClasses = (columnId: string) => {
        if (!showSuperGroupRow) {
            return "";
        }
        return superGroupBoundaryColumnIds.has(columnId) ? "super-group-end" : "";
    };

    const numericColumnRanges = useMemo<Record<string, { min: number; max: number }>>(() => {
        const ranges: Record<string, { min: number; max: number }> = {};

        for (const columnId of columnOrder) {
            const definition = columnsById[columnId];
            if (!definition || definition.filterType !== "numeric-heatmap") {
                continue;
            }

            let min = Number.POSITIVE_INFINITY;
            let max = Number.NEGATIVE_INFINITY;

            for (const row of rows) {
                const value = parseNumericValue(getCellText(row, columnId));
                if (value === null) {
                    continue;
                }
                if (value < min) {
                    min = value;
                }
                if (value > max) {
                    max = value;
                }
            }

            if (min !== Number.POSITIVE_INFINITY && max !== Number.NEGATIVE_INFINITY) {
                ranges[columnId] = { min, max };
            }
        }

        return ranges;
    }, [columnOrder, columnsById, rows, getCellText]);

    const effectiveColumnWidths = useMemo<Record<string, number>>(() => {
        if (columnOrder.length === 0) {
            return {};
        }

        const rowGroupWidth = rowGroupByColumn ? ROW_GROUP_COLUMN_WIDTH : 0;
        const availableWidth = Math.max(0, tableWrapWidth - SCROLLBAR_GUTTER_PX - rowGroupWidth);
        const preferredWidths = columnOrder.map((columnId) => {
            const definition = columnsById[columnId];
            const width = columnWidths[columnId] ?? definition?.initialWidth ?? DEFAULT_INITIAL_WIDTH;
            const minWidth = definition?.minWidth ?? DEFAULT_MIN_WIDTH;
            return Math.max(width, minWidth);
        });
        const minWidths = columnOrder.map((columnId) => {
            const definition = columnsById[columnId];
            return definition?.minWidth ?? DEFAULT_MIN_WIDTH;
        });

        const totalPreferredWidth = preferredWidths.reduce((sum, width) => sum + width, 0);
        const totalMinWidth = minWidths.reduce((sum, width) => sum + width, 0);

        let resolvedWidths = [...preferredWidths];

        if (availableWidth >= totalPreferredWidth) {
            const extraPerColumn = (availableWidth - totalPreferredWidth) / columnOrder.length;
            resolvedWidths = preferredWidths.map((width) => width + extraPerColumn);
        } else if (availableWidth >= totalMinWidth) {
            const shrinkNeeded = totalPreferredWidth - availableWidth;
            const totalShrinkCapacity = preferredWidths.reduce(
                (sum, width, index) => sum + (width - minWidths[index]),
                0
            );

            if (totalShrinkCapacity > 0) {
                resolvedWidths = preferredWidths.map((width, index) => {
                    const shrinkCapacity = width - minWidths[index];
                    const shrinkShare = (shrinkCapacity / totalShrinkCapacity) * shrinkNeeded;
                    return Math.max(minWidths[index], width - shrinkShare);
                });
            }
        } else {
            resolvedWidths = [...minWidths];
        }

        return columnOrder.reduce<Record<string, number>>((acc, columnId, index) => {
            acc[columnId] = resolvedWidths[index];
            return acc;
        }, {});
    }, [columnOrder, columnsById, columnWidths, rowGroupByColumn, tableWrapWidth]);

    const renderLevelBox = (value: string | null, color: string) => {
        if (!hasYes(value) && !hasLow(value)) {
            return null;
        }

        return (
            <div
                className="level-box"
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: 2,
                    backgroundColor: color,
                    opacity: hasLow(value) ? 0.35 : 1,
                    margin: "0 auto",
                }}
            />
        );
    };

    const getCountOpacity = (count: number): number => {
        if (count >= 11) return 1;
        if (count >= 9) return 0.9;
        if (count >= 7) return 0.7;
        if (count >= 5) return 0.5;
        if (count >= 3) return 0.3;
        if (count >= 1) return 0.1;
        return 0;
    };

    const darkenHexColor = (hex: string, amount = 0.15): string => {
        const normalized = hex.replace("#", "");
        if (normalized.length !== 6) {
            return hex;
        }

        const channels = [0, 2, 4].map((start) => {
            const value = parseInt(normalized.slice(start, start + 2), 16);
            return Math.max(0, Math.round(value * (1 - amount)));
        });

        return `#${channels.map((value) => value.toString(16).padStart(2, "0")).join("")}`;
    };

    const renderNumericHeatmapBox = (
        value: string | null,
        color: string,
        range: { min: number; max: number } | undefined
    ) => {
        const numericValue = parseNumericValue(value);
        if (numericValue === null || !range) {
            return null;
        }

        if (numericValue === 0) {
            return (
                <div
                    className="level-box"
                    //title={numericValue.toString()}
                    style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        backgroundColor: color,
                        opacity: 0,
                        margin: "0 auto",
                    }}
                />
            );
        }

        const opacity = getCountOpacity(numericValue);
        const backgroundColor = numericValue >= 11 ? darkenHexColor(color) : color;

        return (
            <div
                className="level-box"
                style={{
                    width: 16,
                    height: 16,
                    borderRadius: 2,
                    backgroundColor,
                    opacity,
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
        !disableHoverFade &&
        (hoveredRow !== null ||
            (hoveredColumnId !== null &&
                hoveredColumnId !== guidingColumnId &&
                columnsById[hoveredColumnId]?.filterType === "feature"));

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

    const toggleAggregateRow = (aggregateKey: string) => {
        setExpandedAggregateRows((prev) => {
            const next = new Set(prev);
            if (next.has(aggregateKey)) {
                next.delete(aggregateKey);
            } else {
                next.add(aggregateKey);
            }
            return next;
        });
    };

    const allAggregateRowsExpanded =
        expandableAggregateKeys.length > 0 && expandableAggregateKeys.every((key) => expandedAggregateRows.has(key));

    const toggleAllAggregateRows = () => {
        setExpandedAggregateRows((prev) => {
            if (allAggregateRowsExpanded) {
                return new Set([...prev].filter((key) => !expandableAggregateKeys.includes(key)));
            }
            return new Set([...prev, ...expandableAggregateKeys]);
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
            <div className="">
                <div className="">
                    <div className="error">No columns configured.</div>
                </div>
            </div>
        );
    }

    return (
        <div className={`size-full p-5 ${footer ? "table-with-footer" : ""}`}>
            <div className="size-full table-panel-inner">
                <h1 className="title">{title}</h1>
                <div className="table-summary">
                    <p className="subtitle">
                        Showing {visibleRows.length} of {rowCount} entries from {dataUrl.replace(/^\//, "")}
                    </p>
                    {aggregateRowsAsHeaders && expandableAggregateKeys.length > 0 ? (
                        <button type="button" className="expand-all-button" onClick={toggleAllAggregateRows}>
                            {allAggregateRowsExpanded ? "Collapse all subcategories" : "Expand all subcategories"}
                        </button>
                    ) : null}
                </div>

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
                        <table className="dense-table max-w-full">
                            <colgroup>
                                {rowGroupByColumn ? <col style={{ width: `${ROW_GROUP_COLUMN_WIDTH}px` }} /> : null}
                                {columnOrder.map((columnId) => (
                                    <col key={columnId} style={{ width: `${effectiveColumnWidths[columnId] ?? 60}px` }} />
                                ))}
                            </colgroup>
                            <thead>
                                {showSuperGroupRow ? (
                                    <tr className="super-group-row">
                                        {rowGroupByColumn ? (
                                            <th rowSpan={5} className="row-group-header-th">
                                                <span className="vertical-label" title={rowGroupColumnLabel ?? rowGroupByColumn}>
                                                    {truncateLabel(rowGroupColumnLabel ?? rowGroupByColumn)}
                                                </span>
                                            </th>
                                        ) : null}
                                        {superGroupedHeaderSegments.map((segment, index) => (
                                            <th
                                                key={`${segment.label}-${segment.span}-${index}`}
                                                colSpan={segment.span}
                                                className="super-group-th"
                                                style={{ background: segment.color }}
                                            >
                                                <span className="super-group-label">{segment.label}</span>
                                            </th>
                                        ))}
                                    </tr>
                                ) : null}
                                <tr className="group-row">
                                    {!showSuperGroupRow && rowGroupByColumn ? (
                                        <th rowSpan={4} className="row-group-header-th">
                                            <span className="vertical-label" title={rowGroupColumnLabel ?? rowGroupByColumn}>
                                                {truncateLabel(rowGroupColumnLabel ?? rowGroupByColumn)}
                                            </span>
                                        </th>
                                    ) : null}
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
                                                className={`w-full col col-${columnId} ${getSuperGroupBoundaryClasses(columnId)} ${draggedColumnId === columnId ? "column-dragging" : ""}`}
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
                                            <th
                                                key={`count-${columnId}`}
                                                className={`count-row-th col col-${columnId} ${getSuperGroupBoundaryClasses(columnId)}`}
                                            >
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
                                            <th
                                                key={`filter-${columnId}`}
                                                className={`col col-${columnId} ${getSuperGroupBoundaryClasses(columnId)}`}
                                            >
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
                                {visibleRows.map(({ row, sourceIndex, isAggregateHeader, aggregateKey }, index) => (
                                    (() => {
                                        const isAggregateSubRow =
                                            isAggregateHeader &&
                                            aggregateRowsByColumnId &&
                                            aggregateKey?.includes(`-${aggregateRowsByColumnId}-`);
                                        const rowGroupSpan = rowGroupSpans.get(index);
                                        const isRowGroupEnd = rowGroupEndIndexes.has(index);

                                        return (
                                            <tr
                                                key={`${getCellText(row, guidingColumnId) || "row"}-${sourceIndex}`}
                                                className={`${isRowHighlighted(row, index) ? "row-highlighted" : ""} ${isAggregateHeader ? "aggregate-row" : "emotion-detail-row"} ${isAggregateSubRow ? "aggregate-sub-row" : ""} ${isRowGroupEnd ? "row-group-end" : ""}`}
                                                onMouseEnter={() => setHoveredRow(index)}
                                                onMouseLeave={() => setHoveredRow(null)}
                                            >
                                                {rowGroupSpan ? (
                                                    <td rowSpan={rowGroupSpan.span} className="row-group-cell">
                                                        <span>{rowGroupSpan.label}</span>
                                                    </td>
                                                ) : null}
                                                {columnOrder.map((columnId) => {
                                                    const definition = columnsById[columnId];
                                                    if (!definition) {
                                                        return null;
                                                    }
                                                    const value = getCellText(row, columnId);
                                                    const cellTooltip = getCellTooltip?.(row, columnId) ?? null;
                                                    const isClickableHeatmapCell =
                                                        definition.filterType === "numeric-heatmap" && Boolean(cellTooltip);
                                                    const displayValue =
                                                        columnId === guidingColumnId && isAggregateHeader && !isAggregateSubRow
                                                            ? getValenceAffectLabel(getRawCellText(row, "Valence Category")) ||
                                                            stripAggregateLabel(value)
                                                            : value;

                                                    return (
                                                        <td
                                                            key={`${columnId}-${sourceIndex}`}
                                                            className={`col col-${columnId} ${getSuperGroupBoundaryClasses(columnId)} ${isClickableHeatmapCell ? "clickable-cell" : ""}`}
                                                            title={cellTooltip ?? undefined}
                                                            onClick={() => {
                                                                if (isClickableHeatmapCell) {
                                                                    onCellClick?.(row, columnId, cellTooltip);
                                                                }
                                                            }}
                                                        >
                                                            {columnId === guidingColumnId
                                                                ? isAggregateHeader && aggregateKey
                                                                    ? (
                                                                        <button
                                                                            type="button"
                                                                            className="aggregate-toggle"
                                                                            aria-expanded={expandedAggregateRows.has(aggregateKey)}
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                toggleAggregateRow(aggregateKey);
                                                                            }}
                                                                        >
                                                                            <span aria-hidden="true">
                                                                                {expandedAggregateRows.has(aggregateKey) ? "▾" : "▸"}
                                                                            </span>
                                                                            <span>{displayValue}</span>
                                                                        </button>
                                                                    )
                                                                    : displayValue
                                                                : definition.filterType === "feature"
                                                                    ? renderLevelBox(value, definition.groupColor)
                                                                    : definition.filterType === "numeric-heatmap"
                                                                        ? renderNumericHeatmapBox(
                                                                            value,
                                                                            definition.groupColor,
                                                                            numericColumnRanges[columnId]
                                                                        )
                                                                        : value}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })()
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {footer}
            </div>
        </div>
    );
}
