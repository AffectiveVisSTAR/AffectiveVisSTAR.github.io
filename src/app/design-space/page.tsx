import Table, { DataTableGroup } from "../table/table";

export default function DesignSpaceTable() {
    const TABLE_GROUPS: DataTableGroup[] = [
        {
            name: "Publications",
            color: "#8da0cb",
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
            "origName": "ElementsKeywords",
            "name": "Element Studied",
            "color": "#fb8072",
            "columns": [
                {
                    "dataKey": "chart type",
                    "filterType": "feature"
                },
                {
                    "dataKey": "interactivity",
                    "filterType": "feature"
                },
                {
                    "dataKey": "in-the-wild example(s)",
                    "filterType": "feature"
                },
                {
                    "dataKey": "narrative element(s)",
                    "filterType": "feature"
                },
                {
                    "dataKey": "elicitation",
                    "filterType": "feature"
                },
                {
                    "dataKey": "colour",
                    "filterType": "feature"
                },
                {
                    "dataKey": "data characteristics",
                    "filterType": "feature"
                },
                {
                    "dataKey": "animation",
                    "filterType": "feature"
                },
                {
                    "dataKey": "typeface",
                    "filterType": "feature"
                },
                {
                    "dataKey": "bar style",
                    "filterType": "feature"
                },
                {
                    "dataKey": "text",
                    "filterType": "feature"
                },
                {
                    "dataKey": "topic",
                    "filterType": "feature"
                },
                {
                    "dataKey": "visual representation",
                    "filterType": "feature"
                },
                {
                    "dataKey": "metadata",
                    "filterType": "feature"
                },
                {
                    "dataKey": "size",
                    "filterType": "feature"
                },
                {
                    "dataKey": "saturation",
                    "filterType": "feature"
                },
                {
                    "dataKey": "visual style",
                    "filterType": "feature"
                },
                {
                    "dataKey": "presentation format",
                    "filterType": "feature"
                },
                {
                    "dataKey": "pictograph",
                    "filterType": "feature"
                },
                {
                    "dataKey": "map type",
                    "filterType": "feature"
                },
                {
                    "dataKey": "narrative elements",
                    "filterType": "feature"
                },
                {
                    "dataKey": "format",
                    "filterType": "feature"
                },
                {
                    "dataKey": "line",
                    "filterType": "feature"
                },
                {
                    "dataKey": "area geometries",
                    "filterType": "feature"
                },
                {
                    "dataKey": "affective priming",
                    "filterType": "feature"
                },
                {
                    "dataKey": "embellishment",
                    "filterType": "feature"
                },
                {
                    "dataKey": "risk prediction type",
                    "filterType": "feature"
                },
                {
                    "dataKey": "immersion",
                    "filterType": "feature"
                },
                {
                    "dataKey": "personalization",
                    "filterType": "feature"
                },
                {
                    "dataKey": "narrative element(s): personal stories (exemplification)",
                    "filterType": "feature"
                }
            ]
        }
    ];

    const TABLE_DATA_URL = "/classtable.json";
    const TABLE_TITLE = "AV STAR Classification";

    return (
        <div>
            <Table groups={TABLE_GROUPS} dataUrl={TABLE_DATA_URL} title={TABLE_TITLE} />
        </div>
    );
}
