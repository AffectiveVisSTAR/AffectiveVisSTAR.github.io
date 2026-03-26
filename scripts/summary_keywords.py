#!/usr/bin/env python3
"""Extract SummaryKeywords tokens and map them to BibTex keys."""

from __future__ import annotations

import argparse
from collections import defaultdict
from pathlib import Path


def parse_summary_keywords(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = raw.split(";")
    cleaned: list[str] = []
    for part in parts:
        token = " ".join(part.strip().split())
        if token:
            cleaned.append(token)
    return cleaned


def parse_bibtex_keys(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = raw.split(";")
    return [p.strip() for p in parts if p.strip()]


def write_summary_keywords_sheet(
    sheet_url: str,
    input_sheet: str,
    output_sheet: str,
    credentials_path: Path,
    bibtex_column: str,
    keywords_column: str,
) -> None:
    try:
        import gspread  # type: ignore
    except ImportError as e:
        raise RuntimeError(
            "gspread is required. Install with: pip install gspread google-auth"
        ) from e

    gc = gspread.service_account(filename=str(credentials_path))
    sh = gc.open_by_url(sheet_url)
    ws = sh.worksheet(input_sheet)

    rows = ws.get_all_records()
    mapping: dict[str, set[str]] = defaultdict(set)
    counts: dict[str, int] = defaultdict(int)

    for row in rows:
        keywords = parse_summary_keywords(row.get(keywords_column))
        if not keywords:
            continue
        bibtex_keys = parse_bibtex_keys(row.get(bibtex_column))
        if not bibtex_keys:
            continue
        for keyword in keywords:
            mapping[keyword].update(bibtex_keys)
            counts[keyword] += 1

    output_rows = [["SummaryKeyword", "Count", "BibTexKeys"]]
    for keyword in sorted(mapping.keys()):
        keys = sorted(mapping[keyword])
        output_rows.append([keyword, counts.get(keyword, 0), "; ".join(keys)])

    try:
        out_ws = sh.worksheet(output_sheet)
    except Exception:
        out_ws = sh.add_worksheet(title=output_sheet, rows=1000, cols=26)

    out_ws.clear()
    out_ws.update(output_rows)


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Map SummaryKeywords tokens to BibTex keys and write to Google Sheet."
    )
    parser.add_argument(
        "--sheet-url",
        default="https://docs.google.com/spreadsheets/d/12yhCsrxngXPVcoLEJNJc2qBMyes83o2v8Yzh0NdDon4/edit",
        help="Google Sheet URL (default: AVSTAR sheet).",
    )
    parser.add_argument(
        "--input-sheet",
        default="classificationtable",
        help="Input worksheet name (default: classificationtable).",
    )
    parser.add_argument(
        "--output-sheet",
        default="summKeywords",
        help="Output worksheet name (default: summKeywords).",
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
        "--keywords-column",
        default="SummaryKeywords",
        help="Column name for SummaryKeywords (default: SummaryKeywords).",
    )
    args = parser.parse_args()

    write_summary_keywords_sheet(
        sheet_url=args.sheet_url.strip(),
        input_sheet=args.input_sheet.strip(),
        output_sheet=args.output_sheet.strip(),
        credentials_path=Path(args.credentials),
        bibtex_column=args.bibtex_column.strip(),
        keywords_column=args.keywords_column.strip(),
    )


if __name__ == "__main__":
    main()
