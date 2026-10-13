import type { EmotionRow } from "./types";

const CATEGORY_ORDER = ["Negative", "Positive", "Neutral", "Main"];

// Put rows with the same valence together without changing the source data.
function groupByValence(emotions: EmotionRow[]) {
  const groups = new Map<string, EmotionRow[]>();
  for (const emotion of emotions) {
    const category = emotion["Valence Category"];
    const rows = groups.get(category) ?? [];
    rows.push(emotion);
    groups.set(category, rows);
  }
  const categories = [
    ...CATEGORY_ORDER.filter((category) => groups.has(category)),
    ...Array.from(groups.keys()).filter((category) => !CATEGORY_ORDER.includes(category)),
  ];
  return categories.map((category) => ({ category, rows: groups.get(category)! }));
}

export type DisplayRow = {
  id: string;
  name: string;
  basicEmotion: string;
  isGroup: boolean;
  isChild: boolean;
  groupId?: string;
  members: EmotionRow[];
};

// The original table hides category totals and groups the remaining emotions.
function buildDisplayRows(rows: EmotionRow[]): DisplayRow[] {
  const basics = new Map<string, EmotionRow[]>();
  for (const row of rows) {
    if (row.isAggregate === "X") continue;
    const basic = row["Basic Emotion"];
    const members = basics.get(basic) ?? [];
    members.push(row);
    basics.set(basic, members);
  }

  const result: DisplayRow[] = [];
  const names = Array.from(basics.keys()).sort((a, b) =>
    a === "_" ? -1 : b === "_" ? 1 : a.localeCompare(b),
  );

  for (const basic of names) {
    const members = basics.get(basic)!;
    const hasGroup = basic !== "_" && members.length > 1;
    if (hasGroup) {
      result.push({
        id: "group:" + basic,
        name: basic,
        basicEmotion: basic,
        isGroup: true,
        isChild: false,
        groupId: basic,
        members,
      });
    }
    for (const member of [...members].sort((a, b) => a.name.localeCompare(b.name))) {
      result.push({
        id: "emotion:" + member.name,
        name: member.name,
        basicEmotion: basic === "_" ? "–" : basic,
        isGroup: false,
        isChild: hasGroup,
        groupId: hasGroup ? basic : undefined,
        members: [member],
      });
    }
  }
  return result;
}


export const groupKey = (category: string, basic: string) => JSON.stringify([category, basic]);

export function getVisibleEmotionGroups(emotions: EmotionRow[], collapsed: Set<string>) {
  return groupByValence(emotions).map((group) => ({
    category: group.category,
    rows: buildDisplayRows(group.rows).filter((row) =>
      !row.isChild || !collapsed.has(groupKey(group.category, row.groupId!)),
    ),
  })).filter((group) => group.rows.length > 0);
}

export type EmotionDisplayGroup = ReturnType<typeof getVisibleEmotionGroups>[number];

// Group rows sum the counts of their child emotions, as in the original table.
// These are emotion counts; a paper present in several emotions can contribute more than once.
export function getEmotionCount(row: DisplayRow, column: string): number {
  return row.members.reduce((sum, member) => {
    const value = member[column];
    return sum + (typeof value === "number" ? value : 0);
  }, 0);
}
