"use client";

import { useEffect, useState } from "react";
import Table, { type DataTableGroup } from "./table/table";

const TABLE_GROUPS: DataTableGroup[] = [
    {
        name: "Publications",
        color: "#8da0cb",
        superGroupName: "Metadata",
        columns: [
            {
                dataKey: "AuthorYear",
                minWidth: 100,
                initialWidth: 150,
                filterType: "text",
            },
            {
                dataKey: "Year",
                minWidth: 50,
                initialWidth: 50,
                filterType: "text",
            },
            {
                dataKey: "Paper Nickname",
                minWidth: 120,
                initialWidth: 200,
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
                filterType: "feature",
            },
            {
                dataKey: "Engagement",
                filterType: "feature",
            },
            {
                dataKey: "Enjoyment",
                filterType: "feature",
            },
            {
                dataKey: "Comprehension",
                filterType: "feature",
            },
            {
                dataKey: "Recall",
                filterType: "feature",
            },
            {
                dataKey: "Sense-Making",
                filterType: "feature",
            },
            {
                dataKey: "Interpretation",
                filterType: "feature",
            },
            {
                dataKey: "Trust",
                filterType: "feature",
            },
            {
                dataKey: "Empathy",
                filterType: "feature",
            },
            {
                dataKey: "Persuasion (Attitude or Behaviour Change, Nudging)",
                filterType: "feature",
            },
            {
                dataKey: "Decision-Making",
                filterType: "feature",
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
                filterType: "feature",
            },
            {
                dataKey: "Neutral",
                filterType: "feature",
            },
            {
                dataKey: "Positive",
                filterType: "feature",
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
                filterType: "feature",
            },
            {
                dataKey: "Medicine",
                filterType: "feature",
            },
            {
                dataKey: "Public Health",
                filterType: "feature",
            },
            {
                dataKey: "Social/Civic",
                filterType: "feature",
            },
            {
                dataKey: "Business/Industry",
                filterType: "feature",
            },
            {
                dataKey: "Climate",
                filterType: "feature",
            },
            {
                dataKey: "Science Education",
                filterType: "feature",
            },
            {
                dataKey: "Journalism",
                filterType: "feature",
            },
            {
                dataKey: "Culture/Humanities",
                filterType: "feature",
            },
            {
                dataKey: "Diverse",
                filterType: "feature",
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
                filterType: "feature",
            },
            {
                dataKey: "Synthetic",
                filterType: "feature",
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
                dataKey: "In-the-Wild",
                filterType: "feature",
            },
            {
                dataKey: "Custom",
                filterType: "feature",
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
                filterType: "feature",
            },
            {
                dataKey: "Graph",
                filterType: "feature",
            },
            {
                dataKey: "Tree",
                filterType: "feature",
            },
            {
                dataKey: "Set",
                filterType: "feature",
            },
            {
                dataKey: "Map",
                filterType: "feature",
            },
            {
                dataKey: "Pictograph",
                filterType: "feature",
            },
            {
                dataKey: "Word Cloud",
                filterType: "feature",
            },
            {
                dataKey: "Image",
                filterType: "feature",
            },
            {
                dataKey: "Scientific Illustration",
                filterType: "feature",
            },
            {
                dataKey: "Video",
                filterType: "feature",
            },
            {
                dataKey: "Infographic",
                filterType: "feature",
            },
            {
                dataKey: "Dashboard",
                filterType: "feature",
            },
            {
                dataKey: "Multiple",
                filterType: "feature",
            },
            {
                dataKey: "Interactivity",
                filterType: "feature",
            },
            {
                dataKey: "Animation",
                filterType: "feature",
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
                filterType: "feature",
            },
            {
                dataKey: "Vis Type",
                filterType: "feature",
            },
            {
                dataKey: "Design Element",
                filterType: "feature",
            },
            {
                dataKey: "Visual Style/Embellishment",
                filterType: "feature",
            },
            {
                dataKey: "Narrative Element",
                filterType: "feature",
            },
            {
                dataKey: "Interaction",
                filterType: "feature",
            },
            {
                dataKey: "Animation",
                filterType: "feature",
            },
            {
                dataKey: "Presentation Format",
                filterType: "feature",
            },
            {
                dataKey: "In-the-Wild Examples",
                filterType: "feature",
            },
            {
                dataKey: "Various",
                filterType: "feature",
            },
            {
                dataKey: "Affective Priming/Elicitation",
                filterType: "feature",
            },
        ]
    },
    {
        name: "Study Type",
        superGroupName: "Study Method",
        superGroupColor: "#fb8150",
        color: "#fb8150",
        columns: [
            { dataKey: "Quantitative", filterType: "feature" },
            { dataKey: "Qualitative", filterType: "feature" },
            { dataKey: "Mixed", filterType: "feature" },
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
                filterType: "feature",
            },
            {
                dataKey: "Adapted Questionnaire",
                filterType: "feature",
            },
            {
                dataKey: "Semi-structured Interview",
                filterType: "feature",
            },
            {
                dataKey: "Short Interview",
                filterType: "feature",
            },
            {
                dataKey: "Affective Slider/Self-Assessment Manikin",
                filterType: "feature",
            },
            {
                dataKey: "Geneva Emotion Wheel",
                filterType: "feature",
            },
            {
                dataKey: "PANAS",
                filterType: "feature",
            },
            {
                dataKey: "VLAT",
                filterType: "feature",
            },
            {
                dataKey: "Observation",
                filterType: "feature",
            },
            {
                dataKey: "Think Aloud",
                filterType: "feature",
            },
            {
                dataKey: "Diary Study",
                filterType: "feature",
            },
            {
                dataKey: "Eye-tracking",
                filterType: "feature",
            },
            {
                dataKey: "Facial expression recognition",
                filterType: "feature",
            },
            {
                dataKey: "Biometric",
                filterType: "feature",
            },
            {
                dataKey: "Workshop",
                filterType: "feature",
            },
            {
                dataKey: "Other validated psychology measure",
                filterType: "feature",
            },
        ]
    },
];

const TABLE_DATA_URL = "/classtable.json";
const TABLE_MAPPING_URL = "/classtable_column_mapping.json";
const TABLE_TITLE = "AV STAR Classification";
const FALLBACK_GENERATED_GROUPS: DataTableGroup[] = [];

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

    return (
        <div className="size-full">
            <Table groups={groups} dataUrl={TABLE_DATA_URL} title={TABLE_TITLE} />
        </div>
    );
}
