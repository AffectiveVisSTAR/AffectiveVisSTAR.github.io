#!/usr/bin/env python3
"""
Count comma-separated tokens from multiple columns (corpus rows only) and output a 2-column table:

Requirements:
1) Grouped tokens are reported from highest count -> lowest (ties alphabetical),
   EXCEPT for a set of "pinned" tokens which must appear as individual rows at the top:
   TVCG, CGF, VIS, PacificVis, CHI (in that order, if present; if absent they still appear with 0).
2) Each row format: first column = "token (count)", second column = associated NEW KEY list.
3) All remaining tokens are collapsed into ONE final row:
   "Other: name (count), name (count), ..." in alphabetical order (names are the remaining tokens).
   The second column for "Other" lists the union of NEW KEYs associated with any "Other" tokens.

Output format: LaTeX table saved to tables/{columns_joined}.tex
"""

from __future__ import annotations

import argparse
from collections import Counter, defaultdict
from pathlib import Path
import re
from typing import Dict, List, Set, Tuple
from urllib.parse import quote, urlparse

import pandas as pd


PINNED_TOKENS = ["TVCG", "CGF", "VIS", "PacificVis", "CHI"]


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


def split_comma_tokens(cell) -> List[str]:
    """Split only on commas; strip outer whitespace; drop empties."""
    if cell is None or (isinstance(cell, float) and pd.isna(cell)):
        return []
    s = str(cell)
    if not s.strip():
        return []
    return [tok.strip() for tok in s.split(",") if tok.strip()]


def count_tokens_and_map_keys_multi(df: pd.DataFrame, column_names: List[str], keys: pd.Series) -> Tuple[Counter, Dict[str, Set[str]]]:
    """Count tokens from multiple columns, grouping them in order, and map combined token -> set of NEW KEYs."""
    counter: Counter = Counter()
    token_to_keys: Dict[str, Set[str]] = defaultdict(set)

    for idx, row in df.iterrows():
        key = keys.iloc[idx] if idx < len(keys) else None
        if pd.isna(key):
            continue

        key_str = str(key).strip()
        if not key_str:
            continue

        # Combine tokens from all specified columns in order
        combined_tokens = []
        for col_name in column_names:
            cell = row[col_name]
            tokens = split_comma_tokens(cell)
            combined_tokens.extend(tokens)
        
        # Group the combined tokens as a tuple (maintains order)
        if combined_tokens:
            combined_key = ", ".join(combined_tokens)
            counter[combined_key] += 1
            token_to_keys[combined_key].add(key_str)

    return counter, token_to_keys


def build_hierarchical_structure(df: pd.DataFrame, column_names: List[str], keys: pd.Series) -> Dict:
    """Build a nested hierarchical structure from multiple columns."""
    from collections import defaultdict
    
    def nested_dict():
        return defaultdict(nested_dict)
    
    hierarchy = nested_dict()
    
    for idx, row in df.iterrows():
        key = keys.iloc[idx] if idx < len(keys) else None
        if pd.isna(key):
            continue
        
        key_str = str(key).strip()
        if not key_str:
            continue
        
        # Navigate through hierarchy
        current = hierarchy
        path = []
        for col_name in column_names:
            cell = row[col_name]
            tokens = split_comma_tokens(cell)
            for token in tokens:
                path.append(token)
                if "_keys" not in current[token]:
                    current[token]["_keys"] = set()
                    current[token]["_count"] = 0
                current[token]["_keys"].add(key_str)
                current[token]["_count"] += 1
                current = current[token]
    
    return hierarchy


def count_leaf_rows(node: Dict, depth: int, max_depth: int) -> int:
    """Count how many leaf rows this node will generate."""
    if depth == max_depth:
        return 1
    
    total = 0
    for key, value in node.items():
        if key.startswith("_"):
            continue
        total += count_leaf_rows(value, depth + 1, max_depth)
    
    return total if total > 0 else 1


