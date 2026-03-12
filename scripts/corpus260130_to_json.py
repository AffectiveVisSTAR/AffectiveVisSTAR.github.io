#!/usr/bin/env python3

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
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
        text = value.replace("\r\n", "\n").replace("\r", "\n").replace("\n", " ")
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


def google_sheets_csv_url(sheet_url: str, sheet_name: str) -> str:
    parsed = urlparse(sheet_url)
    if "docs.google.com" not in parsed.netloc:
        raise ValueError("Only Google Sheets URLs are supported for --input-url.")

    match = re.search(r"/spreadsheets/d/([^/]+)", parsed.path)
    if not match:
        raise ValueError("Could not parse Google Sheet ID from --input-url.")

    sheet_id = match.group(1)
    # Use the worksheet title directly, so callers can pass --sheet-name.
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/gviz/tq?tqx=out:csv&sheet={sheet_name}"


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
        default="corpus260130",
        help="Worksheet title in the Google Sheet (default: corpus260130).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/corpus260130_interactivity_animation.json"),
        help="Output JSON file path (default: data/corpus260130_interactivity_animation.json).",
    )
    args = parser.parse_args(argv)

    try:
        import pandas as pd
    except ImportError as e:
        print("ERROR: pandas is required to run this script.", file=sys.stderr)
        print(f"  Details: {e}", file=sys.stderr)
        return 2

    desired_columns = ["AuthorYear",
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
                       "Various",
                       "Negative",
                       "Neutral",
                       "Positive",
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
                       "SpecificEmotionsCleaned"
                       ]

    try:
        csv_url = google_sheets_csv_url(args.input_url.strip(), args.sheet_name.strip())
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        with urllib.request.urlopen(csv_url, context=ssl_context) as response:
            csv_data = response.read().decode("utf-8")
        from io import StringIO
        df = pd.read_csv(StringIO(csv_data))
    except Exception as e:
        print(
            "ERROR: Failed to load Google Sheet as CSV. Ensure the sheet is accessible "
            "and --sheet-name is correct.",
            file=sys.stderr,
        )
        print(f"  Details: {e}", file=sys.stderr)
        return 2

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
        print(
            f"ERROR: Missing required columns: {', '.join(missing)}. "
            f"Available: {', '.join(str(c) for c in df.columns)}",
            file=sys.stderr,
        )
        return 2

    selected = df[actual_columns].copy()
    selected.columns = desired_columns
    selected = selected.where(pd.notna(selected), None)

    records = selected.to_dict(orient="records")
    records = clean_records(records)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", encoding="utf-8") as f:
        json.dump(records, f, ensure_ascii=False, indent=2)

    print(f"Wrote {len(records)} records to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
