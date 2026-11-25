#!/usr/bin/env python3
"""Fetch the design-space summary tab and render its five columns as HTML."""

from __future__ import annotations

import argparse
import csv
import html
import re
import ssl
import urllib.request
from io import StringIO
from pathlib import Path
from urllib.parse import quote, urlparse

import certifi


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_SHEET_URL = (
    "https://docs.google.com/spreadsheets/d/"
    "12yhCsrxngXPVcoLEJNJc2qBMyes83o2v8Yzh0NdDon4/edit?usp=sharing"
)
DEFAULT_SHEET_NAME = "summary-designspace-summary"
DEFAULT_OUTPUT = ROOT / "summary-designspace-summary.html"
TABLE_COLUMNS = [
    "Dimension",
    "Subdimension",
    "Description",
    "Affective Impact",
    "Responsible Application of Affective Techniques",
]


def normalize_column(name: str) -> str:
    return " ".join(name.strip().lower().split())


def google_sheets_csv_url(sheet_url: str, sheet_name: str) -> str:
    parsed = urlparse(sheet_url)
    if "docs.google.com" not in parsed.netloc:
        raise ValueError("Only Google Sheets URLs are supported for --input-url.")
    match = re.search(r"/spreadsheets/d/([^/]+)", parsed.path)
    if not match:
        raise ValueError("Could not parse Google Sheet ID from --input-url.")
    return (
        f"https://docs.google.com/spreadsheets/d/{match.group(1)}"
        f"/gviz/tq?tqx=out:csv&sheet={quote(sheet_name, safe='')}"
    )


def load_rows(sheet_url: str, sheet_name: str) -> list[dict[str, str]]:
    csv_url = google_sheets_csv_url(sheet_url.strip(), sheet_name.strip())
    ssl_context = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(csv_url, context=ssl_context) as response:
        csv_text = response.read().decode("utf-8-sig")

    reader = csv.DictReader(StringIO(csv_text))
    if not reader.fieldnames:
        raise ValueError("The selected Google Sheet tab has no header row.")
    header_lookup = {
        normalize_column(header): header for header in reader.fieldnames if header
    }
    missing = [
        column for column in TABLE_COLUMNS
        if normalize_column(column) not in header_lookup
    ]
    if missing:
        raise ValueError(
            "Missing expected columns: " + ", ".join(missing)
            + ". Found: " + ", ".join(reader.fieldnames)
        )

    rows: list[dict[str, str]] = []
    for raw_row in reader:
        row = {
            column: raw_row.get(header_lookup[normalize_column(column)], "") or ""
            for column in TABLE_COLUMNS
        }
        if any(value.strip() for value in row.values()):
            rows.append(row)
    return rows


def render_cell(value: str) -> str:
    escaped = html.escape(value)
    return escaped.replace("\r\n", "\n").replace("\r", "\n").replace("\n", "<br>")


def render_html(rows: list[dict[str, str]], sheet_name: str) -> str:
    headers = "\n".join(
        f'            <th scope="col">{html.escape(column)}</th>'
        for column in TABLE_COLUMNS
    )
    body = []

    def render_data_cells(row: dict[str, str]) -> str:
        cells = []
        for column in TABLE_COLUMNS[1:]:
            css_class = ' class="subdimension-cell"' if column == "Subdimension" else ""
            cells.append(
                f"            <td{css_class}>{render_cell(row[column])}</td>"
            )
        return "\n".join(cells)

    index = 0
    while index < len(rows):
        row = rows[index]
        dimension = row["Dimension"].strip()

        # A dimension heading applies to following rows whose Dimension cell
        # is blank, as well as consecutive rows that repeat the same heading.
        end = index + 1
        while end < len(rows):
            next_dimension = rows[end]["Dimension"].strip()
            if next_dimension and next_dimension != dimension:
                break
            end += 1

        dimension_label = render_cell(dimension)
        label_class = "dimension-label"
        if dimension == "Vis Techn.":
            dimension_label = "Vis<br>Techn."
            label_class += " dimension-label--multiline"

        cells = [
            f'            <td class="dimension-cell" rowspan="{end - index}">'
            f'<span class="{label_class}">{dimension_label}</span></td>'
        ]
        cells.append(render_data_cells(row))
        body.append(f"          <tr>\n" + "\n".join(cells) + "\n          </tr>")

        # Emit the remaining rows in this dimension block without another
        # Dimension cell, so the first cell spans and centers across the block.
        for grouped_row in rows[index + 1:end]:
            grouped_cells = render_data_cells(grouped_row)
            body.append(f"          <tr>\n{grouped_cells}\n          </tr>")
        index = end

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Design Space Summary</title>
  <link rel="stylesheet" href="summarytable.css">
</head>
<body>
  <main>
    <h1>Design Space Summary</h1>
    <p class="intro">{len(rows)} rows from the “{html.escape(sheet_name)}” worksheet.</p>
    <div class="table-wrap">
      <table>
        <colgroup>
          <col class="dimension"><col class="subdimension"><col class="description"><col class="impact"><col class="application">
        </colgroup>
        <thead><tr>
{headers}
        </tr></thead>
        <tbody>
{chr(10).join(body)}
        </tbody>
      </table>
    </div>
  </main>
</body>
</html>
"""


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Render five columns from the summary design-space Google Sheet tab as HTML."
    )
    parser.add_argument("--input-url", default=DEFAULT_SHEET_URL, help="Google Sheets URL.")
    parser.add_argument("--sheet-name", default=DEFAULT_SHEET_NAME, help="Worksheet title.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output HTML path.")
    args = parser.parse_args()

    rows = load_rows(args.input_url, args.sheet_name)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_html(rows, args.sheet_name), encoding="utf-8")
    print(f"Wrote {len(rows)} rows to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
