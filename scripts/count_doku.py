#!/usr/bin/env python3
"""Count SpecificEmotionsCleaned per application domain."""

from __future__ import annotations

import argparse
import csv
import json
import re
import ssl
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path
from urllib.parse import urlparse
import certifi

DOMAINS = [
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
]

NO_DOMAIN_LABEL = "(No domain)"


def parse_emotions(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = [p.strip() for p in raw.split(",")]
    return [p for p in parts if p]


def load_rows(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"Expected a list in {path}, got {type(data).__name__}")
    return data


def google_sheets_export_csv_url(sheet_url: str, gid: str) -> str:
    parsed = urlparse(sheet_url)
    if "docs.google.com" not in parsed.netloc:
        raise ValueError("Only Google Sheets URLs are supported for --input-url.")

    match = re.search(r"/spreadsheets/d/([^/]+)", parsed.path)
    if not match:
        raise ValueError("Could not parse Google Sheet ID from --input-url.")

    sheet_id = match.group(1)
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={gid}"


def load_rows_from_sheet(sheet_url: str, gid: str) -> list[dict]:
    csv_url = google_sheets_export_csv_url(sheet_url, gid)
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(csv_url, context=ssl_context) as response:
        csv_data = response.read().decode("utf-8")
    reader = csv.DictReader(csv_data.splitlines())
    return list(reader)


def build_counts(rows: list[dict]) -> dict[str, Counter]:
    counts: dict[str, Counter] = defaultdict(Counter)
    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue
        domains = [d for d in DOMAINS if row.get(d) == "X"]
        if not domains:
            domains = [NO_DOMAIN_LABEL]
        for domain in domains:
            counts[domain].update(emotions)
    return counts


def build_emotion_counts(rows: list[dict]) -> Counter:
    counts: Counter = Counter()
    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue
        counts.update(emotions)
    return counts


def parse_bibtex_keys(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = re.split(r"[;,]", raw)
    return [p.strip() for p in parts if p.strip()]


def build_emotion_bibtex_map(rows: list[dict], bibtex_column: str) -> dict[str, set[str]]:
    mapping: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue
        keys = parse_bibtex_keys(row.get(bibtex_column))
        if not keys:
            continue
        for emotion in emotions:
            mapping[emotion].update(keys)
    return mapping


def parse_emotion_model_citations(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = re.split(r"[;,]", raw)
    cleaned: list[str] = []
    for part in parts:
        token = " ".join(part.strip().split())
        if token:
            cleaned.append(token)
    return cleaned


def build_emotion_citation_map(rows: list[dict], citation_column: str) -> dict[str, set[str]]:
    mapping: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue
        citations = parse_emotion_model_citations(row.get(citation_column))
        citations = list(dict.fromkeys(citations))
        if not citations:
            continue
        for emotion in emotions:
            mapping[emotion].update(citations)
    return mapping


def parse_domain_app_tokens(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = re.split(r"[;,]", raw)
    cleaned: list[str] = []
    for part in parts:
        token = " ".join(part.strip().split())
        if token:
            cleaned.append(token)
    return cleaned


def build_emotion_domainapp_map(rows: list[dict], domainapp_column: str) -> dict[str, set[str]]:
    mapping: dict[str, set[str]] = defaultdict(set)
    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue
        domains = parse_domain_app_tokens(row.get(domainapp_column))
        domains = list(dict.fromkeys(domains))
        if not domains:
            continue
        for emotion in emotions:
            mapping[emotion].update(domains)
    return mapping


def build_emotion_model_tokens(
    rows: list[dict], emotion_model_column: str
) -> tuple[dict[str, set[str]], list[str]]:
    mapping: dict[str, set[str]] = defaultdict(set)
    all_tokens: set[str] = set()
    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue
        tokens = parse_emotion_model_citations(row.get(emotion_model_column))
        tokens = list(dict.fromkeys(tokens))
        if not tokens:
            continue
        for token in tokens:
            all_tokens.add(token)
        for emotion in emotions:
            mapping[emotion].update(tokens)
    return mapping, sorted(all_tokens)


def write_emotion_mapping_csv(
    emotion_models: dict[str, set[str]], tokens: list[str], output_path: Path
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Emotion", *tokens])
        for emotion in sorted(emotion_models.keys()):
            present = emotion_models.get(emotion, set())
            row = [emotion]
            for token in tokens:
                row.append("X" if token in present else "")
            writer.writerow(row)


def write_csv_to_google_sheet(
    csv_path: Path,
    sheet_url: str,
    worksheet_name: str,
    credentials_path: Path,
) -> None:
    try:
        import gspread  # type: ignore
    except ImportError as e:
        raise RuntimeError(
            "gspread is required for --write-sheet. Install with: pip install gspread google-auth"
        ) from e

    gc = gspread.service_account(filename=str(credentials_path))
    sh = gc.open_by_url(sheet_url)
    try:
        ws = sh.worksheet(worksheet_name)
    except Exception:
        ws = sh.add_worksheet(title=worksheet_name, rows=1000, cols=26)

    with csv_path.open("r", encoding="utf-8") as f:
        reader = csv.reader(f)
        values = list(reader)

    ws.clear()
    ws.update(values)


def write_emotion_counts_csv(
    counts: Counter,
    bibtex_map: dict[str, set[str]],
    citation_map: dict[str, set[str]],
    domainapp_map: dict[str, set[str]],
    output_path: Path,
) -> None:
    output_path.parent.mkdir(parents=True, exist_ok=True)
    with output_path.open("w", encoding="utf-8", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["Emotion", "Count", "BibTexKeys", "EmotionModel", "DomainApp"])
        for emotion, count in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0])):
            keys = sorted(bibtex_map.get(emotion, set()))
            citations = sorted(citation_map.get(emotion, set()))
            domains = sorted(domainapp_map.get(emotion, set()))
            writer.writerow([emotion, count, "; ".join(keys), "; ".join(citations), "; ".join(domains)])


def print_report(counts: dict[str, Counter]) -> None:
    domain_order = [d for d in DOMAINS if d in counts]
    if NO_DOMAIN_LABEL in counts:
        domain_order.append(NO_DOMAIN_LABEL)

    for domain in domain_order:
        counter = counts[domain]
        total = sum(counter.values())
        print(f"{domain} (total {total})")
        for emotion, count in sorted(counter.items(), key=lambda kv: (-kv[1], kv[0])):
            print(f"  {emotion}: {count}")
        print("")


def main() -> None:
    parser = argparse.ArgumentParser(description="Count emotions per application domain")
    parser.add_argument(
        "--input",
        default="public/classtable.json",
        help="Path to classtable.json (default: public/classtable.json)",
    )
    parser.add_argument(
        "--input-url",
        default="https://docs.google.com/spreadsheets/d/12yhCsrxngXPVcoLEJNJc2qBMyes83o2v8Yzh0NdDon4/edit?gid=1416168823#gid=1416168823",
        help="Google Sheets URL (default: AVSTAR sheet).",
    )
    parser.add_argument(
        "--gid",
        default="1416168823",
        help="Google Sheets gid (default: 1416168823).",
    )
    parser.add_argument(
        "--output",
        default="public/counts.json",
        help="Path to write counts JSON (default: public/counts.json)",
    )
    parser.add_argument(
        "--emotion-csv",
        default="public/emotion_bibtex_keys.csv",
        help="Path to write emotion token counts CSV (default: public/emotion_bibtex_keys.csv).",
    )
    parser.add_argument(
        "--emotion-mapping-csv",
        default="public/emotion_mapping.csv",
        help="Path to write emotion -> EmotionModel mapping CSV (default: public/emotion_mapping.csv).",
    )
    parser.add_argument(
        "--write-sheet",
        action="store_true",
        help="Write emotion_bibtex_keys.csv back to a Google Sheet worksheet.",
    )
    parser.add_argument(
        "--output-sheet-url",
        default="https://docs.google.com/spreadsheets/d/12yhCsrxngXPVcoLEJNJc2qBMyes83o2v8Yzh0NdDon4/edit",
        help="Google Sheet URL to write to (default: AVSTAR sheet).",
    )
    parser.add_argument(
        "--output-worksheet",
        default="Sheet20",
        help="Worksheet name to write to (default: Sheet20).",
    )
    parser.add_argument(
        "--credentials",
        default="/Users/roxanneziman/Documents/AVSTAR/affectivevisstar-09cf23032036.json",
        help="Path to Google service account JSON credentials.",
    )
    parser.add_argument(
        "--bibtex-column",
        default="BibTex Key",
        help="Column name for BibTex keys (default: BibTex Key).",
    )
    parser.add_argument(
        "--emotion-model-citation-column",
        default="EmotionModel",
        help="Column name for EmotionModel (default: EmotionModel).",
    )
    parser.add_argument(
        "--domainapp-column",
        default="DomainApp",
        help="Column name for DomainApp (default: DomainApp).",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print output as JSON (domain -> emotion -> count)",
    )
    args = parser.parse_args()

    if args.input_url:
        rows = load_rows_from_sheet(args.input_url.strip(), args.gid.strip())
    else:
        rows = load_rows(Path(args.input))
    counts = build_counts(rows)

    output = {domain: dict(counter) for domain, counter in counts.items()}
    with Path(args.output).open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    emotion_counts = build_emotion_counts(rows)
    emotion_bibtex = build_emotion_bibtex_map(rows, args.bibtex_column)
    emotion_citations = build_emotion_citation_map(rows, args.emotion_model_citation_column)
    emotion_domainapps = build_emotion_domainapp_map(rows, args.domainapp_column)
    emotion_models, emotion_model_tokens = build_emotion_model_tokens(
        rows, args.emotion_model_citation_column
    )
    write_emotion_counts_csv(
        emotion_counts,
        emotion_bibtex,
        emotion_citations,
        emotion_domainapps,
        Path(args.emotion_csv),
    )
    write_emotion_mapping_csv(
        emotion_models, emotion_model_tokens, Path(args.emotion_mapping_csv)
    )

    if args.write_sheet:
        write_csv_to_google_sheet(
            Path(args.emotion_csv),
            args.output_sheet_url.strip(),
            args.output_worksheet.strip(),
            Path(args.credentials),
        )

    if args.json:
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        print_report(counts)


if __name__ == "__main__":
    main()
