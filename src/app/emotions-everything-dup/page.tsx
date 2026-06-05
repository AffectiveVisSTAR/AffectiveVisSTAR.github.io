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
        name: " ",
        color: "#c77bc1",
        superGroupName: "Domain Application",
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
        name: "Data",
        color: "#5fc9bb",
        superGroupName: "Sources",
        superGroupColor: "#42a89a",
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
        name: "Vis",
        color: "#8ae7db",
        superGroupName: "Sources",
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
            // {
               // dataKey: "Animation",
               // filterType: "numeric-heatmap",
            // },
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
const TABLE_METADATA_URL = "/classtable_metadata.json";
const TABLE_TITLE = "Affective Visualization Survey Classification";
const FALLBACK_GENERATED_GROUPS: DataTableGroup[] = [];
const INITIAL_SORT_RULES: DataTableInitialSortRule[] = [
    { dataKey: "Basic Emotion", direction: "asc" },
    { dataKey: "name", direction: "asc" },
];

type EmotionRow = Record<string, unknown>;

type SelectedCellDetails = {
    title: string;
    count: number;
    authorYears: string[];
};

type MetadataFilters = {
    journal: string;
    country: string;
    domain: string;
};

type MetadataRow = {
    AuthorYear?: unknown;
    Title?: unknown;
    Year?: unknown;
    Journal?: unknown;
    Country?: unknown;
    Abstract?: unknown;
    DomainApp?: unknown;
    DOI?: unknown;
    "BibTex Key"?: unknown;
};

type PaperMetadata = {
    authorYear: string;
    title: string;
    year: string;
    journal: string;
    country: string;
    abstract: string;
    domain: string;
    doi: string;
    bibTexKey: string;
};

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

const ALL_METADATA_FILTERS: MetadataFilters = {
    journal: "all",
    country: "all",
    domain: "all",
};

