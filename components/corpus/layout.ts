// Shared measurements for all panels. Rows only line up across panels
// if every panel uses the same numbers, so change them here, not in the components.

export const ROW_HEIGHT = 20; // height of one paper row
export const COLUMN_WIDTH = 20; // width of one classification column
export const CELL_SIZE = 14; // size of the square inside the cell
export const GROUP_GAP = 8; // space between subgroups in the same panel
export const MIN_GROUP_WIDTH = 68; // so the subgroup name fits even when a subgroup has few columns

// Width of a subgroup. Narrow subgroups are widened and their columns centered,
// so use this in every band (subgroup name, column names and rows) to keep them aligned.
export function groupWidth(group: { columns: string[] }): number {
  return Math.max(group.columns.length * COLUMN_WIDTH, MIN_GROUP_WIDTH);
}

// The header has three bands with the same height in every panel.
export const TITLE_HEIGHT = 36; // panel name, e.g. "Sources"
export const SUBGROUP_HEIGHT = 52; // subgroups, e.g. "Data" and "Vis" (room for three lines)
export const LABEL_HEIGHT = 170; // rotated column names
export const SEARCH_HEIGHT = 28; // search field at the bottom of the label band in the paper panel
export const HEADER_HEIGHT = TITLE_HEIGHT + SUBGROUP_HEIGHT + LABEL_HEIGHT;

// Column widths in the paper panel on the left.
export const PAPER_COLUMN_WIDTHS = {
  AuthorYear: 150,
  Year: 64,
  "Paper Nickname": 200,
} as const;

// Light version of a hex color, used for empty squares and backgrounds.
// "#ffcc15" + "26" = 15 % opacity.
export function tint(hexColor: string, alphaHex: string = "26"): string {
  return hexColor + alphaHex;
}
