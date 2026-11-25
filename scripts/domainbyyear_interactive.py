#!/usr/bin/env python3
"""
Interactive stacked bar chart (saved as HTML) with tooltips showing paper titles.

What it does:
- Reads the same Google Sheet and `classificationtable` worksheet as
  `classificationtable_to_json.py`, using `Year`, `DomainApp`, `Title`, and `AuthorYear`.
- Writes domain-colored and monochrome interactive charts.
- Each paper contributes 0.5 vertical units; y-axis labels remain paper counts.
- Two-domain papers are split diagonally in the domain-colored chart; papers assigned
  three or more domains use horizontal bands. The monochrome chart uses one uniform
  color for each paper.
- Hovering a block shows its paper title and domain.

Output:
- `domain_application_interactive.html`
- `domain_application_monochrome_interactive.html`

Dependencies: pandas, certifi, and plotly.
"""

from __future__ import annotations

import argparse
import re
import ssl
from io import StringIO
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse
from urllib.request import urlopen

import certifi
import pandas as pd
import plotly.graph_objects as go


# ----------------------------
# Domain colors match scripts/domainbyyear.py.
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
    return (
        f"https://docs.google.com/spreadsheets/d/{match.group(1)}"
        f"/gviz/tq?tqx=out:csv&sheet={sheet_name}"
    )


def load_google_sheet_csv(sheet_url: str, sheet_name: str) -> pd.DataFrame:
    csv_url = google_sheets_csv_url(sheet_url.strip(), sheet_name.strip())
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    with urlopen(csv_url, context=ssl_context) as response:
        return pd.read_csv(StringIO(response.read().decode("utf-8")))


def get_color(domain: str) -> str:
    return DOMAIN_HEX_COLORS.get(domain, DEFAULT_COLOR)


def coerce_year_to_int(x) -> Optional[int]:
    """Coerce common Excel year values (e.g., 2020, 2020.0, '2020.0') to int; else None."""
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
    """Split ONLY on commas, strip whitespace, drop empty tokens."""
    if cell is None or (isinstance(cell, float) and pd.isna(cell)):
        return []
    s = str(cell).strip()
    if not s:
        return []
    return [tok.strip() for tok in s.split(",") if tok.strip()]


def rect_shape(x0: float, x1: float, y0: float, y1: float, fill: str, line_color: str = "white", line_width: float = 1.0):
    return dict(
        type="rect",
        xref="x",
        yref="y",
        x0=x0,
        x1=x1,
        y0=y0,
        y1=y1,
        fillcolor=fill,
        line=dict(color=line_color, width=line_width),
        layer="above",
    )


