#!/usr/bin/env python3
"""
Stacked bar chart: tokenized "Domain Application" by "Year" (corpus only), with styling.

PDF export styling updates:
- Save with *no* surrounding whitespace: bbox_inches="tight", pad_inches=0
- Only left and bottom spines (axes lines) are shown; top/right spines removed
- No tick marks (optional, but common for a clean axis-only look); keep labels
"""

from __future__ import annotations

import argparse
import re
import ssl
from collections import defaultdict
from io import StringIO
from pathlib import Path
from typing import Any, Dict, List, Optional
from urllib.parse import urlparse
from urllib.request import urlopen

import certifi
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.patches import Polygon


# ----------------------------
# Domain colors
# ----------------------------
DOMAIN_HEX_COLORS: Dict[str, str] = {
    "Climate": "#86BD72",
    "Public Health": "#E9C475",
    "Medicine": "#8ED0AE",
    "Social/Civic": "#85B0CF",
    "Industry": "#D06E88",
    "Science Education": "#B7A1DA",
    "Journalism": "#6983C6",
    "Various": "#C689D0",
    "Agnostic": "#918F9D",
}
DEFAULT_COLOR = "#9e9e9e"
MONOCHROME_COLOR = "#c77bc1"
PAPER_HEIGHT = 0.5
DEFAULT_SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "12yhCsrxngXPVcoLEJNJc2qBMyes83o2v8Yzh0NdDon4/edit?usp=sharing"
)
DEFAULT_SHEET_NAME = "classificationtable"


def google_sheets_csv_url(sheet_url: str, sheet_name: str) -> str:
    parsed = urlparse(sheet_url)
    if "docs.google.com" not in parsed.netloc:
        raise ValueError("Only Google Sheets URLs are supported for --input-url.")

    match = re.search(r"/spreadsheets/d/([^/]+)", parsed.path)
    if not match:
        raise ValueError("Could not parse Google Sheet ID from --input-url.")

    sheet_id = match.group(1)
    return (
        f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        f"/gviz/tq?tqx=out:csv&sheet={sheet_name}"
    )


def load_google_sheet_csv(sheet_url: str, sheet_name: str, pd_module: Any) -> Any:
    csv_url = google_sheets_csv_url(sheet_url.strip(), sheet_name.strip())
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    with urlopen(csv_url, context=ssl_context) as response:
        csv_data = response.read().decode("utf-8")
    return pd_module.read_csv(StringIO(csv_data))


def coerce_year_to_int(x) -> Optional[int]:
    if x is None or (isinstance(x, float) and pd.isna(x)):
        return None
    s = str(x).strip()
    if not s:
        return None
    try:
        f = float(s)
        i = int(f)
        if abs(f - i) < 1e-9 and 1000 <= i <= 9999:
            return i
    except Exception:
        return None
    return None


def split_comma_tokens(cell) -> List[str]:
    if cell is None or (isinstance(cell, float) and pd.isna(cell)):
        return []
    s = str(cell).strip()
    if not s:
        return []
    return [tok.strip() for tok in s.split(",") if tok.strip()]


def get_color(domain: str) -> str:
    return DOMAIN_HEX_COLORS.get(domain, DEFAULT_COLOR)


