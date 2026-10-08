// Shared measurements for all panels. Rows only line up across panels
// if every panel uses the same numbers, so change them here, not in the components.

export const ROW_HEIGHT = 20; // height of one paper row
export const COLUMN_WIDTH = 20; // width of one classification column
export const CELL_SIZE = 14; // size of the square inside the cell
export const GROUP_GAP = 8; // space between subgroups in the same panel

// The header has three bands with the same height in every panel.
export const TITLE_HEIGHT = 36; // panel name, e.g. "Sources"
export const SUBGROUP_HEIGHT = 40; // subgroups, e.g. "Data" and "Vis"
export const LABEL_HEIGHT = 170; // rotated column names
export const HEADER_HEIGHT = TITLE_HEIGHT + SUBGROUP_HEIGHT + LABEL_HEIGHT;

// Column widths in the paper panel on the left.
export const PAPER_COLUMN_WIDTHS = {
  AuthorYear: 150,
  Year: 44,
  "Paper Nickname": 200,
} as const;

// Light version of a hex color, used for empty squares and backgrounds.
// "#ffcc15" + "26" = 15 % opacity.
export function tint(hexColor: string, alphaHex: string = "26"): string {
  return hexColor + alphaHex;
}
