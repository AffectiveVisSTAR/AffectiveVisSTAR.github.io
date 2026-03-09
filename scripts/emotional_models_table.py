#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path


from sheet_extract import SheetExtractError, extract_columns, is_url, read_dataframe


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Extract 'Emotion Model Citation', 'Emotion Model', and 'BibTex Key' "
            "from the AVSTAR supplementary Excel file into a CSV."
        )
    )
    parser.add_argument(
        "--input",
        type=str,
        default="data/AVSTAR_supplementary.xlsx",
        help=(
            "Path to the input .xlsx file, or a Google Sheets URL / CSV export URL "
            "(default: data/AVSTAR_supplementary.xlsx)."
        ),
    )
    parser.add_argument(
        "--sheet",
        type=str,
        default=None,
        help="Optional sheet name to extract from (default: auto-detect).",
    )
    parser.add_argument(
        "--gid",
        type=str,
        default=None,
        help="Optional Google Sheets gid to select a tab when using a Google Sheets URL.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("data/emotional_models.csv"),
        help="Path to the output .csv file (default: data/emotional_models.csv).",
    )
    args = parser.parse_args(argv)

    desired_columns = ["Emotion Model Citation", "Emotion Model", "BibTex Key"]
    input_value = args.input.strip()

    if is_url(input_value) and args.sheet is not None:
        print("WARNING: --sheet is ignored when --input is a URL; use --gid instead.", file=sys.stderr)

    try:
        df, source = read_dataframe(
            input_value, sheet=args.sheet, gid=args.gid, required_columns=desired_columns
        )
    except SheetExtractError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 2

    selected = extract_columns(df, desired_columns, output_columns=desired_columns)

    args.output.parent.mkdir(parents=True, exist_ok=True)
    selected.to_csv(args.output, index=False, encoding="utf-8")

    if source.kind == "excel" and source.other_matching_sheets:
        other = ", ".join(source.other_matching_sheets)
        print(
            f"WARNING: Multiple sheets matched; using '{source.sheet}'. Other matches: {other}",
            file=sys.stderr,
        )

    source_label = source.sheet or source.url or "unknown"
    print(f"Wrote {len(selected)} rows to {args.output} (source: {source_label})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
