# `join_csv_on_key.py`

Joins two CSV files on a shared key column (default: `BibTex Key`) and writes the result as a new CSV (by default into `data/`).

This is useful for combining extracted tables like:

- `data/emotional_models.csv`
- `data/engagement_definitions.csv`

## Requirements

- Python 3
- `pandas`

## Usage

Join two CSVs on `BibTex Key` (inner join by default):

```bash
python3 scripts/join_csv_on_key.py \
  --left data/emotional_models.csv \
  --right data/engagement_definitions.csv
```

Specify output path:

```bash
python3 scripts/join_csv_on_key.py \
  --left data/emotional_models.csv \
  --right data/engagement_definitions.csv \
  --output data/emotion_engagement_joined.csv
```

Choose join type:

```bash
python3 scripts/join_csv_on_key.py \
  --left data/emotional_models.csv \
  --right data/engagement_definitions.csv \
  --how outer \
  --output data/emotion_engagement_joined_outer.csv
```

## Handling repeated keys (important)

If `BibTex Key` appears multiple times in either CSV, a normal join would create a Cartesian product (many duplicated rows).

By default, this script **pre-aggregates** rows per key:

- For each non-key column, it collects unique non-empty values and joins them with ` | `.
- Then it performs the join on the aggregated (one-row-per-key) tables.

To disable that behavior and do a raw join:

```bash
python3 scripts/join_csv_on_key.py \
  --left data/emotional_models.csv \
  --right data/engagement_definitions.csv \
  --no-aggregate \
  --output data/emotion_engagement_joined_raw.csv
```

