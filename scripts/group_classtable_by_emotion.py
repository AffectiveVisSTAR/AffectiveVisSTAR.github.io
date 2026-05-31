#!/usr/bin/env python3
"""Group classtable entries by SpecificEmotionsCleaned and count X-marked attributes."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any


def parse_emotions(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = [part.strip() for part in raw.split(",")]
    return [part for part in parts if part]


def load_rows(path: Path) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8") as handle:
        data = json.load(handle)
    if not isinstance(data, list):
        raise ValueError(f"Expected a list in {path}, got {type(data).__name__}")
    return data


def build_grouped_counts(rows: list[dict[str, Any]]) -> list[dict[str, Any]]:
    grouped: dict[str, Counter[str]] = defaultdict(Counter)
    publications: dict[str, list[str]] = defaultdict(list)
    seen_publication: dict[str, set[str]] = defaultdict(set)

    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue

        author = row.get("AuthorYear")
        for emotion in emotions:
            if author and author not in seen_publication[emotion]:
                publications[emotion].append(author)
                seen_publication[emotion].add(author)

            for key, value in row.items():
                if key == "SpecificEmotionsCleaned":
                    continue
                if value == "X":
                    grouped[emotion][key] += 1

    return [
        {"name": emotion, "publications": publications[emotion], **dict(counter)}
        for emotion, counter in grouped.items()
    ]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Group classtable.json entries by each SpecificEmotionsCleaned value and "
            "count all other attributes where the value is 'X'."
        )
    )
    parser.add_argument(
        "--input",
        type=Path,
        default=Path("public/classtable.json"),
        help="Path to the classtable JSON file.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=None,
        help="Optional output JSON file path. If omitted, writes to stdout.",
    )
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    rows = load_rows(args.input)
    grouped_counts = build_grouped_counts(rows)
    serialized = json.dumps(grouped_counts, indent=2, ensure_ascii=False)

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(serialized + "\n", encoding="utf-8")
    else:
        print(serialized)


if __name__ == "__main__":
    main()
