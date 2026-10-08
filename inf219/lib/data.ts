import { FEATURE_COLUMNS, METADATA_COLUMNS } from "./columns";
import type { Paper, SortState } from "./types";

export const PAPERS_URL = "/classtable.json";

// Fetches the papers from public/classtable.json.
// Rows without AuthorYear (empty lines from the spreadsheet) are skipped.
export async function loadPapers(url: string = PAPERS_URL): Promise<Paper[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not load ${url} (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data)) {
    throw new Error(`${url} does not contain a list of papers`);
  }

  const papers = data.filter(
    (row): row is Paper =>
      typeof row === "object" && row !== null && typeof row.AuthorYear === "string",
  );

  warnAboutMissingColumns(papers);
  return papers;
}

// Warns in the console if columns.ts lists columns that are missing from the data,
// e.g. after columns were added or renamed in the spreadsheet.
function warnAboutMissingColumns(papers: Paper[]) {
  if (papers.length === 0) {
    return;
  }
  const missing = FEATURE_COLUMNS.filter((key) => !(key in papers[0]));
  if (missing.length > 0) {
    console.warn("These columns in columns.ts are missing from the data:", missing);
  }
}

// True if the paper is marked with X in the column.
export function isMarked(paper: Paper, key: string): boolean {
  return paper[key] === "X";
}

// Number of papers marked in a column.
export function countMarked(papers: Paper[], key: string): number {
  return papers.filter((paper) => isMarked(paper, key)).length;
}

// Filters on the metadata fields (author, year, nickname). Case-insensitive.
export function filterPapers(papers: Paper[], query: string): Paper[] {
  const q = query.trim().toLowerCase();
  if (q === "") {
    return papers;
  }
  return papers.filter((paper) =>
    METADATA_COLUMNS.some(({ key }) =>
      String(paper[key] ?? "").toLowerCase().includes(q),
    ),
  );
}

// Returns a sorted copy of the list.
// Metadata sorts alphabetically/numerically; classification columns put X first (when "asc").
// The sort is stable, so equal values keep their original order.
export function sortPapers(papers: Paper[], sort: SortState): Paper[] {
  if (sort === null) {
    return papers;
  }
  const { key, direction } = sort;
  const sign = direction === "asc" ? 1 : -1;

  return [...papers].sort((a, b) => sign * compareValues(a[key], b[key]));
}

function compareValues(a: Paper[string], b: Paper[string]): number {
  // Empty values always come last in ascending order.
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty || bEmpty) {
    return Number(aEmpty) - Number(bEmpty);
  }
  if (typeof a === "number" && typeof b === "number") {
    return a - b;
  }
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

// Next sort state when the user clicks a column:
// none → ascending → descending → none.
export function nextSort(current: SortState, key: string): SortState {
  if (current === null || current.key !== key) {
    return { key, direction: "asc" };
  }
  if (current.direction === "asc") {
    return { key, direction: "desc" };
  }
  return null;
}
