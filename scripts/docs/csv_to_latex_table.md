# `csv_to_latex_table.py`

Converts one of the extracted CSV files (e.g., `data/emotional_models.csv` or `data/engagement_definitions.csv`) into a LaTeX table `.tex` file in the `tables/` folder, so it can be included from `__MAIN__.tex` via `\include{tables/...}`.

## Requirements

- Python 3
- `pandas`

## Basic usage

Generate a `.tex` file in `tables/` using the CSV stem as the filename:

```bash
python3 scripts/csv_to_latex_table.py --input data/emotional_models.csv
```

Explicit output path:

```bash
python3 scripts/csv_to_latex_table.py \
  --input data/emotional_models.csv \
  --output tables/emotionTable.tex
```

## Selecting/formatting columns

Pick a subset of columns (comma-separated):

```bash
python3 scripts/csv_to_latex_table.py \
  --input data/emotional_models.csv \
  --columns "Emotion Model Citation,Emotion Model,BibTex Key" \
  --output tables/emotionTable.tex
```

Turn a BibTeX-key column into citations:

```bash
python3 scripts/csv_to_latex_table.py \
  --input data/emotional_models.csv \
  --columns "Emotion Model Citation,Emotion Model,BibTex Key" \
  --cite-column "BibTex Key" \
  --group-citations \
  --rename "BibTex Key:Citation" \
  --output tables/emotionTable.tex
```

`--group-citations` merges rows where all other selected columns match and combines the keys into a single `\cite{a,b,c}` cell.

## LaTeX wrapping

By default, output is wrapped in a floating `table` environment. To output only the `tabular` (no float wrapper), use:

```bash
python3 scripts/csv_to_latex_table.py \
  --input data/emotional_models.csv \
  --wrap tabular \
  --output tables/emotionTable.tex
```

## Notes

- Cells are sanitized so embedded line breaks become spaces before writing LaTeX.
- Most LaTeX special characters are escaped by default; use `--no-escape-columns` if a column already contains valid LaTeX.
