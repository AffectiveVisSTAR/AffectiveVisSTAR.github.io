import fs from "node:fs/promises";
import path from "node:path";

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

const ROOT = process.cwd();
const countsPath = path.join(ROOT, "public", "counts.json");
const outputPath = path.join(ROOT, "public", "heatmap-table.json");

const countsRaw = await fs.readFile(countsPath, "utf8");
const counts = JSON.parse(countsRaw);

const domainsFromData = Object.keys(counts);
const orderedDomains = [
  ...DOMAIN_ORDER.filter((domain) => domainsFromData.includes(domain)),
  ...domainsFromData.filter((domain) => !DOMAIN_ORDER.includes(domain)),
];

const emotionSet = new Set();
for (const domain of domainsFromData) {
  for (const emotion of Object.keys(counts[domain] ?? {})) {
    emotionSet.add(emotion);
  }
}

const emotions = Array.from(emotionSet);
const emotionTotals = new Map();
for (const emotion of emotions) {
  let total = 0;
  for (const domain of domainsFromData) {
    total += counts[domain]?.[emotion] ?? 0;
  }
  emotionTotals.set(emotion, total);
}

emotions.sort((a, b) => {
  const diff = (emotionTotals.get(b) ?? 0) - (emotionTotals.get(a) ?? 0);
  return diff !== 0 ? diff : a.localeCompare(b);
});

const rows = emotions.map((emotion) => {
  const row = { Emotion: emotion };
  for (const domain of orderedDomains) {
    row[domain] = String(counts[domain]?.[emotion] ?? 0);
  }
  return row;
});

await fs.writeFile(outputPath, `${JSON.stringify(rows, null, 2)}\n`, "utf8");
console.log(`Generated ${outputPath}`);