function splitMetadataValues(value: string): string[] {
    return value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

function getFilterOptions(values: string[]): string[] {
    return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function matchesMetadataFilter(value: string, filter: string): boolean {
    if (filter === "all") {
        return true;
    }
    return splitMetadataValues(value).includes(filter);
}

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
    const [selectedCellDetails, setSelectedCellDetails] = useState<SelectedCellDetails | null>(null);
    const [metadataFilters, setMetadataFilters] = useState<MetadataFilters>(ALL_METADATA_FILTERS);
    const [paperMetadata, setPaperMetadata] = useState<PaperMetadata[]>([]);

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

    const groups = useMemo(() => [...TABLE_GROUPS, ...generatedGroups], [generatedGroups]);
    const [rawRows, setRawRows] = useState<EmotionRow[]>([]);

    useEffect(() => {
        let isActive = true;

        async function loadPaperMetadata() {
            try {
                const res = await fetch(TABLE_METADATA_URL, { cache: "no-store" });
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                const data = (await res.json()) as MetadataRow[];
                if (!isActive || !Array.isArray(data)) {
                    return;
                }

                setPaperMetadata(
                    data
                        .map((row) => ({
                            authorYear: typeof row.AuthorYear === "string" ? row.AuthorYear : "",
                            title: typeof row.Title === "string" ? row.Title : "",
                            year: row.Year === null || row.Year === undefined ? "" : String(row.Year),
                            journal: typeof row.Journal === "string" ? row.Journal : "",
                            country: typeof row.Country === "string" ? row.Country : "",
                            abstract: typeof row.Abstract === "string" ? row.Abstract : "",
                            domain: typeof row.DomainApp === "string" ? row.DomainApp : "",
                            doi: typeof row.DOI === "string" ? row.DOI : "",
                            bibTexKey: typeof row["BibTex Key"] === "string" ? row["BibTex Key"] : "",
                        }))
                        .filter((row) => row.authorYear)
                );
            } catch {
                if (isActive) {
                    setPaperMetadata([]);
                }
            }
        }

        loadPaperMetadata();

        return () => {
            isActive = false;
        };
    }, []);

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

    const paperMetadataByAuthorYear = useMemo(() => {
        const map = new Map<string, PaperMetadata>();
        for (const item of paperMetadata) {
            map.set(item.authorYear, item);
        }
        return map;
    }, [paperMetadata]);

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
            const childEmotions = Array.isArray(row.childEmotions)
                ? row.childEmotions.filter((item): item is string => typeof item === "string")
                : [];
            const emotionsToMatch = childEmotions.length > 0 ? childEmotions : [emotion];
            const emotionsToMatchSet = new Set(emotionsToMatch);

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
                        return specific.some((item) => emotionsToMatchSet.has(item));
                    });
                })
            ));

            return matchingPublications.length > 0 ? matchingPublications.length + ": \n" + matchingPublications.join("\n") : null;
        },
        [getDataKeyForColumn, rawRowsByAuthorYear]
    );

    const handleCellClick = useCallback(
        (row: EmotionRow, columnId: string, tooltip: string | null) => {
            if (!tooltip) {
                return;
            }

            const tooltipLines = tooltip.split("\n").map((line) => line.trim()).filter(Boolean);
            const countMatch = tooltipLines[0]?.match(/^(\d+)/);
            const count = countMatch ? Number(countMatch[1]) : Math.max(0, tooltipLines.length - 1);
            const authorYears = tooltipLines.slice(1);
            const dataKey = getDataKeyForColumn(columnId);
            const emotion = typeof row.name === "string" ? row.name : "Selected cell";
            const title = dataKey ? `${emotion} / ${dataKey}` : emotion;
            setSelectedCellDetails({ title, count, authorYears });
            setMetadataFilters(ALL_METADATA_FILTERS);
        },
        [getDataKeyForColumn]
    );

    const selectedPapers = useMemo(
        () =>
            selectedCellDetails
                ? selectedCellDetails.authorYears.map((authorYear) => ({
                    authorYear,
                    paper: paperMetadataByAuthorYear.get(authorYear),
                }))
                : [],
        [paperMetadataByAuthorYear, selectedCellDetails]
    );

    const metadataFilterOptions = useMemo(
        () => ({
            journals: getFilterOptions(selectedPapers.map(({ paper }) => paper?.journal ?? "")),
            countries: getFilterOptions(selectedPapers.flatMap(({ paper }) => splitMetadataValues(paper?.country ?? ""))),
            domains: getFilterOptions(selectedPapers.flatMap(({ paper }) => splitMetadataValues(paper?.domain ?? ""))),
        }),
        [selectedPapers]
    );

    const filteredSelectedPapers = useMemo(
        () =>
            selectedPapers.filter(({ paper }) => {
                if (!paper) {
                    return metadataFilters.journal === "all" &&
                        metadataFilters.country === "all" &&
                        metadataFilters.domain === "all";
                }

                return matchesMetadataFilter(paper.journal, metadataFilters.journal) &&
                    matchesMetadataFilter(paper.country, metadataFilters.country) &&
                    matchesMetadataFilter(paper.domain, metadataFilters.domain);
            }),
        [metadataFilters, selectedPapers]
    );

    return (
        <div className="size-full">
            <Table
                groups={groups}
                dataUrl={TABLE_DATA_URL}
                initialSortRules={INITIAL_SORT_RULES}
                getCellTooltip={getCellTooltip}
                onCellClick={handleCellClick}
                footer={
                    <section className="cell-details-panel" aria-live="polite">
                        {selectedCellDetails ? (
                            <>
                                <h2>{selectedCellDetails.title}</h2>
                                <p>
                                    {filteredSelectedPapers.length} of {selectedCellDetails.count} papers
                                </p>
                                <div className="metadata-filter-row">
                                    <label>
                                        <span>Journal</span>
                                        <select
                                            value={metadataFilters.journal}
                                            onChange={(event) =>
                                                setMetadataFilters((prev) => ({ ...prev, journal: event.target.value }))
                                            }
                                        >
                                            <option value="all">All journals</option>
                                            {metadataFilterOptions.journals.map((journal) => (
                                                <option key={journal} value={journal}>
                                                    {journal}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        <span>Country</span>
                                        <select
                                            value={metadataFilters.country}
                                            onChange={(event) =>
                                                setMetadataFilters((prev) => ({ ...prev, country: event.target.value }))
                                            }
                                        >
                                            <option value="all">All countries</option>
                                            {metadataFilterOptions.countries.map((country) => (
                                                <option key={country} value={country}>
                                                    {country}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                    <label>
                                        <span>Domain</span>
                                        <select
                                            value={metadataFilters.domain}
                                            onChange={(event) =>
                                                setMetadataFilters((prev) => ({ ...prev, domain: event.target.value }))
                                            }
                                        >
                                            <option value="all">All domains</option>
                                            {metadataFilterOptions.domains.map((domain) => (
                                                <option key={domain} value={domain}>
                                                    {domain}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </div>
                                <div className="paper-list">
                                    {filteredSelectedPapers.map(({ authorYear, paper }) => {
                                        const doi = paper?.doi ?? "";
                                        const doiHref = doi
                                            ? doi.startsWith("http")
                                                ? doi
                                                : `https://doi.org/${doi}`
                                            : "";

                                        return (
                                            <article className="paper-list-item" key={authorYear}>
                                                <p className="paper-citation">
                                                    <strong>{authorYear}.</strong>{" "}
                                                    {paper?.title ? `${paper.title}.` : "Metadata not found."}
                                                </p>
                                                {paper ? (
                                                    <>
                                                        <p>
                                                            Journal: {paper.journal || "Unknown"}. Country: {paper.country || "Unknown"}. Domain: {paper.domain || "Unknown"}.
                                                        </p>
                                                        {paper.abstract ? (
                                                            <details>
                                                                <summary>Abstract</summary>
                                                                <p>{paper.abstract}</p>
                                                            </details>
                                                        ) : null}
                                                        {doiHref ? (
                                                            <p>
                                                                DOI:{" "}
                                                                <a href={doiHref} target="_blank" rel="noreferrer">
                                                                    {doi}
                                                                </a>
                                                            </p>
                                                        ) : null}
                                                    </>
                                                ) : null}
                                            </article>
                                        );
                                    })}
                                    {filteredSelectedPapers.length === 0 ? (
                                        <p>No papers match the selected metadata filters.</p>
                                    ) : null}
                                </div>
                            </>
                        ) : (
                            <p>Click a coloured square to show its publication count and AuthorYear list.</p>
                        )}
                    </section>
                }
                disableHoverFade
                aggregateRowsAsHeaders
                aggregateRowsByColumn="Basic Emotion"
                hideTopLevelAggregateRows
                rowGroupByColumn="Valence Category"
                rowGroupColumnLabel="Valence Category"
            />
        </div>
    );
}
