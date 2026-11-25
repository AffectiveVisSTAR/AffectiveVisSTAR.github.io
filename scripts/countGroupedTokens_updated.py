#!/usr/bin/env python3
"""
Count comma-separated tokens from a named column (corpus rows only) and output a 2-column table:

Requirements:
1) Grouped tokens are reported from highest count -> lowest (ties alphabetical),
   EXCEPT for a set of "pinned" tokens which must appear as individual rows at the top:
   TVCG, CGF, VIS, PacificVis, CHI (in that order, if present; if absent they still appear with 0).
2) Each row format: first column = "token (count)", second column = associated NEW KEY list.
3) All remaining tokens are collapsed into ONE final row:
   "Other: name (count), name (count), ..." in alphabetical order (names are the remaining tokens).
   The second column for "Other" lists the union of NEW KEYs associated with any "Other" tokens.

Output format: TSV (tab-separated), so it drops cleanly into spreadsheets and is easy to parse.
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from pathlib import Path
from typing import Dict, List, Set, Tuple

import pandas as pd


PINNED_TOKENS = ["TVCG", "CGF", "VIS", "PacificVis", "CHI"]


def split_comma_tokens(cell) -> List[str]:
    """Split only on commas; strip outer whitespace; drop empties."""
    if cell is None or (isinstance(cell, float) and pd.isna(cell)):
        return []
    s = str(cell)
    if not s.strip():
        return []
    return [tok.strip() for tok in s.split(",") if tok.strip()]


def count_tokens_and_map_keys(series: pd.Series, keys: pd.Series) -> Tuple[Counter, Dict[str, Set[str]]]:
    """Count tokens and map token -> set of NEW KEYs."""
    counter: Counter = Counter()
    token_to_keys: Dict[str, Set[str]] = defaultdict(set)

    for cell, key in zip(series, keys):
        if pd.isna(cell) or pd.isna(key):
            continue

        key_str = str(key).strip()
        if not key_str:
            continue

        for tok in split_comma_tokens(cell):
            counter[tok] += 1
            token_to_keys[tok].add(key_str)

    return counter, token_to_keys


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Count comma-separated tokens in a column (corpus rows only), print pinned rows + an 'Other' row."
    )
    parser.add_argument("excel_path", help="Path to the Excel file (.xlsx, .xlsm, etc.)")
    parser.add_argument("sheet_name", help="Name of the sheet to read")
    parser.add_argument("column_name", help="Name of the column to analyse (tokenized by commas)")
    args = parser.parse_args()

    excel_path = Path(args.excel_path)
    if not excel_path.exists():
        raise FileNotFoundError(f"Excel file not found: {excel_path}")

    df = pd.read_excel(excel_path, sheet_name=args.sheet_name, header=1)

    required_cols = ["Exclude Decision", "BibTex Key", args.column_name]
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise KeyError(f"Missing required column(s): {missing}. Found columns: {list(df.columns)}")

    # Corpus filter (strict match)
    mask = df["Exclude Decision"].astype(str).str.strip().str.lower().eq("corpus")
    df = df.loc[mask].copy()

    counts, token_to_keys = count_tokens_and_map_keys(df[args.column_name], df["BibTex Key"])

    # Prepare output filename
    tables_dir = Path("tables")
    tables_dir.mkdir(exist_ok=True)
    output_file = tables_dir / f"{args.column_name}.tex"
    
    # Build LaTeX table
    lines = []
    lines.append("\\begin{tabular}{ll}")
    lines.append("\\toprule")
    lines.append(f"{args.column_name} (count) & Papers in Corpus \\\\")
    lines.append("\\midrule")

    # --- Apply pinned token approach only for Journal column ---
    if args.column_name == "Journal":
        # --- Pinned rows at top, in the specified order ---
        for tok in PINNED_TOKENS:
            cnt = int(counts.get(tok, 0))
            keys = sorted(token_to_keys.get(tok, set()))
            keys_str = ", ".join([f"{{{k}}}" for k in keys])
            lines.append(f"{tok} ({cnt}) & {keys_str} \\\\")

        # --- Collapse remaining tokens into "Other" ---
        remaining = [t for t in counts.keys() if t not in PINNED_TOKENS]

        # Order remaining tokens by count desc (ties alpha) for grouping requirement,
        # but the "Other: name (#), ..." string must be alphabetical per your spec.
        # So: counts ordering governs *which tokens are "remaining"*, while display is alphabetical.
        remaining_alpha = sorted(remaining)

        other_label_parts = [f"{t} ({int(counts[t])})" for t in remaining_alpha]
        other_label = "Other"
        if other_label_parts:
            other_label += ": " + ", ".join(other_label_parts)

        other_keys: Set[str] = set()
        for t in remaining:
            other_keys.update(token_to_keys.get(t, set()))
        other_keys_list = sorted(other_keys)
        other_keys_str = ", ".join([f"{{{k}}}" for k in other_keys_list])

        # If there are no remaining tokens, still emit an Other row (empty)
        lines.append(f"{other_label} & {other_keys_str} \\\\")
    else:
        # For other columns, just output all tokens sorted by count (desc), then alphabetically
        sorted_tokens = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
        for token, cnt in sorted_tokens:
            keys = sorted(token_to_keys.get(token, set()))
            keys_str = ", ".join([k for k in keys])
            lines.append(f"{token} ({int(cnt)}) & \\ref{{{keys_str}}} \\\\")

    lines.append("\\bottomrule")
    lines.append("\\end{tabular}")
    
    # Print to stdout
    for line in lines:
        print(line)
    
    # Save to file
    output_file.write_text("\n".join(lines) + "\n")
    print(f"\n% Saved to {output_file}", file=__import__('sys').stderr)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
