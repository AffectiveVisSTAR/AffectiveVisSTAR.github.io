# `sheet_extract.py`

Reusable utilities for reading tabular data from either:

- a local Excel file (`.xlsx`) via `pandas.read_excel`
- a URL via `pandas.read_csv` (including Google Sheets via CSV export)

It also provides helpers to robustly select and sanitize columns before writing a CSV.

## Requirements

- Python 3
- `pandas`
- For local Excel (`.xlsx`) input: `openpyxl` (required by `pandas.read_excel` for `.xlsx`)

## Key functions

- `read_dataframe(input_value, *, sheet=None, gid=None, required_columns=None) -> (df, source_info)`
  - `input_value`: path-like string / `Path` to `.xlsx`, or an `https://...` URL
  - Excel:
    - If `sheet` is provided, reads that sheet.
    - If `sheet` is not provided and `required_columns` is provided, it searches all sheets and auto-selects the first match.
  - URL:
    - Downloads CSV from the URL.
    - If the URL is a Google Sheets share URL, it is converted to a direct CSV export URL (optionally using `gid`).

- `extract_columns(df, desired_columns, *, output_columns=None, sanitize_cells=True) -> df_selected`
  - Resolves columns case/whitespace-insensitively.
  - By default replaces any `\r`/`\n` inside cells with spaces and collapses whitespace.

## Example (reusing in another script)

```python
from sheet_extract import read_dataframe, extract_columns

desired = ["Col A", "Col B"]
df, source = read_dataframe("data/input.xlsx", required_columns=desired)
out = extract_columns(df, desired, output_columns=desired)
out.to_csv("data/output.csv", index=False)
```

## Google Sheets notes

- The Google Sheet must be publicly accessible (or published), otherwise `pandas` cannot download it.
- Select the tab with `gid` (the number in the sheet URL fragment/query, e.g. `#gid=12345`).

