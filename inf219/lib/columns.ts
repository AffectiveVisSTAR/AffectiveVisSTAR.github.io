import type { MetadataKey, SuperGroup } from "./types";

// Columns in the left panel (paper info).
export const METADATA_COLUMNS: { key: MetadataKey; label: string }[] = [
  { key: "AuthorYear", label: "Author" },
  { key: "Year", label: "Year" },
  { key: "Paper Nickname", label: "Paper" },
];

// The panels of the table, in display order (left to right).
// Column keys must match the field names in classtable.json exactly.
// Colors are taken from the old site (src/app/page.tsx).
export const SUPER_GROUPS: SuperGroup[] = [
  {
    id: "conceptual",
    label: "Conceptual Underpinning",
    short: "CU",
    color: "#ffcc15",
    groups: [
      {
        id: "emotion-linked-to",
        label: "Emotion linked to",
        color: "#ffcc15",
        columns: [
          "Information Receptivity",
          "Engagement",
          "Enjoyment",
          "Comprehension",
          "Recall",
          "Sense-Making",
          "Interpretation",
          "Trust",
          "Empathy",
          "Persuasion (Attitude or Behaviour Change, Nudging)",
          "Decision-Making",
        ],
      },
      {
        id: "emotional-valence",
        label: "Emotional Valence",
        color: "#ffcc15",
        columns: ["Negative", "Neutral", "Positive"],
      },
    ],
  },
  {
    id: "domain",
    label: "Domain Application",
    short: "DA",
    color: "#c77bc1",
    groups: [
      {
        id: "domain-application",
        label: "Domain",
        color: "#c77bc1",
        columns: [
          "Agnostic",
          "Medicine",
          "Public Health",
          "Social/Civic",
          "Business/Industry",
          "Climate",
          "Science Education",
          "Journalism",
          "Culture/Humanities",
          "Diverse",
        ],
      },
    ],
  },
  {
    id: "sources",
    label: "Sources",
    short: "S",
    color: "#5fc9bb",
    groups: [
      {
        id: "data",
        label: "Data",
        color: "#5fc9bb",
        columns: ["Real-World", "Synthetic"],
      },
      {
        id: "vis",
        label: "Vis",
        color: "#5fc9bb",
        columns: ["Vis Source In-the-Wild", "Vis Source Custom"],
      },
    ],
  },
  {
    id: "design",
    label: "Design Aspect",
    short: "DS",
    color: "#70d384",
    groups: [
      {
        id: "visual-idiom",
        label: "Visual Idiom",
        color: "#70d384",
        columns: [
          "Chart",
          "Graph",
          "Tree",
          "Set",
          "Map",
          "Pictograph",
          "Word Cloud",
          "Image",
          "Scientific Illustration",
          "Video",
          "Infographic",
          "Dashboard",
          "Multiple",
          "Interactivity",
        ],
      },
      {
        id: "element-studied",
        label: "Element Studied",
        color: "#70d384",
        columns: [
          "Topic",
          "Vis Type",
          "Design Element",
          "Visual Style/Embellishment",
          "Narrative Element",
          "Interaction",
          "Animation",
          "Presentation Format",
          "In-the-Wild Examples",
          "Affective Priming/Elicitation",
        ],
      },
    ],
  },
  {
    id: "study-method",
    label: "Study Method",
    short: "SM",
    color: "#fb8150",
    groups: [
      {
        id: "study-type",
        label: "Study Type",
        color: "#fb8150",
        columns: ["Quantitative", "Qualitative", "Mixed"],
      },
      {
        id: "study-instruments",
        label: "Study Instruments",
        color: "#fb8150",
        columns: [
          "Custom Questionnaire",
          "Adapted Questionnaire",
          "Semi-structured Interview",
          "Short Interview",
          "Affective Slider/Self-Assessment Manikin",
          "Geneva Emotion Wheel",
          "PANAS",
          "VLAT",
          "Observation",
          "Think Aloud",
          "Diary Study",
          "Eye-tracking",
          "Facial expression recognition",
          "Biometric",
          "Workshop",
          "Other validated psychology measure",
        ],
      },
    ],
  },
];

// All classification columns in one flat list.
export const FEATURE_COLUMNS: string[] = SUPER_GROUPS.flatMap((superGroup) =>
  superGroup.groups.flatMap((group) => group.columns),
);

export const COLUMN_DESCRIPTIONS: Record<string, string> = {
  "Information Receptivity":
    "The degree to which a reader is open to taking in information presented in a visualization.",

  Engagement:
    "Capturing attention and spending more time exploring/interacting with a visualization.",

  Enjoyment:
    "Promoting a pleasurable and enjoyable experience when interacting with a visualization.",

  Comprehension:
    "Promoting understanding about the information or main message presented in a visualization.",

  "Sense-Making":
    "The process through which a reader makes connections to better understand the information or main message of a visualization.",

  Interpretation:
    "How a reader processes information in a visualization, and the conclusions drawn about that visualization.",

  Recall:
    "The ability to remember a visualization's design features or content/main message.",

  Trust:
    "The confidence or reassurance a reader has about a visualization that it is reliable and trustworthy, based on design, content/sources, and individual factors.",

  Empathy:
    "The capacity of a reader to identify with another person/entity's emotional experience.",

  Persuasion:
    "The degree to which a reader's short-term attitudes, longer-term values, and/or behaviours may be altered as a result of viewing/interacting with a visualization.",
    
  "Decision-Making":
    "The process of taking action based on a visualization, including the information presented and the design/other elements.",
};
