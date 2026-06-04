"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Table, { type DataTableGroup, type DataTableInitialSortRule } from "../table/table";

const TABLE_GROUPS: DataTableGroup[] = [
    {
        name: "Emotions",
        color: "#f6f0f0",
        superGroupName: "Emotions",
        columns: [
            {
                dataKey: "Valence Section",
                label: "Section",
                minWidth: 120,
                initialWidth: 120,
                filterType: "text",
                getValue: (row) => {
                    const valenceCategory = typeof row["Valence Category"] === "string" ? row["Valence Category"] : "";
                    if (valenceCategory === "Main") {
                        return "Main (high level)";
                    }
                    return valenceCategory;
                },
            },
            {
                dataKey: "name",
                label: "Affect",
                minWidth: 200,
                initialWidth: 150,
                filterType: "text",
            },
            {
                dataKey: "Basic Emotion",
                minWidth: 120,
                initialWidth: 120,
                filterType: "text",
            },
        ],
    },
    {
        name: "Why Study Emotion",
        color: "#ffcc15",
        superGroupName: "Conceptual Underpinning",
        superGroupColor: "#ffcc15",
        columns: [
            {
                dataKey: "Information Receptivity",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Engagement",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Enjoyment",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Comprehension",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Recall",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Sense-Making",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Interpretation",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Trust",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Empathy",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Persuasion (Attitude or Behaviour Change, Nudging)",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Decision-Making",
                filterType: "numeric-heatmap",
            },
        ],
    },
    {
        name: "Emotional Valence",
        color: "#ffd92f",
        superGroupName: "Conceptual Underpinning",
        columns: [
            {
                dataKey: "Negative",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Neutral",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Positive",
                filterType: "numeric-heatmap",
            },
        ]
    },
    {
        name: "Domain Application",
        color: "#c77bc1",
        superGroupName: "Domain Aspects",
        superGroupColor: "#c77bc1",
        columns: [
            {
                dataKey: "Agnostic",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Medicine",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Public Health",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Social/Civic",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Business/Industry",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Climate",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Science Education",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Journalism",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Culture/Humanities",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Diverse",
                filterType: "numeric-heatmap",
            },
        ],
    },
    {
        name: "Data Source",
        color: "#e78ac3",
        superGroupName: "Domain Aspects",
        columns: [
            {
                dataKey: "Real-World",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Synthetic",
                filterType: "numeric-heatmap",
            },
        ]
    },
    {
        name: "Vis Source",
        color: "#66c2a5",
        superGroupName: "Design Aspects",
        superGroupColor: "#66c2a5",
        columns: [
            {
                dataKey: "Vis Source In-the-Wild",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Vis Source Custom",
                filterType: "numeric-heatmap",
            },
        ]
    },
    {
        name: "Visual Idiom",
        color: "#70d384",
        superGroupName: "Design Aspects",
        columns: [
            {
                dataKey: "Chart",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Graph",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Tree",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Set",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Map",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Pictograph",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Word Cloud",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Image",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Scientific Illustration",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Video",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Infographic",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Dashboard",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Multiple",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Interactivity",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Animation",
                filterType: "numeric-heatmap",
            },
        ],
    },
    {
        name: "Element Studied",
        color: "#aae274",
        superGroupName: "Design Aspects",
        superGroupColor: "#ffa55f",
        columns: [
            {
                dataKey: "Topic",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Vis Type",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Design Element",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Visual Style/Embellishment",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Narrative Element",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Interaction",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Animation",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Presentation Format",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "In-the-Wild Examples",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Various",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Affective Priming/Elicitation",
                filterType: "numeric-heatmap",
            },
        ]
    },
    {
        name: "Study Type",
        superGroupName: "Study Method",
        superGroupColor: "#fb8150",
        color: "#fb8150",
        columns: [
            { dataKey: "Quantitative", filterType: "numeric-heatmap" },
            { dataKey: "Qualitative", filterType: "numeric-heatmap" },
            { dataKey: "Mixed", filterType: "numeric-heatmap" },
        ],
    },
    {
        name: "Study Instruments",
        superGroupName: "Study Method",
        superGroupColor: "#ffa55f",
        color: "#ffa55f",
        columns: [
            {
                dataKey: "Custom Questionnaire",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Adapted Questionnaire",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Semi-structured Interview",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Short Interview",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Affective Slider/Self-Assessment Manikin",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Geneva Emotion Wheel",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "PANAS",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "VLAT",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Observation",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Think Aloud",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Diary Study",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Eye-tracking",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Facial expression recognition",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Biometric",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Workshop",
                filterType: "numeric-heatmap",
            },
            {
                dataKey: "Other validated psychology measure",
                filterType: "numeric-heatmap",
            },
        ]
    },
];

const TABLE_DATA_URL = "/emotions_by_everything.json";
const TABLE_RAW_DATA_URL = "/classtable.json";
const TABLE_MAPPING_URL = "/classtable_column_mapping.json";
const TABLE_TITLE = "Affective Visualization Survey Classification";
const FALLBACK_GENERATED_GROUPS: DataTableGroup[] = [];
const INITIAL_SORT_RULES: DataTableInitialSortRule[] = [
    { dataKey: "Valence Section", direction: "asc" },
    { dataKey: "Basic Emotion", direction: "asc" },
    { dataKey: "name", direction: "asc" },
];

type EmotionRow = Record<string, unknown>;

