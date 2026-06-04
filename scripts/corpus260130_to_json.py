#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
from collections import Counter, defaultdict
from io import StringIO
from pathlib import Path
from typing import Any
from urllib.parse import urlparse
import ssl
import certifi
import urllib.request


def normalize_col_name(name: object) -> str:
    if name is None:
        return ""
    return " ".join(str(name).strip().lower().split())


def clean_cell_value(value: object) -> object:
    if value is None:
        return value
    if isinstance(value, str):
        text = value.replace("\r\n", "\n").replace(
            "\r", "\n").replace("\n", " ")
        text = " ".join(text.split())
        return text or None
    return value


def clean_records(records: list[dict[str, object]]) -> list[dict[str, object]]:
    cleaned: list[dict[str, object]] = []
    for row in records:
        normalized_row = {k: clean_cell_value(v) for k, v in row.items()}
        if all(v in (None, "") for v in normalized_row.values()):
            continue
        cleaned.append(normalized_row)
    return cleaned


def select_sheet_columns(
    df: Any,
    desired_columns: list[str],
) -> tuple[Any | None, list[str]]:
    norm_to_actual: dict[str, str] = {}
    for col in list(df.columns):
        norm = normalize_col_name(col)
        if norm and norm not in norm_to_actual:
            norm_to_actual[norm] = str(col)

    missing: list[str] = []
    actual_columns: list[str] = []
    for desired in desired_columns:
        actual = norm_to_actual.get(normalize_col_name(desired))
        if actual is None:
            missing.append(desired)
        else:
            actual_columns.append(actual)

    if missing:
        return None, missing

    selected = df[actual_columns].copy()
    selected.columns = desired_columns
    return selected, []


def parse_multi_value_cell(value: object) -> list[str]:
    if value is None:
        return []
    if isinstance(value, float) and value != value:
        return []

    text = str(value).strip()
    if not text:
        return []

    parts = [part.strip() for part in text.split(",")]
    cleaned: list[str] = []
    seen_norm: set[str] = set()

    for part in parts:
        token = " ".join(part.split())
        if not token:
            continue
        norm = normalize_col_name(token)
        if not norm or norm in seen_norm:
            continue
        seen_norm.add(norm)
        cleaned.append(token)

    return cleaned


def google_sheets_csv_url(sheet_url: str, sheet_name: str) -> str:
    parsed = urlparse(sheet_url)
    if "docs.google.com" not in parsed.netloc:
        raise ValueError(
            "Only Google Sheets URLs are supported for --input-url.")

    match = re.search(r"/spreadsheets/d/([^/]+)", parsed.path)
    if not match:
        raise ValueError("Could not parse Google Sheet ID from --input-url.")

    sheet_id = match.group(1)
    # Use the worksheet title directly, so callers can pass --sheet-name.
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"


def load_google_sheet_csv(sheet_url: str, sheet_name: str, pd: Any) -> Any:
    csv_url = google_sheets_csv_url(sheet_url.strip(), sheet_name.strip())
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(csv_url, context=ssl_context) as response:
        csv_data = response.read().decode("utf-8")
    return pd.read_csv(StringIO(csv_data))


def get_actual_column(df: Any, candidates: list[str]) -> str | None:
    norm_to_actual: dict[str, str] = {}
    for col in list(df.columns):
        norm = normalize_col_name(col)
        if norm and norm not in norm_to_actual:
            norm_to_actual[norm] = str(col)

    for candidate in candidates:
        actual = norm_to_actual.get(normalize_col_name(candidate))
        if actual is not None:
            return actual
    return None


