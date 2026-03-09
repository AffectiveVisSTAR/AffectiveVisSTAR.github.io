#!/usr/bin/env python3

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path


def _normalize_col(name: object) -> str:
    if name is None:
        return ""
    return " ".join(str(name).strip().lower().split())


def _escape_latex(text: str) -> str:
    replacements = {
        "\\": r"\textbackslash{}",
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\textasciicircum{}",
    }
    return "".join(replacements.get(ch, ch) for ch in text)


def _parse_csv_list(value: str | None) -> list[str]:
    if value is None:
        return []
    return [part.strip() for part in value.split(",") if part.strip()]


def _parse_rename(value: str | None) -> dict[str, str]:
    """
    Parses: "Old Name:New Name,Other:Other New"
    """
    mapping: dict[str, str] = {}
    for item in _parse_csv_list(value):
        if ":" not in item:
            raise ValueError(f"Invalid rename entry '{item}'. Expected 'old:new'.")
        old, new = item.split(":", 1)
        mapping[old.strip()] = new.strip()
    return mapping


def _default_colspec(num_cols: int) -> str:
    if num_cols <= 0:
        return ""
    width = 0.96 / num_cols
    return " ".join([rf">{{\raggedright\arraybackslash}}p{{{width:.2f}\linewidth}}" for _ in range(num_cols)])


def _format_cell(value: object, *, escape: bool) -> str:
    if value is None:
        return ""
    if isinstance(value, float) and value != value:  # NaN
        return ""
    text = str(value)
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\n", " ")
    text = " ".join(text.split())
    return _escape_latex(text) if escape else text