type GeneratedGroupColumn = {
    dataKey?: unknown;
    filterType?: unknown;
};

type GeneratedGroup = {
    name?: unknown;
    color?: unknown;
    superGroupName?: unknown;
    superGroupColor?: unknown;
    columns?: unknown;
};

function toGeneratedGroups(raw: unknown): DataTableGroup[] {
    if (!Array.isArray(raw)) {
        return [];
    }

    const groups: DataTableGroup[] = [];
    for (const item of raw) {
        const candidate = item as GeneratedGroup;
        const name = typeof candidate.name === "string" ? candidate.name : "";
        const color = typeof candidate.color === "string" ? candidate.color : "#999999";
        const superGroupName =
            typeof candidate.superGroupName === "string" ? candidate.superGroupName : undefined;
        const superGroupColor =
            typeof candidate.superGroupColor === "string" ? candidate.superGroupColor : undefined;
        const rawColumns = Array.isArray(candidate.columns) ? candidate.columns : [];
        const columns = rawColumns
            .map((column) => {
                const col = column as GeneratedGroupColumn;
                const dataKey = typeof col.dataKey === "string" ? col.dataKey : "";
                const filterType = col.filterType === "feature" ? "feature" : null;
                if (!dataKey || !filterType) {
                    return null;
                }
                return { dataKey, filterType };
            })
            .filter((column): column is { dataKey: string; filterType: "feature" } => column !== null);

        if (!name || columns.length === 0) {
            continue;
        }
        groups.push({ name, color, superGroupName, superGroupColor, columns });
    }
    return groups;
}

export default function TableTestPage() {
    const [generatedGroups, setGeneratedGroups] = useState<DataTableGroup[]>(FALLBACK_GENERATED_GROUPS);

    useEffect(() => {
        let isActive = true;

        async function loadGeneratedGroups() {
            try {
                const res = await fetch(TABLE_MAPPING_URL, { cache: "no-store" });
                if (!res.ok) {
                    return;
                }
                const data = await res.json();
                const parsed = toGeneratedGroups(data);
                if (isActive) {
                    setGeneratedGroups(parsed);
                }
            } catch {
                // Keep fallback groups when mapping JSON is unavailable.
            }
        }

        // loadGeneratedGroups();

        return () => {
            isActive = false;
        };
    }, []);

    const groups = [...TABLE_GROUPS, ...generatedGroups];
    const [rawRows, setRawRows] = useState<EmotionRow[]>([]);

    useEffect(() => {
        let isActive = true;

        async function loadRawData() {
            try {
                const res = await fetch(TABLE_RAW_DATA_URL, { cache: "no-store" });
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                const data = (await res.json()) as EmotionRow[];
                if (isActive) {
                    setRawRows(Array.isArray(data) ? data : []);
                }
            } catch {
                if (isActive) {
                    setRawRows([]);
                }
            }
        }

        loadRawData();

        return () => {
            isActive = false;
        };
    }, []);

    const rawRowsByAuthorYear = useMemo(() => {
        const map = new Map<string, EmotionRow[]>();
        for (const row of rawRows) {
            const authorYear = typeof row.AuthorYear === "string" ? row.AuthorYear : "";
            if (!authorYear) {
                continue;
            }
            const list = map.get(authorYear) ?? [];
            list.push(row);
            map.set(authorYear, list);
        }
        return map;
    }, [rawRows]);

    const getDataKeyForColumn = useCallback(
        (columnId: string): string | null => {
            for (const group of groups) {
                const column = group.columns.find(
                    (column) => column.dataKey.replace(/\s+/g, "") === columnId
                );
                if (column) {
                    return column.dataKey;
                }
            }
            return null;
        },
        [groups]
    );

    const getCellTooltip = useCallback(
        (row: EmotionRow, columnId: string): string | null => {
            const dataKey = getDataKeyForColumn(columnId);
            if (!dataKey || dataKey === "name") {
                return null;
            }

            const publications = Array.isArray(row.publications)
                ? row.publications.filter((item): item is string => typeof item === "string")
                : [];
            if (publications.length === 0) {
                return null;
            }

            const emotion = typeof row.name === "string" ? row.name : "";
            if (!emotion) {
                return null;
            }

            const matchingPublications = Array.from(new Set(
                publications.filter((publication) => {
                    const rawRowsForPublication = rawRowsByAuthorYear.get(publication);
                    if (!rawRowsForPublication) {
                        return false;
                    }
                    return rawRowsForPublication.some((rawRow) => {
                        const rawValue = rawRow[dataKey];
                        if (rawValue !== "X") {
                            return false;
                        }
                        const specific = typeof rawRow.SpecificEmotionsCleaned === "string"
                            ? rawRow.SpecificEmotionsCleaned.split(",").map((item) => item.trim())
                            : [];
                        return specific.includes(emotion);
                    });
                })
            ));

            return matchingPublications.length > 0 ? matchingPublications.length + ": \n" + matchingPublications.join("\n") : null;
        },
        [getDataKeyForColumn, rawRowsByAuthorYear]
    );

    return (
        <div className="size-full">
            <Table
                groups={groups}
                dataUrl={TABLE_DATA_URL}
                initialSortRules={INITIAL_SORT_RULES}
                getCellTooltip={getCellTooltip}
                disableHoverFade
                aggregateRowsAsHeaders
                aggregateRowsByColumn="Basic Emotion"
                hideTopLevelAggregateRows
            />
        </div>
    );
}
