#!/usr/bin/env python3
"""Count SpecificEmotionsCleaned per application domain."""

from __future__ import annotations

import argparse
import json
from collections import Counter, defaultdict
from pathlib import Path

DOMAINS = [
    "Agnostic",
    "Medicine",
    "Public Health",
    "Social/Civic",
    "Business/Industry",
    "Climate",
    "Science Education",
    "Journalism",
    "Culture/Humanities",
    "Various",
]

NO_DOMAIN_LABEL = "(No domain)"


def parse_emotions(raw: str | None) -> list[str]:
    if not raw:
        return []
    parts = [p.strip() for p in raw.split(",")]
    return [p for p in parts if p]


def load_rows(path: Path) -> list[dict]:
    with path.open("r", encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError(f"Expected a list in {path}, got {type(data).__name__}")
    return data


def build_counts(rows: list[dict]) -> dict[str, Counter]:
    counts: dict[str, Counter] = defaultdict(Counter)
    for row in rows:
        emotions = parse_emotions(row.get("SpecificEmotionsCleaned"))
        if not emotions:
            continue
        domains = [d for d in DOMAINS if row.get(d) == "X"]
        if not domains:
            domains = [NO_DOMAIN_LABEL]
        for domain in domains:
            counts[domain].update(emotions)
    return counts


def print_report(counts: dict[str, Counter]) -> None:
    domain_order = [d for d in DOMAINS if d in counts]
    if NO_DOMAIN_LABEL in counts:
        domain_order.append(NO_DOMAIN_LABEL)

    for domain in domain_order:
        counter = counts[domain]
        total = sum(counter.values())
        print(f"{domain} (total {total})")
        for emotion, count in sorted(counter.items(), key=lambda kv: (-kv[1], kv[0])):
            print(f"  {emotion}: {count}")
        print("")


def main() -> None:
    parser = argparse.ArgumentParser(description="Count emotions per application domain")
    parser.add_argument(
        "--input",
        default="public/classtable.json",
        help="Path to classtable.json (default: public/classtable.json)",
    )
    parser.add_argument(
        "--output",
        default="public/counts.json",
        help="Path to write counts JSON (default: public/counts.json)",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Print output as JSON (domain -> emotion -> count)",
    )
    args = parser.parse_args()

    rows = load_rows(Path(args.input))
    counts = build_counts(rows)

    output = {domain: dict(counter) for domain, counter in counts.items()}
    with Path(args.output).open("w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    if args.json:
        print(json.dumps(output, indent=2, ensure_ascii=False))
    else:
        print_report(counts)


if __name__ == "__main__":
    main()
