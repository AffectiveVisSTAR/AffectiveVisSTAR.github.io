#!/usr/bin/env python3

from __future__ import annotations

import argparse
import sys
from pathlib import Path


def _clean_cell(value: object) -> object:
    if value is None:
        return value
    if isinstance(value, str):
        text = value.replace("\r\n", "\n").replace("\r", "\n").replace("\n", " ")
        return " ".join(text.split())
    return value


def _agg_unique(series, sep: str) -> str:
    seen: set[str] = set()
    ordered: list[str] = []
    for v in series.tolist():
        if v is None:
            continue
        if isinstance(v, float) and v != v:  # NaN
            continue
        text = str(v).strip()
        if text == "" or text.lower() == "none":
            continue
        if text not in seen:
            seen.add(text)
            ordered.append(text)
    return sep.join(ordered)


def _aggregate_by_key(df, key: str, sep: str):
    import pandas as pd

    if key not in df.columns:
        raise ValueError(f"Key column '{key}' not found. Available: {', '.join(df.columns)}")

    other_cols = [c for c in df.columns if c != key]
    if not other_cols:
        return df.drop_duplicates(subset=[key])

    grouped = (
        df.groupby(key, dropna=False, sort=False, as_index=False)
        .agg({col: (lambda s, _sep=sep: _agg_unique(s, _sep)) for col in other_cols})
    )

    # Preserve stable-ish order: first occurrence of each key in the original df.
    first_pos = df.reset_index().groupby(key, dropna=False)["index"].min()
    grouped["_row_order"] = grouped[key].map(first_pos)
    grouped = grouped.sort_values("_row_order", kind="stable").drop(columns=["_row_order"])
    return grouped


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        description="Join two CSV files on a shared key (default: 'BibTex Key')."
    )
    parser.add_argument("--left", type=Path, required=True, help="Left CSV path.")
    parser.add_argument("--right", type=Path, required=True, help="Right CSV path.")
    parser.add_argument(
        "--key",
        type=str,
        default="BibTex Key",
        help="Column name to join on (default: BibTex Key).",
    )
    parser.add_argument(
        "--how",
        choices=["inner", "left", "right", "outer"],
        default="inner",
        help="Join type (default: inner).",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Output CSV path (default: data/joined_<left>_<right>.csv).",
    )
    parser.add_argument(
        "--no-aggregate",
        action="store_true",
        help=(
            "Do not pre-aggregate duplicate keys. By default, rows are aggregated per key "
            "to avoid Cartesian products when keys repeat."
        ),
    )
    parser.add_argument(
        "--aggregate-sep",
        type=str,
        default=" | ",
        help="Separator used when aggregating multiple values per key (default: ' | ').",
    )
    parser.add_argument(
        "--suffixes",
        type=str,
        default="_x,_y",
        help="Suffixes for overlapping column names, as 'LEFT,RIGHT' (default: _x,_y).",
    )
    args = parser.parse_args(argv)

    if not args.left.exists():
        print(f"ERROR: Left CSV not found: {args.left}", file=sys.stderr)
        return 2
    if not args.right.exists():
        print(f"ERROR: Right CSV not found: {args.right}", file=sys.stderr)
        return 2

    try:
        import pandas as pd
    except ImportError as e:
        print("ERROR: pandas is required to run this script.", file=sys.stderr)
        print(f"  Details: {e}", file=sys.stderr)
        return 2

    suffix_parts = [p.strip() for p in args.suffixes.split(",", 1)]
    if len(suffix_parts) != 2 or not suffix_parts[0] or not suffix_parts[1]:
        print("ERROR: --suffixes must be in the form 'LEFT,RIGHT' (e.g. _x,_y).", file=sys.stderr)
        return 2
    suffixes = (suffix_parts[0], suffix_parts[1])

    left_df = pd.read_csv(args.left)
    right_df = pd.read_csv(args.right)

    if args.key not in left_df.columns:
        print(
            f"ERROR: Key column '{args.key}' not found in left CSV. Available: {', '.join(left_df.columns)}",
            file=sys.stderr,
        )
        return 2
    if args.key not in right_df.columns:
        print(
            f"ERROR: Key column '{args.key}' not found in right CSV. Available: {', '.join(right_df.columns)}",
            file=sys.stderr,
        )
        return 2

    if not args.no_aggregate:
        left_df = _aggregate_by_key(left_df, args.key, args.aggregate_sep)
        right_df = _aggregate_by_key(right_df, args.key, args.aggregate_sep)

    joined = left_df.merge(right_df, on=args.key, how=args.how, suffixes=suffixes)
    joined = joined.apply(lambda col: col.map(_clean_cell))

    out_path = args.output
    if out_path is None:
        out_path = Path("data") / f"joined_{args.left.stem}_{args.right.stem}.csv"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    joined.to_csv(out_path, index=False, encoding="utf-8")

    print(f"Wrote {len(joined)} rows to {out_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