def save_chart(
    single_counts: Dict[int, Dict[str, int]],
    grouped_units: Dict[int, List[List[str]]],
    years: List[int],
    output_path: Path,
    title: str,
    unit_linewidth: float,
    monochrome: bool = False,
) -> None:
    bar_width = 0.5
    x_step = bar_width * 1.25
    half_w = bar_width / 2.0
    x = [i * x_step for i in range(len(years))]

    fig, ax = plt.subplots(figsize=(max(10, 0.5 * len(years)), 6))
    ax.set_aspect("equal", adjustable="box")

    for xi, year in enumerate(years):
        xpos = x[xi]
        year_counts = single_counts.get(year, {})
        present = [domain for domain, count in year_counts.items() if count > 0]
        ordered = sorted(present, key=lambda domain: (-year_counts[domain], domain))
        bottom = 0.0

        for domain in ordered:
            count = int(year_counts[domain])
            color = MONOCHROME_COLOR if monochrome else get_color(domain)
            for _ in range(count):
                ax.bar(
                    xpos,
                    PAPER_HEIGHT,
                    bottom=bottom,
                    width=bar_width,
                    color=color,
                    edgecolor="white",
                    linewidth=unit_linewidth,
                    align="center",
                )
                bottom += PAPER_HEIGHT

        for domains in grouped_units.get(year, []):
            if not domains:
                continue
            group_bottom = bottom
            group_top = group_bottom + PAPER_HEIGHT
            left = xpos - half_w
            right = xpos + half_w

            if monochrome:
                ax.bar(
                    xpos,
                    PAPER_HEIGHT,
                    bottom=group_bottom,
                    width=bar_width,
                    color=MONOCHROME_COLOR,
                    edgecolor="none",
                    linewidth=0.0,
                    align="center",
                )
                bottom = group_top
            elif len(domains) == 2:
                # Split two-domain papers from top-left to bottom-right.
                ax.add_patch(Polygon(
                    [(left, group_top), (right, group_top), (right, group_bottom)],
                    closed=True,
                    facecolor=get_color(domains[0]),
                    edgecolor="none",
                ))
                ax.add_patch(Polygon(
                    [(left, group_top), (right, group_bottom), (left, group_bottom)],
                    closed=True,
                    facecolor=get_color(domains[1]),
                    edgecolor="none",
                ))
                ax.plot(
                    [left, right], [group_top, group_bottom],
                    color="white", linewidth=unit_linewidth,
                )
                bottom = group_top
            else:
                # Three or more domains remain equal horizontal bands.
                h = PAPER_HEIGHT / len(domains)
                for domain in domains:
                    ax.bar(
                        xpos,
                        h,
                        bottom=bottom,
                        width=bar_width,
                        color=get_color(domain),
                        edgecolor="none",
                        linewidth=0.0,
                        align="center",
                    )
                    bottom += h

            # Keep a white boundary between every paper square.
            ax.hlines(
                [group_bottom, group_top],
                left,
                right,
                colors="white",
                linewidth=unit_linewidth,
            )

    ax.set_xlabel("Year")
    ax.set_ylabel("Number of Papers")
    ax.set_title(title)
    max_papers = max(
        sum(single_counts.get(year, {}).values()) + len(grouped_units.get(year, []))
        for year in years
    )
    y_axis_max = max(20, ((max_papers + 4) // 5) * 5)
    ax.set_ylim(0, y_axis_max * PAPER_HEIGHT)
    paper_ticks = list(range(0, y_axis_max + 1, 5))
    ax.set_yticks([count * PAPER_HEIGHT for count in paper_ticks], labels=paper_ticks)
    ax.set_xticks(x)
    ax.set_xticklabels([str(year) for year in years], rotation=45, ha="center")
    ax.set_xlim(min(x) - x_step, max(x) + x_step)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    ax.spines["left"].set_color("black")
    ax.spines["bottom"].set_color("black")
    ax.tick_params(axis="both", colors="black", which="both", length=0)

    output_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(output_path, dpi=300, bbox_inches="tight", pad_inches=0)
    plt.close(fig)


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Stacked bar chart of tokenized 'Domain Application' by 'Year' (corpus only), with unit white separators and grouped multi-token rows."
    )
    parser.add_argument(
        "--input-url",
        default=DEFAULT_SHEET_URL,
        help="Google Sheets URL (defaults to the classification exporter sheet).",
    )
    parser.add_argument(
        "--sheet-name",
        default=DEFAULT_SHEET_NAME,
        help="Worksheet title (default: classificationtable).",
    )
    parser.add_argument("--year_col", default="Year", help="Column title for year (default: 'Year')")
    parser.add_argument("--domain_col", default="DomainApp", help="Domain column (default: 'DomainApp')")
    parser.add_argument("--out", default="domainbyyear.pdf", help="Output PDF path (default: domainbyyear.pdf)")
    parser.add_argument(
        "--out-monochrome",
        default="domainbyyear_monochrome.pdf",
        help="Output path for the single-colour chart (default: domainbyyear_monochrome.pdf)",
    )
    parser.add_argument("--title", default="Papers Published by Domain and Year", help="Chart title")
    parser.add_argument("--unit_linewidth", type=float, default=0.6, help="White separator line width")
    args = parser.parse_args()

    df = load_google_sheet_csv(args.input_url, args.sheet_name, pd)

    for required in ("AuthorYear", args.year_col, args.domain_col):
        if required not in df.columns:
            raise KeyError(f"Required column '{required}' not found. Found: {list(df.columns)}")

    # Match classificationtable_to_json.py by excluding blank spreadsheet rows.
    df = df.loc[df["AuthorYear"].notna() & df["AuthorYear"].astype(str).str.strip().ne("")].copy()

    # Clean years
    df["__year__"] = df[args.year_col].apply(coerce_year_to_int)
    df = df.dropna(subset=["__year__"]).copy()
    df["__year__"] = df["__year__"].astype(int)

    if df.empty:
        raise ValueError("No rows remain after filtering and year coercion.")

    single_counts: Dict[int, Dict[str, int]] = defaultdict(lambda: defaultdict(int))
    grouped_units: Dict[int, List[List[str]]] = defaultdict(list)
    all_domains: set[str] = set()

    for _, row in df.iterrows():
        year = int(row["__year__"])
        tokens = split_comma_tokens(row[args.domain_col])
        if not tokens:
            continue
        all_domains.update(tokens)

        if len(tokens) == 1:
            single_counts[year][tokens[0]] += 1
        else:
            grouped_units[year].append(tokens)

    if not all_domains:
        raise ValueError("No domain tokens found after tokenization.")

    min_year = int(df["__year__"].min())
    max_year = int(df["__year__"].max())
    years = list(range(min_year, max_year + 1))

    save_chart(
        single_counts, grouped_units, years, Path(args.out), args.title,
        args.unit_linewidth,
    )
    save_chart(
        single_counts, grouped_units, years, Path(args.out_monochrome), args.title,
        args.unit_linewidth, monochrome=True,
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
