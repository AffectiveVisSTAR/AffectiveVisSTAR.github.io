// Value of a classification column: "X" means the paper has the feature.
export type FeatureValue = "X" | null;

// One paper (one row in classtable.json).
// The three metadata fields are always present; the rest are classification columns.
export type Paper = {
  AuthorYear: string;
  Year: number | null;
  "Paper Nickname": string;
  SpecificEmotionsCleaned?: string | null;
  [column: string]: string | number | null | undefined;
};

// Bibliographic details for one paper (one row in classtable_metadata.json).
// Matched to Paper by AuthorYear.
export type PaperMetadata = {
  AuthorYear: string;
  Title: string;
  Journal: string;
  Country: string;
  Abstract: string;
  DomainApp: string;
  DOI: string;
};

// Keys of the metadata fields shown in the left panel.
export type MetadataKey = "AuthorYear" | "Year" | "Paper Nickname";

// A subgroup of columns, e.g. "Emotion linked to".
export type ColumnGroup = {
  id: string;
  label: string;
  color: string;
  columns: string[]; // keys in Paper
};

// A panel in the table, e.g. "Conceptual Underpinning".
export type SuperGroup = {
  id: string;
  label: string;
  short: string; // shown on the narrow strip when the panel is collapsed
  color: string;
  groups: ColumnGroup[];
};

export type SortDirection = "asc" | "desc";

export type SortState = {
  key: string;
  direction: SortDirection;
} | null;

// One row in emotions_by_everything.json.
export type EmotionRow = {
  name: string;
  "Basic Emotion": string;
  "Valence Category": string;
  publications: string[];
  isAggregate?: string;
  [column: string]: string | number | string[] | undefined;
};
