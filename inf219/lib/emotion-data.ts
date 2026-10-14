import type { EmotionRow } from "./types";

export const EMOTIONS_URL = "/emotions_by_everything.json";

// Loads emotion rows from the running app's public directory.
export async function loadEmotions(): Promise<EmotionRow[]> {
  const response = await fetch(EMOTIONS_URL);
  if (!response.ok) {
    throw new Error(`Could not load emotions (${response.status})`);
  }

  const data: unknown = await response.json();
  if (!Array.isArray(data) || !data.every(isEmotionRow)) {
    throw new Error("Expected a list of valid emotion rows");
  }
  return data;
}

// TypeScript types disappear at runtime, so check the JSON fields too.
function isEmotionRow(row: unknown): row is EmotionRow {
  if (typeof row !== "object" || row === null) {
    return false;
  }
  const value = row as Record<string, unknown>;
  return (
    typeof value.name === "string" &&
    typeof value["Basic Emotion"] === "string" &&
    typeof value["Valence Category"] === "string" &&
    Array.isArray(value.publications) &&
    value.publications.every((publication) => typeof publication === "string") &&
    (value.isAggregate === undefined || typeof value.isAggregate === "string") &&
    Object.values(value).every(
      (field) =>
        field === undefined ||
        typeof field === "string" ||
        (typeof field === "number" && Number.isFinite(field)) ||
        (Array.isArray(field) && field.every((item) => typeof item === "string")),
    )
  );
}
