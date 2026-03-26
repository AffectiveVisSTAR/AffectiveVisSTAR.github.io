import { promises as fs } from "fs";
import path from "path";
import { NextResponse } from "next/server";

type CountsData = Record<string, Record<string, number>>;
type HeatmapTableRow = Record<string, string>;

const DOMAIN_ORDER = [
  "Agnostic",
  "Medicine",
  "Public Health",
  "Social/Civic",
  "Business/Industry",
  "Climate",
  "Science Education",
  "Journalism",
  "Culture/Humanities",
  "Various",
  "(No domain)",
];

function getOrderedDomains(counts: CountsData): string[] {
  const domainsFromData = Object.keys(counts);
  return [
    ...DOMAIN_ORDER.filter((domain) => domainsFromData.includes(domain)),
    ...domainsFromData.filter((domain) => !DOMAIN_ORDER.includes(domain)),
  ];
}

function getOrderedEmotions(counts: CountsData): string[] {
  const domains = Object.keys(counts);
  const emotionSet = new Set<string>();
  for (const domain of domains) {
    for (const emotion of Object.keys(counts[domain] ?? {})) {
      emotionSet.add(emotion);
    }
  }

  const emotions = Array.from(emotionSet);
  const emotionTotals = new Map<string, number>();
  for (const emotion of emotions) {
    let total = 0;
    for (const domain of domains) {
      total += counts[domain]?.[emotion] ?? 0;
    }
    emotionTotals.set(emotion, total);
  }

  emotions.sort((a, b) => {
    const diff = (emotionTotals.get(b) ?? 0) - (emotionTotals.get(a) ?? 0);
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  return emotions;
}

function buildRows(counts: CountsData): HeatmapTableRow[] {
  const orderedDomains = getOrderedDomains(counts);
  const orderedEmotions = getOrderedEmotions(counts);

  return orderedEmotions.map((emotion) => {
    const row: HeatmapTableRow = { Emotion: emotion };
    for (const domain of orderedDomains) {
      row[domain] = String(counts[domain]?.[emotion] ?? 0);
    }
    return row;
  });
}

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "counts.json");
    const fileContents = await fs.readFile(filePath, "utf8");
    const counts = JSON.parse(fileContents) as CountsData;
    const rows = buildRows(counts);
    return NextResponse.json(rows);
  } catch {
    return NextResponse.json([], { status: 200 });
  }
}

