import type { EmotionRow, Paper } from "./types";

const CATEGORY_ORDER = ["General/Neutral", "Positive", "Negative"];
// "Trust" is displayed as "Affective Trust"; flattened Anticipation rows follow it.
const GENERAL_NEUTRAL_ROW_ORDER = ["Trust", "_"];
const GENERAL_NEUTRAL_HIDDEN_ROWS = ["Arousal", "Dominance", "Valence"];
const GENERAL_NEUTRAL_FLATTENED_BASICS = ["Anticipation"];
const GENERAL_NEUTRAL_FLATTENED_ROW_ORDER = [
  "Curiosity",
  "Surprise",
  "Attentive",
  "Alert",
  "Anticipation",
];
const POSITIVE_ROW_ORDER = ["_", "Joy/Pleasure", "Love", "Anticipation", "Self-Assurance"];
const NEGATIVE_ROW_ORDER = ["_", "Sadness", "Fear/Anxiety", "Anger", "Disgust", "Anticipation", "Manipulation"];

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
function buildDisplayRows(
  rows: EmotionRow[],
  basicOrder?: string[],
  options: {
    excludedNames?: string[];
    flattenedBasics?: string[];
    flattenedRowOrder?: string[];
  } = {},
): DisplayRow[] {
  const basics = new Map<string, EmotionRow[]>();
  for (const row of rows) {
    if (row.isAggregate === "X" || options.excludedNames?.includes(row.name)) continue;
    const sourceBasic = row["Basic Emotion"];
    const basic = options.flattenedBasics?.includes(sourceBasic) ? "_" : sourceBasic;
    const members = basics.get(basic) ?? [];
    members.push(row);
    basics.set(basic, members);
  }

  const result: DisplayRow[] = [];
  const alphabeticalNames = Array.from(basics.keys()).sort((a, b) =>
    a === "_" ? -1 : b === "_" ? 1 : a.localeCompare(b),
  );
  const names = basicOrder
    ? [
        ...basicOrder.filter((basic) => basics.has(basic)),
        ...alphabeticalNames.filter((basic) => !basicOrder.includes(basic)),
      ]
    : alphabeticalNames;

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
    const orderedMembers = basic === "_" && options.flattenedRowOrder
      ? [...members].sort((a, b) => {
          const aOrder = options.flattenedRowOrder!.indexOf(a.name);
          const bOrder = options.flattenedRowOrder!.indexOf(b.name);
          if (aOrder < 0 && bOrder < 0) return a.name.localeCompare(b.name);
          if (aOrder < 0) return 1;
          if (bOrder < 0) return -1;
          return aOrder - bOrder;
        })
      : [...members].sort((a, b) => a.name.localeCompare(b.name));
    for (const member of orderedMembers) {
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
    rows: buildDisplayRows(
      group.rows,
      group.category === "General/Neutral"
        ? GENERAL_NEUTRAL_ROW_ORDER
        : group.category === "Positive"
          ? POSITIVE_ROW_ORDER
          : group.category === "Negative"
            ? NEGATIVE_ROW_ORDER
            : undefined,
      group.category === "General/Neutral"
        ? {
            excludedNames: GENERAL_NEUTRAL_HIDDEN_ROWS,
            flattenedBasics: GENERAL_NEUTRAL_FLATTENED_BASICS,
            flattenedRowOrder: GENERAL_NEUTRAL_FLATTENED_ROW_ORDER,
          }
        : undefined,
    ).filter((row) =>
      !row.isChild || !collapsed.has(groupKey(group.category, row.groupId!)),
    ),
  })).filter((group) => group.rows.length > 0);
}

export type EmotionDisplayGroup = ReturnType<typeof getVisibleEmotionGroups>[number];

// Return each paper once, even when several emotions match it.
// Returns the papers themselves, because different papers can share AuthorYear (e.g. "Lan et al. 2021").
export function getEmotionPapers(
  row: DisplayRow,
  column: string,
  papers: Paper[],
): Paper[] {
  const emotionNames = new Set(row.members.map((member) => member.name));

  return papers
    .filter((paper) => {
      if (paper[column] !== "X") return false;

      const specific = typeof paper.SpecificEmotionsCleaned === "string"
        ? paper.SpecificEmotionsCleaned.split(",").map((emotion) => emotion.trim())
        : [];

      return specific.some((emotion) => emotionNames.has(emotion));
    })
    .sort((a, b) => a.AuthorYear.localeCompare(b.AuthorYear));
}

// Use the same matching logic when only the count is needed.
export function getEmotionCount(
  row: DisplayRow,
  column: string,
  papers: Paper[],
): number {
  return getEmotionPapers(row, column, papers).length;
}