def generate_nested_rows(hierarchy: Dict, column_names: List[str], depth: int = 0, lines: List[str] = None, parent_empty_cells: str = "") -> List[str]:
    """Generate LaTeX table rows with nested structure using multirow."""
    if lines is None:
        lines = []
    
    max_depth = len(column_names)
    
    # Sort items by count (desc) then alphabetically
    items = []
    for key, value in hierarchy.items():
        if key.startswith("_"):
            continue
        count = value.get("_count", 0)
        items.append((key, count, value))
    
    items.sort(key=lambda x: (-x[1], x[0]))
    
    for i, (token, count, subnode) in enumerate(items):
        keys = sorted(subnode.get("_keys", set()))
        keys_str = ", ".join([k for k in keys])
        
        # Count how many rows this node spans
        row_span = count_leaf_rows(subnode, depth + 1, max_depth)
        is_last_sibling = (i == len(items) - 1)
        
        # Start a new row (except for the first item when we're continuing from parent)
        if i > 0 or depth == 0:
            lines.append(parent_empty_cells)
        
        # Add this level's content
        if depth == max_depth - 1:
            # Last column - complete the row with keys
            # Add hline only if this is the last sibling
            hline = " \\hline" if is_last_sibling else ""
            lines[-1] += f"{token} ({count}) & \\ref{{{keys_str}}} \\\\{hline}"
        else:
            # Not last column
            if row_span > 1:
                lines[-1] += f"\\multirow{{{row_span}}}{{*}}{{{token} ({count})}} & "
            else:
                lines[-1] += f"{token} ({count}) & "
            
            # Check if we have children
            has_children = any(not k.startswith("_") for k in subnode.keys())
            if has_children:
                # Prepare empty cells for children rows (this level will be empty)
                new_parent_empty = parent_empty_cells + "& "
                generate_nested_rows(subnode, column_names, depth + 1, lines, new_parent_empty)
            else:
                # No children but not at leaf level - fill remaining columns with empty cells
                # Add hline only if this is the last sibling
                hline = " \\hline" if is_last_sibling else ""
                empty_cols = max_depth - depth - 2
                if empty_cols > 0:
                    lines[-1] += "& " * empty_cols
                lines[-1] += f"& {keys_str} \\\\{hline}"
    
    return lines


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Count comma-separated tokens from multiple columns (corpus rows only), with nested row structure. Supports Excel or Google Sheets."
    )
    parser.add_argument("excel_path", help="Path to Excel file or Google Sheet URL")
    parser.add_argument("sheet_name", help="Sheet name (tab) or numeric gid for Google Sheets")
    parser.add_argument("column_names", nargs="+", help="Names of columns to analyse (tokenized by commas), values grouped in order")
    args = parser.parse_args()

    df = load_dataframe(args.excel_path, args.sheet_name, header=1)

    required_cols = ["Exclude Decision", "BibTex Key"] + args.column_names
    missing = [c for c in required_cols if c not in df.columns]
    if missing:
        raise KeyError(f"Missing required column(s): {missing}. Found columns: {list(df.columns)}")

    # Corpus filter (strict match)
    mask = df["Exclude Decision"].astype(str).str.strip().str.lower().eq("corpus")
    df = df.loc[mask].copy()

    # Prepare output filename
    tables_dir = Path("tables")
    tables_dir.mkdir(exist_ok=True)
    columns_joined = "_".join(args.column_names)
    output_file = tables_dir / f"{columns_joined}.tex"
    
    # Build LaTeX table
    lines = []
    
    # Determine number of columns
    num_cols = len(args.column_names) + 1  # +1 for Papers in Corpus
    col_spec = "|".join(["l"] * num_cols)
    col_spec = "|" + col_spec + "|"
    lines.append(f"\\begin{{tabular}}{{{col_spec}}}")
    lines.append("\\toprule")
    
    # Header row
    header_cols = args.column_names + ["Papers in Corpus"]
    lines.append(" & ".join(header_cols) + " \\\\")
    lines.append("\\midrule")

    if len(args.column_names) == 1:
        # Single column - use simple structure
        counts, token_to_keys = count_tokens_and_map_keys_multi(df, args.column_names, df["BibTex Key"])
        
        if args.column_names[0] == "Journal":
            # Apply pinned token approach
            for tok in PINNED_TOKENS:
                cnt = int(counts.get(tok, 0))
                keys = sorted(token_to_keys.get(tok, set()))
                keys_str = ", ".join([k for k in keys])
                lines.append(f"{tok} ({cnt}) & {keys_str} \\\\ \\hline")

            remaining = [t for t in counts.keys() if t not in PINNED_TOKENS]
            remaining_alpha = sorted(remaining)

            other_label_parts = [f"{t} ({int(counts[t])})" for t in remaining_alpha]
            other_label = "Other"
            if other_label_parts:
                other_label += ": " + ", ".join(other_label_parts)

            other_keys: Set[str] = set()
            for t in remaining:
                other_keys.update(token_to_keys.get(t, set()))
            other_keys_list = sorted(other_keys)
            other_keys_str = ", ".join([k for k in other_keys_list])

            lines.append(f"{other_label} & {other_keys_str} \\\\ \\hline")
        else:
            sorted_tokens = sorted(counts.items(), key=lambda x: (-x[1], x[0]))
            for token, cnt in sorted_tokens:
                keys = sorted(token_to_keys.get(token, set()))
                keys_str = ", ".join([k for k in keys])
                lines.append(f"{token} ({int(cnt)}) & {keys_str} \\\\ \\hline")
    else:
        # Multiple columns - use nested structure
        hierarchy = build_hierarchical_structure(df, args.column_names, df["BibTex Key"])
        generate_nested_rows(hierarchy, args.column_names, 0, lines, "")

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
