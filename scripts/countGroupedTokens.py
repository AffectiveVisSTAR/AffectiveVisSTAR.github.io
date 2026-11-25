#!/usr/bin/env python3
"""
Count comma-separated tokens from a named column in a named Excel sheet, but ONLY for rows
where "Exclude Decision" == "corpus", and print the total token count at the end.

Steps:
1) Open an Excel file
2) Read a specific sheet by name
3) Use row 2 as the header (ignore row 1)
4) Filter to rows with 'corpus' written under column "Exclude Decision" (strict match)
5) Extract the target column (argument: column_name)
6) Split by commas and count unique tokens (no stemming/tokenization)
7) Print alphabetically: "token: count"
8) Print total count of all tokens at the end
"""

from __future__ import annotations

import argparse
from collections import Counter
from pathlib import Path
import re
from urllib.parse import quote, urlparse

import pandas as pd


def count_comma_tokens(series: pd.Series) -> Counter:
    """
    Count comma-separated tokens from a pandas Series.

    Rules:
    - Split only on commas.
    - Preserve original token text (case/punctuation unchanged).
    - Do not do stemming or further tokenization.
    - Ignore empty tokens produced by blanks like ", ,".
    - Strip only leading/trailing whitespace around each token (to avoid "sad" vs " sad").
    """
    counter: Counter = Counter()

    # Drop NaN; convert to string for safety
    for cell in series.dropna().astype(str):
        if not cell.strip():
            continue

        for tok in cell.split(","):
            tok = tok.strip()
            if tok:
                counter[tok] += 1

    return counter


def is_url(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"}


def google_sheet_csv_url(sheet_url: str, sheet_name: str) -> str:
    """
    Build a CSV export URL for a Google Sheet.

    sheet_name can be a tab name (string) or a numeric gid.
    """
    match = re.search(r"/spreadsheets/d/([a-zA-Z0-9-_]+)", sheet_url)
    if not match:
        raise ValueError("Google Sheet URL is missing the spreadsheet ID.")

    spreadsheet_id = match.group(1)
    if sheet_name.isdigit():
        sheet_param = f"gid={sheet_name}"
    else:
        sheet_param = f"sheet={quote(sheet_name)}"

    return f"https://docs.google.com/spreadsheets/d/{spreadsheet_id}/export?format=csv&{sheet_param}"


def load_dataframe(path_or_url: str, sheet_name: str, header: int) -> pd.DataFrame:
    if is_url(path_or_url):
        if "docs.google.com/spreadsheets" in path_or_url:
            csv_url = google_sheet_csv_url(path_or_url, sheet_name)
            return pd.read_csv(csv_url, header=header)
        if path_or_url.lower().endswith(".csv"):
            return pd.read_csv(path_or_url, header=header)
        return pd.read_excel(path_or_url, sheet_name=sheet_name, header=header)

    excel_path = Path(path_or_url)
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_path}")
    return pd.read_excel(excel_path, sheet_name=sheet_name, header=header)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Grouped counts of comma-separated tokens in a chosen column (corpus rows only) from a named Excel or Google Sheet."
    )
    parser.add_argument("excel_path", help="Path to Excel file or Google Sheet URL")
    parser.add_argument("sheet_name", help="Sheet name (tab) or numeric gid for Google Sheets")
    parser.add_argument("column_name", help="Name of the column to analyse")
    args = parser.parse_args()

    # Header is in row 2 => zero-based header index = 1
    df = load_dataframe(args.excel_path, args.sheet_name, header=0)

    col_name = args.column_name
    if col_name not in df.columns:
        raise KeyError(
            f"Column '{col_name}' not found in sheet '{args.sheet_name}'. "
            f"Found columns: {list(df.columns)}"
        )

    counts = count_comma_tokens(df[col_name])

    # 2) Print alphabetical list
    for token in sorted(counts.keys()):
        print(f"{token}: {counts[token]}")

    # 3) Print total count (sum of all token occurrences)
    total_count = sum(counts.values())
    print(f"TOTAL: {total_count}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
