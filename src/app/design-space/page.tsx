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
            name: "Domain Application",
            color: "#fc8d62",
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
            name: "Why Study Emotion",
            color: "rgb(214, 224, 26)",
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
            name: "Visual Idiom",
            color: "#66c2a5",
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
            name: "Data Source",
            color: "#e78ac3",
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
            color: "#a6d854",
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
            name: "Element Studied",
            color: "#cab2d6",
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
            color: "#fb8072",
            columns: [
                {
                    dataKey: "Quantitative",
                    filterType: "feature",
                },
                {
                    dataKey: "Qualitative",
                    filterType: "feature",
                },
                {
                    dataKey: "Mixed",
                    filterType: "feature",
                },
            ]
        },
        {
            name: "Study Instruments",
            color: "#fb8150",
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
    const TABLE_TITLE = "AV STAR Classification";

    return (
        <div>
            <Table groups={TABLE_GROUPS} dataUrl={TABLE_DATA_URL} title={TABLE_TITLE} />
        </div>
    );
}