def triangle_shape(path: str, fill: str):
    return dict(
        type="path",
        xref="x",
        yref="y",
        path=path,
        fillcolor=fill,
        line=dict(color="rgba(0,0,0,0)", width=0),
        layer="above",
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Interactive publication chart from the classificationtable Google Sheet."
    )
    parser.add_argument("--input-url", default=DEFAULT_SHEET_URL, help="Google Sheets URL.")
    parser.add_argument("--sheet-name", default=DEFAULT_SHEET_NAME, help="Worksheet title.")
    parser.add_argument("--year_col", default="Year", help="Year column (default: Year).")
    parser.add_argument("--domain_col", default="DomainApp", help="Domain column (default: DomainApp).")
    parser.add_argument("--title_col", default="Title", help="Paper title column (default: Title).")
    parser.add_argument(
        "--out",
        default="domain_application_interactive.html",
        help="Output HTML for the domain-colored chart.",
    )
    parser.add_argument(
        "--out-monochrome",
        default="domain_application_monochrome_interactive.html",
        help="Output HTML for the single-color chart.",
    )
    parser.add_argument("--chart_title", default="Papers Published by Domain and Year", help="Chart title.")
    parser.add_argument("--bar_width", type=float, default=0.5, help="Bar width (default: 0.5).")
    parser.add_argument("--unit_linewidth", type=float, default=0.6, help="White separator width.")
    args = parser.parse_args()

    df = load_google_sheet_csv(args.input_url, args.sheet_name)

    for required in ("AuthorYear", args.year_col, args.domain_col, args.title_col):
        if required not in df.columns:
            raise KeyError(f"Required column '{required}' not found. Found: {list(df.columns)}")

    # Match classificationtable_to_json.py by skipping blank spreadsheet rows.
    df = df.loc[df["AuthorYear"].notna() & df["AuthorYear"].astype(str).str.strip().ne("")].copy()

    # Coerce year and drop invalid
    df["__year__"] = df[args.year_col].apply(coerce_year_to_int)
    df = df.dropna(subset=["__year__"]).copy()
    df["__year__"] = df["__year__"].astype(int)

    if df.empty:
        raise ValueError("No rows remain after filtering and year coercion.")

    # Tokenize domains and keep titles
    records: List[Tuple[int, List[str], str]] = []
    all_domains = set()

    for _, r in df.iterrows():
        year = int(r["__year__"])
        tokens = split_comma_tokens(r[args.domain_col])
        if not tokens:
            continue
        title = str(r[args.title_col]).strip() if not pd.isna(r[args.title_col]) else ""
        records.append((year, tokens, title))
        for t in tokens:
            all_domains.add(t)

    if not records:
        raise ValueError("No usable records after tokenization.")

    min_year = min(y for y, _, _ in records)
    max_year = max(y for y, _, _ in records)
    years = list(range(min_year, max_year + 1))

    # Group records by year into single-token and multi-token lists
    by_year_single: Dict[int, Dict[str, List[str]]] = {y: {} for y in years}  # domain -> [titles]
    by_year_multi: Dict[int, List[Tuple[List[str], str]]] = {y: [] for y in years}  # ([tokens], title)

    for year, tokens, title in records:
        if len(tokens) == 1:
            d = tokens[0]
            by_year_single.setdefault(year, {}).setdefault(d, []).append(title)
        else:
            by_year_multi.setdefault(year, []).append((tokens, title))

    def create_figure(monochrome: bool) -> go.Figure:
        fig = go.Figure()
        shapes = []
        hover_x: List[float] = []
        hover_y: List[float] = []
        hover_text: List[str] = []
        x_step = args.bar_width * 1.25
        half_w = args.bar_width / 2.0

        for xi, year in enumerate(years):
            xpos = xi * x_step
            x0 = xpos - half_w
            x1 = xpos + half_w
            single_map = by_year_single.get(year, {})
            domain_counts = [(domain, len(titles)) for domain, titles in single_map.items()]
            domain_counts.sort(key=lambda item: (-item[1], item[0]))
            y_bottom = 0.0

            for domain, count in domain_counts:
                titles = single_map[domain]
                fill = MONOCHROME_COLOR if monochrome else get_color(domain)
                for title_index in range(count):
                    y0 = y_bottom
                    y1 = y0 + PAPER_HEIGHT
                    shapes.append(rect_shape(
                        x0, x1, y0, y1, fill,
                        line_color="white", line_width=args.unit_linewidth,
                    ))
                    ##### TO UPDATE
                    hover_x.append(xpos)
                    hover_y.append((y0 + y1) / 2.0)
                    hover_text.append(f"Title: {titles[title_index]}<br>Domain: {domain}<br>Year: {year}")
                    y_bottom = y1

            for tokens, paper_title in by_year_multi.get(year, []):
                if not tokens:
                    continue
                block_y0 = y_bottom
                block_y1 = block_y0 + PAPER_HEIGHT

                if monochrome:
                    shapes.append(rect_shape(
                        x0, x1, block_y0, block_y1, MONOCHROME_COLOR,
                        line_color="white", line_width=args.unit_linewidth,
                    ))
                    hover_x.append(xpos)
                    hover_y.append((block_y0 + block_y1) / 2.0)
                    hover_text.append(
                        f"Title: {paper_title}<br>Domains: {', '.join(tokens)}<br>Year: {year}"
                    )
                elif len(tokens) == 2:
                    # Match the static chart's diagonal split for two domains.
                    shapes.append(triangle_shape(
                        f"M {x0},{block_y1} L {x1},{block_y1} L {x1},{block_y0} Z",
                        get_color(tokens[0]),
                    ))
                    shapes.append(triangle_shape(
                        f"M {x0},{block_y1} L {x1},{block_y0} L {x0},{block_y0} Z",
                        get_color(tokens[1]),
                    ))
                    shapes.append(dict(
                        type="line", xref="x", yref="y",
                        x0=x0, x1=x1, y0=block_y1, y1=block_y0,
                        line=dict(color="white", width=args.unit_linewidth),
                        layer="above",
                    ))
                    for domain_index, domain in enumerate(tokens):
                        hover_x.append(xpos)
                        if domain_index == 0:
                            hover_y.append(block_y0 + (2.0 / 3.0) * PAPER_HEIGHT)
                        else:
                            hover_y.append(block_y0 + (1.0 / 3.0) * PAPER_HEIGHT)
                        hover_text.append(
                            f"Title: {paper_title}<br>Domain: {domain}<br>Year: {year}<br>(multi-domain row)"
                        )
                    shapes.append(rect_shape(
                        x0, x1, block_y0, block_y1, "rgba(0,0,0,0)",
                        line_color="white", line_width=args.unit_linewidth,
                    ))
                else:
                    slice_height = PAPER_HEIGHT / len(tokens)
                    for domain_index, domain in enumerate(tokens):
                        y0 = block_y0 + domain_index * slice_height
                        y1 = y0 + slice_height
                        shapes.append(rect_shape(
                            x0, x1, y0, y1, get_color(domain),
                            line_color="rgba(0,0,0,0)", line_width=0.0,
                        ))
                        hover_x.append(xpos)
                        hover_y.append((y0 + y1) / 2.0)
                        hover_text.append(
                            f"Title: {paper_title}<br>Domain: {domain}<br>Year: {year}<br>(multi-domain row)"
                        )
                    shapes.append(rect_shape(
                        x0, x1, block_y0, block_y1, "rgba(0,0,0,0)",
                        line_color="white", line_width=args.unit_linewidth,
                    ))

                y_bottom = block_y1
        
        ##### TO UPDATE
        fig.add_trace(go.Scatter(
            x=hover_x,
            y=hover_y,
            mode="markers",
            marker=dict(size=12, opacity=0.0),
            hovertext=hover_text,
            hoverinfo="text",
            showlegend=False,
        ))

        max_papers = max(
            sum(len(titles) for titles in by_year_single.get(year, {}).values())
            + len(by_year_multi.get(year, []))
            for year in years
        )
        y_axis_max = max(20, ((max_papers + 4) // 5) * 5)
        paper_ticks = list(range(0, y_axis_max + 1, 5))
        fig.update_layout(
            title=args.chart_title,
            plot_bgcolor="white",
            paper_bgcolor="white",
            xaxis=dict(
                title="Year",
                tickmode="array",
                tickvals=[xi * x_step for xi in range(len(years))],
                ticktext=[str(year) for year in years],
                tickangle=45,
                showgrid=False,
                showline=True,
                linecolor="black",
                ticks="",
                zeroline=False,
                range=[-x_step, (len(years) - 1) * x_step + x_step],
            ),
            yaxis=dict(
                title="Number of Papers",
                range=[0, y_axis_max * PAPER_HEIGHT],
                tickmode="array",
                tickvals=[count * PAPER_HEIGHT for count in paper_ticks],
                ticktext=[str(count) for count in paper_ticks],
                showgrid=False,
                showline=True,
                linecolor="black",
                ticks="",
                zeroline=False,
            ),
            shapes=shapes,
            margin=dict(l=60, r=260 if not monochrome else 40, t=70, b=80),
            hovermode="closest",
        )

        if not monochrome:
            for domain in sorted(all_domains):
                fig.add_trace(go.Scatter(
                    x=[None], y=[None], mode="markers",
                    marker=dict(size=10, color=get_color(domain)),
                    name=domain, showlegend=True, hoverinfo="skip",
                ))
            fig.update_layout(legend=dict(
                title="Domain Application",
                x=1.02,
                y=1.0,
                xanchor="left",
                yanchor="top",
            ))
        else:
            fig.add_trace(go.Scatter(
                x=[None], y=[None], mode="markers",
                marker=dict(size=10, color=MONOCHROME_COLOR),
                name="All papers", showlegend=True, hoverinfo="skip",
            ))

        return fig

    for monochrome, output in (
        (False, args.out),
        (True, args.out_monochrome),
    ):
        out_path = Path(output)
        out_path.parent.mkdir(parents=True, exist_ok=True)
        create_figure(monochrome).write_html(
            str(out_path), include_plotlyjs="cdn", full_html=True,
        )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