def _split_cite_keys(value: object) -> list[str]:
    if value is None:
        return []
    text = str(value).strip()
    if text == "" or text.lower() == "none":
        return []
    parts = re.split(r"[;,]", text)
    return [p.strip() for p in parts if p.strip()]


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Convert a CSV file into a LaTeX table (.tex) matching paperVenues-style formatting."
    )
    parser.set_defaults(group_citations=True)
    parser.add_argument("--input", type=Path, required=True, help="Input CSV path.")
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output .tex path (default: tables/<input_stem>.tex).",
    )
    parser.add_argument(
        "--columns",
        type=str,
        default=None,
        help="Comma-separated list of columns to include (default: all columns).",
    )
    parser.add_argument(
        "--rename",
        type=str,
        default=None,
        help="Comma-separated renames in the form 'Old:New,Other:Other New'.",
    )
    parser.add_argument(
        "--cite-column",
        type=str,
        default=None,
        help="If set, formats this column as \\cite{<value>} (expects BibTeX keys).",
    )
    parser.add_argument(
        "--group-citations",
        dest="group_citations",
        action="store_true",
        help=(
            "Merge rows where all non-citation columns match and combine the citation keys "
            "into a single \\cite{...} cell (default: enabled)."
        ),
    )
    parser.add_argument(
        "--no-group-citations",
        dest="group_citations",
        action="store_false",
        help="Disable row grouping by citation column.",
    )
    parser.add_argument(
        "--no-escape-columns",
        type=str,
        default=None,
        help="Comma-separated column names that should not be LaTeX-escaped.",
    )
    parser.add_argument(
        "--caption",
        type=str,
        default=None,
        help="Optional \\caption{...} (only used when --wrap=table).",
    )
    parser.add_argument(
        "--label",
        type=str,
        default=None,
        help="Optional \\label{...} (only used when --wrap=table).",
    )
    parser.add_argument(
        "--wrap",
        choices=["table", "tabular"],
        default="table",
        help="Wrap output in a floating table environment, or output only the tabular.",
    )
    parser.add_argument(
        "--position",
        type=str,
        default=None,
        help="Optional float position specifier for table wrapper (e.g., tb, t, h!).",
    )
    parser.add_argument(
        "--colspec",
        type=str,
        default=None,
        help="LaTeX tabular column spec (default: auto p{..} columns).",
    )
    parser.add_argument(
        "--max-rows",
        type=int,
        default=None,
        help="Optional limit on number of rows written.",
    )
    args = parser.parse_args(argv)

    if not args.input.exists():
        print(f"ERROR: Input CSV not found: {args.input}", file=sys.stderr)
        return 2

    try:
        import pandas as pd
    except ImportError as e:
        print("ERROR: pandas is required to run this script.", file=sys.stderr)
        print(f"  Details: {e}", file=sys.stderr)
        return 2

    df = pd.read_csv(args.input)

    desired_columns = _parse_csv_list(args.columns) or list(df.columns)
    rename_map = _parse_rename(args.rename)
    cite_column = args.cite_column
    no_escape_cols = set(_parse_csv_list(args.no_escape_columns))

    missing = [c for c in desired_columns if _normalize_col(c) not in {_normalize_col(x) for x in df.columns}]
    if missing:
        print(f"ERROR: Missing columns in CSV: {', '.join(missing)}", file=sys.stderr)
        print(f"Available columns: {', '.join([str(c) for c in list(df.columns)])}", file=sys.stderr)
        return 2

    # Resolve desired columns by normalized match (case/whitespace-insensitive).
    norm_to_actual = {_normalize_col(c): str(c) for c in list(df.columns)}
    resolved = [norm_to_actual[_normalize_col(c)] for c in desired_columns]
    df = df[resolved].copy()

    output_headers = [rename_map.get(c, c) for c in desired_columns]

    if cite_column is not None:
        # Match cite column against desired columns (normalized).
        cite_norm = _normalize_col(cite_column)
        cite_idx = None
        for i, col in enumerate(desired_columns):
            if _normalize_col(col) == cite_norm:
                cite_idx = i
                break
        if cite_idx is None:
            print(
                f"ERROR: --cite-column '{cite_column}' is not in --columns (or the CSV columns).",
                file=sys.stderr,
            )
            return 2
    else:
        cite_idx = None

    if args.group_citations and cite_idx is None:
        print("ERROR: --group-citations requires --cite-column.", file=sys.stderr)
        return 2

    if args.group_citations and cite_idx is not None:
        cite_actual_col = resolved[cite_idx]
        group_actual_cols = [c for i, c in enumerate(resolved) if i != cite_idx]

        def _agg_keys(series: "pd.Series") -> str:
            seen: set[str] = set()
            ordered: list[str] = []
            for v in series.tolist():
                for key in _split_cite_keys(v):
                    if key not in seen:
                        seen.add(key)
                        ordered.append(key)
            return ", ".join(ordered)

        df["_row_order"] = range(len(df))
        df = (
            df.groupby(group_actual_cols, dropna=False, sort=False, as_index=False)
            .agg({cite_actual_col: _agg_keys, "_row_order": "min"})
            .sort_values("_row_order", kind="stable")
            .drop(columns=["_row_order"])
        )

    if args.max_rows is not None:
        df = df.head(args.max_rows)

    out_path = args.output or Path("tables") / f"{args.input.stem}.tex"
    out_path.parent.mkdir(parents=True, exist_ok=True)

    colspec = args.colspec or _default_colspec(len(desired_columns))

    lines: list[str] = []
    if args.wrap == "table":
        if args.position:
            lines.append(rf"\begin{{table}}[{args.position}]")
        else:
            lines.append(r"\begin{table}")
        lines.append(r"    \centering")
        lines.append(r"    \renewcommand{\arraystretch}{1.15}")

    indent = "    " if args.wrap == "table" else ""
    lines.append(f"{indent}\\begin{{tabular}}{{{colspec}}}")
    lines.append(f"{indent}\\hline")
    header_cells = [r"\textbf{" + _escape_latex(h) + "}" for h in output_headers]
    lines.append(f"{indent}" + " & ".join(header_cells) + r" \\")
    lines.append(f"{indent}\\hline")

    for row in df.itertuples(index=False, name=None):
        cell_texts: list[str] = []
        for idx, (col_name, value) in enumerate(zip(desired_columns, row)):
            if cite_idx is not None and idx == cite_idx:
                keys = _split_cite_keys(value)
                if not keys:
                    cell_texts.append("")
                else:
                    cell_texts.append(rf"\cite{{{', '.join(keys)}}}")
                continue

            escape = col_name not in no_escape_cols
            cell_texts.append(_format_cell(value, escape=escape))

        lines.append(f"{indent}" + " & ".join(cell_texts) + r" \\")

    lines.append(f"{indent}\\hline")
    lines.append(f"{indent}\\end{{tabular}}")

    if args.wrap == "table":
        if args.caption:
            lines.append(f"    \\caption{{{_escape_latex(args.caption)}}}")
        if args.label:
            lines.append(f"    \\label{{{args.label}}}")
        lines.append(r"\end{table}")

    out_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote LaTeX table to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