def load_emotion_assignments(
    sheet_url: str,
    sheet_name: str,
    pd: Any,
) -> dict[str, dict[str, str]]:
    df = load_google_sheet_csv(sheet_url, sheet_name, pd)
    emotion_column = get_actual_column(
        df,
        ["Emotion", "Specific Emotion", "SpecificEmotionsCleaned", "name"],
    )
    basic_column = get_actual_column(df, ["Basic Emotion"])
    valence_column = get_actual_column(df, ["Valence Category"])

    missing = [
        label
        for label, column in [
            ("Emotion", emotion_column),
            ("Basic Emotion", basic_column),
            ("Valence Category", valence_column),
        ]
        if column is None
    ]
    if missing:
        raise ValueError(
            f"Missing required emotionmapping columns: {', '.join(missing)}. "
            f"Available: {', '.join(str(c) for c in df.columns)}"
        )

    assignments: dict[str, dict[str, str]] = {}
    for _, row in df.iterrows():
        emotion = clean_cell_value(row.get(emotion_column))
        if not isinstance(emotion, str) or not emotion:
            continue

        basic_emotion = clean_cell_value(row.get(basic_column))
        valence_category = clean_cell_value(row.get(valence_column))
        assignments[normalize_col_name(emotion)] = {
            "Basic Emotion": basic_emotion if isinstance(basic_emotion, str) else "",
            "Valence Category": valence_category if isinstance(valence_category, str) else "",
        }

    return assignments


