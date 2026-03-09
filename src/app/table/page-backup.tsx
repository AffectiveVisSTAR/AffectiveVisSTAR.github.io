"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { DataGrid, GridToolbar, type GridColDef } from "@mui/x-data-grid";

type CorpusRow = {
    "BibTex Key": string | null;
    Interactivity: string | null;
    Animation: string | null;
};

type GridRow = {
    id: string;
    bibtexKey: string;
    interactivity: string | null;
    animation: string | null;
};

function hasYes(value: string | null): boolean {
    return typeof value === "string" && value.trim().toLowerCase() === "yes";
}

function hasLow(value: string | null): boolean {
    return typeof value === "string" && value.trim().toLowerCase() === "low";
}

function renderLevelBox(value: string | null, color: string): ReactNode {
    if (hasYes(value)) {
        return (
            <Box
                sx={{
                    width: 16,
                    height: 16,
                    borderRadius: 0.5,
                    backgroundColor: color,
                    mx: "auto",
                }}
            />
        );
    }
    if (hasLow(value)) {
        return (
            <Box
                sx={{
                    width: 16,
                    height: 16,
                    borderRadius: 0.5,
                    backgroundColor: color,
                    opacity: 0.35,
                    mx: "auto",
                }}
            />
        );
    }
    return null;
}

function VerticalHeader({ label }: { label: string }) {
    return (
        <Box
            sx={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                whiteSpace: "nowrap",
                fontWeight: 700,
                lineHeight: 1.1,
                mx: "auto",
            }}
        >
            {label}
        </Box>
    );
}

export default function TableTestPage() {
    const [rows, setRows] = useState<CorpusRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

    console.log(hoveredColumn);


    useEffect(() => {
        let isActive = true;

        async function loadData() {
            try {
                const res = await fetch("/corpus260130_interactivity_animation.json", { cache: "no-store" });
                if (!res.ok) {
                    throw new Error(`Request failed with status ${res.status}`);
                }
                const data = (await res.json()) as CorpusRow[];
                if (isActive) {
                    setRows(Array.isArray(data) ? data : []);
                }
            } catch (e) {
                if (isActive) {
                    const message =
                        e instanceof Error ? e.message : "Unknown error while loading table data.";
                    setError(message);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        }

        loadData();
        return () => {
            isActive = false;
        };
    }, []);

    const rowCount = useMemo(() => rows.length, [rows]);
    const gridRows = useMemo<GridRow[]>(
        () =>
            rows.map((row, index) => ({
                id: `${row["BibTex Key"] ?? "row"}-${index}`,
                bibtexKey: row["BibTex Key"] ?? "",
                interactivity: row.Interactivity,
                animation: row.Animation,
            })),
        [rows]
    );

    const columns = useMemo<GridColDef<GridRow>[]>(
        () => [
            {
                field: "bibtexKey",
                headerName: "BibTex Key",
                width: 200,
                filterable: true,
                headerClassName: hoveredColumn === "bibtexKey" ? "column-hovered" : "",
                cellClassName: hoveredColumn === "bibtexKey" ? "column-hovered" : "",
                renderHeader: () => (
                    <Box
                        onMouseEnter={() => setHoveredColumn("bibtexKey")}
                        onMouseLeave={() => setHoveredColumn(null)}
                    >
                        <VerticalHeader label="BibTex Key" />
                    </Box>
                ),
                headerAlign: "center",
                align: "left",
            },
            {
                field: "interactivity",
                headerName: "Interactivity",
                width: 50,
                filterable: true,
                headerClassName: hoveredColumn === "interactivity" ? "column-hovered" : "",
                cellClassName: hoveredColumn === "interactivity" ? "column-hovered" : "",
                renderHeader: () => (
                    <Box
                        onMouseEnter={() => setHoveredColumn("interactivity")}
                        onMouseLeave={() => setHoveredColumn(null)}
                    >
                        <VerticalHeader label="Interactivity" />
                    </Box>
                ),
                headerAlign: "center",
                align: "center",
                renderCell: (params) => renderLevelBox(params.value ?? null, "#1976d2"),
            },
            {
                field: "animation",
                headerName: "Animation",
                width: 50,
                filterable: true,
                headerClassName: hoveredColumn === "animation" ? "column-hovered" : "",
                cellClassName: hoveredColumn === "animation" ? "column-hovered" : "",
                renderHeader: () => (
                    <Box
                        onMouseEnter={() => setHoveredColumn("animation")}
                        onMouseLeave={() => setHoveredColumn(null)}
                    >
                        <VerticalHeader label="Animation" />
                    </Box>
                ),
                headerAlign: "center",
                align: "center",
                renderCell: (params) => renderLevelBox(params.value ?? null, "#2e7d32"),
            },
        ],
        [hoveredColumn]
    );

    return (
        <Box sx={{ minHeight: "100vh", px: 3, py: 6, backgroundColor: "#f5f7fa" }}>
            <Box sx={{ maxWidth: 300, mx: "auto" }}>
                <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>
                    Corpus 260130
                </Typography>
                <Typography variant="body1" sx={{ mb: 3, color: "text.secondary" }}>
                    Showing {rowCount} entries from corpus260130_interactivity_animation.json
                </Typography>

                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress />
                    </Box>
                )}

                {!loading && error && <Alert severity="error">{error}</Alert>}

                {!loading && !error && (
                    <Paper elevation={1}>
                        <DataGrid
                            rows={gridRows}
                            columns={columns}
                            density="compact"
                            disableRowSelectionOnClick
                            slots={{ toolbar: GridToolbar }}
                            initialState={{
                                pagination: {
                                    paginationModel: { pageSize: 100, page: 0 },
                                },
                            }}
                            pageSizeOptions={[25, 50, 100]}
                            sx={{
                                border: 0,
                                "& .MuiDataGrid-columnHeader": {
                                    height: "150px !important",
                                    maxHeight: "150px !important",
                                    px: 0.25,
                                },
                                "& .MuiDataGrid-columnHeaders": {
                                    maxHeight: "150px !important",
                                },
                                "& .MuiDataGrid-cell": {
                                    px: 1.0,
                                    py: 0.0,
                                    alignItems: "center",
                                    display: "flex"
                                },
                                // "& .MuiDataGrid-row": {
                                //     minHeight: "20px !important",
                                //     maxHeight: "20px !important",
                                //     height: "20px !important",
                                //     "--height": "20px !important",
                                // },
                                "& .MuiDataGrid-columnHeaderTitleContainer": {
                                    px: 1.0,
                                },
                                "& .MuiDataGrid-cell:focus, & .MuiDataGrid-columnHeader:focus": {
                                    outline: "none",
                                },
                                "& .column-hovered": {
                                    backgroundColor: "rgba(25, 118, 210, 0.10)",
                                },
                            }}
                        />
                    </Paper>
                )}
            </Box>
        </Box>
    );
}
