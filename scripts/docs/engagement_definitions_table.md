# `engagement_definitions_table.py`

Extracts three columns from the AVSTAR supplementary dataset into a clean CSV:

- `Engagement Citation`
- `Engagement Concept`
- `BibTex Key`

Output CSV is sanitized so that any line breaks inside cells are replaced with spaces (and extra whitespace is collapsed), to avoid multiline CSV fields.

This script is a thin wrapper around shared utilities in `scripts/sheet_extract.py` (see also `scripts/docs/sheet_extract.md`) and only specifies:

- Which columns to extract (`Engagement Citation`, `Engagement Concept`, `BibTex Key`)
- The input source (`--input`, optionally `--sheet`/`--gid`)
- The output path (`--output`)

## Requirements

- Python 3
- `pandas`
- For local Excel (`.xlsx`) input: `openpyxl` (required by `pandas.read_excel` for `.xlsx`)

## Usage

Default (reads the local Excel file and writes the CSV):

```bash
python3 scripts/engagement_definitions_table.py
```

Custom input/output:

```bash
python3 scripts/engagement_definitions_table.py \
  --input data/AVSTAR_supplementary.xlsx \
  --output data/engagement_definitions.csv
```

### Selecting an Excel sheet

If the workbook contains multiple sheets with the required columns, the script auto-selects the first match and prints a warning.

To choose a specific Excel sheet:

```bash
python3 scripts/engagement_definitions_table.py \
  --input data/AVSTAR_supplementary.xlsx \
  --sheet <SHEET_NAME> \
  --output data/engagement_definitions.csv
```

## Using a Google Sheet instead of Excel

You can also pass a Google Sheets URL (or an already-direct CSV export URL) to `--input`. The script will download it as CSV and then extract the required columns.

Important:

- The Google Sheet must be publicly accessible (or published), otherwise `pandas` cannot download it.
- When using a Google Sheets URL, `--sheet` is ignored; use `--gid` to select the tab.

Example with a share URL that includes a `gid`:

```bash
python3 scripts/engagement_definitions_table.py \
  --input "https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit#gid=<GID>" \
  --output data/engagement_definitions.csv
```

Example with explicit `--gid`:

```bash
python3 scripts/engagement_definitions_table.py \
  --input "https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit" \
  --gid <GID> \
  --output data/engagement_definitions.csv
```

## Output

The output file is a CSV with exactly these columns (in this order):

- `Engagement Citation`
- `Engagement Concept`
- `BibTex Key`

The script prints a short status line like:

```
Wrote <N> rows to <output> (source: <sheet_or_url>)
```