def build_emotions_by_everything(
    records: list[dict[str, object]],
    emotion_assignments: dict[str, dict[str, str]],
) -> list[dict[str, object]]:
    grouped: dict[str, Counter[str]] = defaultdict(Counter)
    publications: dict[str, list[str]] = defaultdict(list)
    seen_publication: dict[str, set[str]] = defaultdict(set)

    for row in records:
        emotions = parse_multi_value_cell(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue

        author = row.get("AuthorYear")
        for emotion in emotions:
            if author and isinstance(author, str) and author not in seen_publication[emotion]:
                publications[emotion].append(author)
                seen_publication[emotion].add(author)

            for key, value in row.items():
                if key == "SpecificEmotionsCleaned":
                    continue
                if value == "X":
                    grouped[emotion][key] += 1

    rows: list[dict[str, object]] = []
    for emotion, counter in grouped.items():
        assignments = emotion_assignments.get(normalize_col_name(emotion), {})
        rows.append(
            {
                "name": emotion,
                "Basic Emotion": assignments.get("Basic Emotion", ""),
                "Valence Category": assignments.get("Valence Category", ""),
                "publications": publications[emotion],
                **dict(counter),
            }
        )
    return add_valence_aggregate_rows(rows)


def add_valence_aggregate_rows(rows: list[dict[str, object]]) -> list[dict[str, object]]:
    aggregates: dict[str, Counter[str]] = defaultdict(Counter)
    grouped_rows: dict[str, list[dict[str, object]]] = defaultdict(list)
    publication_sets: dict[str, set[str]] = defaultdict(set)

    for row in rows:
        valence_category = row.get("Valence Category")
        if not isinstance(valence_category, str) or not valence_category:
            continue

        grouped_rows[valence_category].append(row)

        publications = row.get("publications")
        if isinstance(publications, list):
            for publication in publications:
                if isinstance(publication, str):
                    publication_sets[valence_category].add(publication)

        for key, value in row.items():
            if isinstance(value, int):
                aggregates[valence_category][key] += value

    output_rows: list[dict[str, object]] = []
    for valence_category, category_rows in grouped_rows.items():
        output_rows.append(
            {
                "name": valence_category,
                "Basic Emotion": "Aggregate",
                "Valence Category": valence_category,
                "publications": sorted(publication_sets[valence_category]),
                "isAggregate": "X",
                **dict(aggregates[valence_category]),
            }
        )
        output_rows.extend(category_rows)

    return output_rows


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Read a Google Sheet tab and export selected columns as JSON records "
            "into the data folder."
        )
    )
    parser.add_argument(
        "--input-url",
        type=str,
        default=(
            "https://docs.google.com/spreadsheets/d/"
            "12yhCsrxngXPVcoLEJNJc2qBMyes83o2v8Yzh0NdDon4/edit?gid=457985371"
        ),
        help="Google Sheets URL.",
    )
    parser.add_argument(
        "--sheet-name",
        type=str,
        default="classificationtable",
        help="Worksheet title in the Google Sheet (default: classificationtable).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("public/classtable.json"),
        help="Output JSON file path (default: public/classtable.json).",
    )
    parser.add_argument(
        "--output-column-mapping",
        type=Path,
        default=Path("public/classtable_column_mapping.json"),
        help=(
            "Output JSON file path for generated table group mappings "
            "(default: public/classtable_column_mapping.json)."
        ),
    )
    parser.add_argument(
        "--emotion-mapping-sheet-name",
        type=str,
        default="emotionmapping",
        help="Worksheet title containing emotion assignments (default: emotionmapping).",
    )
    parser.add_argument(
        "--output-emotions-by-everything",
        type=Path,
        default=Path("public/emotions_by_everything.json"),
        help=(
            "Output JSON file path for grouped emotion counts "
            "(default: public/emotions_by_everything.json)."
        ),
    )
    parser.add_argument(
        "--output-metadata",
        type=Path,
        default=Path("public/classtable_metadata.json"),
        help=(
            "Output JSON file path for publication metadata records "
            "(default: public/classtable_metadata.json)."
        ),
    )
    args = parser.parse_args(argv)

    try:
        import pandas as pd
    except ImportError as e:
        print("ERROR: pandas is required to run this script.", file=sys.stderr)
        print(f"  Details: {e}", file=sys.stderr)
        return 2

    desired_columns = ["AuthorYear",
                       "Year",
                       "Paper Nickname",
                       "Agnostic",
                       "Medicine",
                       "Public Health",
                       "Social/Civic",
                       "Business/Industry",
                       "Climate",
                       "Science Education",
                       "Journalism",
                       "Culture/Humanities",
                       "Diverse",
                       "Information Receptivity",
                       "Engagement",
                       "Enjoyment",
                       "Comprehension",
                       "Recall",
                       "Sense-Making",
                       "Interpretation",
                       "Trust",
                       "Empathy",
                       "Persuasion (Attitude or Behaviour Change, Nudging)",
                       "Decision-Making",
                       "Negative",
                       "Neutral",
                       "Positive",
                       "SpecificEmotionsCleaned",
                       "Chart",
                       "Graph",
                       "Tree",
                       "Set",
                       "Map",
                       "Pictograph",
                       "Word Cloud",
                       "Image",
                       "Scientific Illustration",
                       "Video",
                       "Infographic",
                       "Dashboard",
                       "Multiple",
                       "Interactivity",
                       "Animation",
                       "Real-World",
                       "Synthetic",
                       "Vis Source In-the-Wild",
                       "Vis Source Custom",
                       "Topic",
                       "Vis Type",
                       "Design Element",
                       "Visual Style/Embellishment",
                       "Narrative Element",
                       "Interaction",
                       "Presentation Format",
                       "In-the-Wild Examples",
                       "Affective Priming/Elicitation",
                       "Quantitative",
                       "Qualitative",
                       "Mixed",
                       "Custom Questionnaire",
                       "Adapted Questionnaire",
                       "Semi-structured Interview",
                       "Short Interview",
                       "Affective Slider/Self-Assessment Manikin",
                       "Geneva Emotion Wheel",
                       "PANAS",
                       "VLAT",
                       "Observation",
                       "Think Aloud",
                       "Diary Study",
                       "Eye-tracking",
                       "Facial expression recognition",
                       "Biometric",
                       "Workshop",
                       "Other validated psychology measure",
                       ]

    metadata_columns = [
        "AuthorYear",
        "Title",
        "Year",
        "Journal",
        "Country",
        "Abstract",
        "DomainApp",
        "DOI",
        "BibTex Key",
    ]

    columns_to_process = [
     #  {
     #       "origName": "ElementsKeywords",
     #       "name": "Element Studied",
     #       "color": "#fb8072",
     #       "superGroupName": "Element Sensemaking",
     #       "superGroupColor": "#80b1d3",
     #   }
    ]

    try:
        df = load_google_sheet_csv(args.input_url, args.sheet_name, pd)
    except Exception as e:
        print(
            "ERROR: Failed to load Google Sheet as CSV. Ensure the sheet is accessible "
            "and --sheet-name is correct.",
            file=sys.stderr,
        )
        print(f"  Details: {e}", file=sys.stderr)
        return 2

    try:
        emotion_assignments = load_emotion_assignments(
            args.input_url,
            args.emotion_mapping_sheet_name,
            pd,
        )
    except Exception as e:
        print(
            "ERROR: Failed to load emotion assignments. Ensure the emotionmapping "
            "sheet is accessible and contains Emotion, Basic Emotion, and Valence "
            "Category columns.",
            file=sys.stderr,
        )
        print(f"  Details: {e}", file=sys.stderr)
        return 2

    norm_to_actual: dict[str, str] = {}
    for col in list(df.columns):
        norm = normalize_col_name(col)
        if norm and norm not in norm_to_actual:
            norm_to_actual[norm] = str(col)

    selected, missing = select_sheet_columns(df, desired_columns)

    if missing:
        print(
            f"ERROR: Missing required columns: {', '.join(missing)}. "
            f"Available: {', '.join(str(c) for c in df.columns)}",
            file=sys.stderr,
        )
        return 2

    metadata_selected, metadata_missing = select_sheet_columns(df, metadata_columns)
    if metadata_missing:
        print(
            f"ERROR: Missing required metadata columns: {', '.join(metadata_missing)}. "
            f"Available: {', '.join(str(c) for c in df.columns)}",
            file=sys.stderr,
        )
        return 2

    # Expand special "multi value" columns into one-hot "X" columns and
    # emit a mapping JSON describing these generated groups for the table UI.
    generated_group_mappings: list[dict[str, object]] = []
    for spec in columns_to_process:
        orig_name = str(spec.get("origName", "")).strip()
        if not orig_name:
            continue

        actual = norm_to_actual.get(normalize_col_name(orig_name))
        if actual is None:
            continue

        token_by_norm: dict[str, str] = {}
        row_tokens: list[set[str]] = []

        for _, row in df[[actual]].iterrows():
            tokens_norm: set[str] = set()
            for token in parse_multi_value_cell(row.get(actual)):
                norm = normalize_col_name(token)
                if norm not in token_by_norm:
                    token_by_norm[norm] = token
                tokens_norm.add(norm)
            row_tokens.append(tokens_norm)

        for token in token_by_norm.values():
            if token not in selected.columns:
                selected[token] = None

        for row_idx, tokens_norm in enumerate(row_tokens):
            for token_norm in tokens_norm:
                token_column = token_by_norm[token_norm]
                selected.at[row_idx, token_column] = "X"

        generated_group_mappings.append(
            {
                "origName": orig_name,
                "name": str(spec.get("name", orig_name)),
                "color": str(spec.get("color", "#999999")),
                "superGroupName": str(spec.get("superGroupName", "")),
                "superGroupColor": str(spec.get("superGroupColor", "")),
                "columns": [
                    {"dataKey": token, "filterType": "feature"}
                    for token in token_by_norm.values()
                ],
            }
        )

    selected = selected.where(pd.notna(selected), None)
    metadata_selected = metadata_selected.where(pd.notna(metadata_selected), None)

    records = selected.to_dict(orient="records")
    records = clean_records(records)

    metadata_records = metadata_selected.to_dict(orient="records")
    metadata_records = clean_records(metadata_records)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    args.output_column_mapping.parent.mkdir(parents=True, exist_ok=True)
    with args.output_column_mapping.open("w", encoding="utf-8") as f:
        json.dump(generated_group_mappings, f, ensure_ascii=False, indent=2)

    args.output_metadata.parent.mkdir(parents=True, exist_ok=True)
    with args.output_metadata.open("w", encoding="utf-8") as f:
        json.dump(metadata_records, f, ensure_ascii=False, indent=2)

    emotions_by_everything = build_emotions_by_everything(records, emotion_assignments)
    args.output_emotions_by_everything.parent.mkdir(parents=True, exist_ok=True)
    with args.output_emotions_by_everything.open("w", encoding="utf-8") as f:
        json.dump(emotions_by_everything, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(records)} records to {args.output}")
    print(
        f"Wrote {len(generated_group_mappings)} generated group mappings to "
        f"{args.output_column_mapping}"
    )
    print(f"Wrote {len(metadata_records)} metadata records to {args.output_metadata}")
    print(
        f"Wrote {len(emotions_by_everything)} grouped emotion records to "
        f"{args.output_emotions_by_everything}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
