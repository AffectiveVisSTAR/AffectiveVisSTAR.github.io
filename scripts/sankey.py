#!/usr/bin/env python3
"""Create a Plotly Sankey diagram from classtable.json and lib/columns.ts."""

from __future__ import annotations

import argparse
import json
import re
from collections import Counter
from itertools import product
from pathlib import Path
from typing import Any, Iterator

import plotly.graph_objects as go


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DATA = ROOT / "public" / "classtable.json"
DEFAULT_COLUMNS = ROOT / "lib" / "columns.ts"
DEFAULT_OUTPUT = ROOT / "sankey.html"
HOVER_TOOLTIP_SCRIPT = r"""
const gd = document.getElementById('{plot_id}');
if (gd) {
  const style = document.createElement('style');
  style.textContent = `
    #${gd.id} .hoverlayer { visibility: hidden !important; }
    #${gd.id} .sankey-custom-tooltip {
      position: absolute; z-index: 1000; display: none; max-width: 320px;
      padding: 8px 10px; border: 1px solid #777; border-radius: 4px;
      background: rgba(255,255,255,0.97); color: #171717;
      font: 13px/1.4 Arial, sans-serif; box-shadow: 0 2px 8px rgba(0,0,0,0.18);
      pointer-events: none; white-space: normal;
    }
    #${gd.id} .sankey-custom-tooltip::after {
      content: ''; position: absolute; right: -8px; top: var(--pointer-y, 50%);
      transform: translateY(-50%); border-top: 7px solid transparent;
      border-bottom: 7px solid transparent; border-left: 8px solid #777;
    }
  `;
  document.head.appendChild(style);
  gd.style.position = 'relative';
  const tooltip = document.createElement('div');
  tooltip.className = 'sankey-custom-tooltip';
  gd.appendChild(tooltip);
  let mouse = { x: 0, y: 0 };

  const positionTooltip = () => {
    const bounds = gd.getBoundingClientRect();
    const left = Math.max(6, mouse.x - tooltip.offsetWidth - 14);
    const top = Math.max(6, Math.min(
      mouse.y - tooltip.offsetHeight / 2,
      bounds.height - tooltip.offsetHeight - 6
    ));
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.setProperty('--pointer-y', `${mouse.y - top}px`);
  };

  gd.addEventListener('mousemove', (event) => {
    const bounds = gd.getBoundingClientRect();
    mouse = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
    if (tooltip.style.display !== 'none') positionTooltip();
  });

  gd.on('plotly_hover', (eventData) => {
    const point = eventData.points && eventData.points[0];
    if (!point) return;
    const rows = [];
    if (point.source !== undefined && Array.isArray(point.customdata)) {
      rows.push(`${point.customdata[0]} → ${point.customdata[1]}`);
      rows.push(`# Papers: ${point.customdata[2]}`);
    } else {
      rows.push(String(point.label || ''));
      rows.push(`# Papers: ${point.customdata || 0}`);
    }
    tooltip.replaceChildren(...rows.map((text) => {
      const row = document.createElement('div');
      row.textContent = text;
      return row;
    }));
    tooltip.style.display = 'block';
    positionTooltip();
  });
  gd.on('plotly_unhover', () => { tooltip.style.display = 'none'; });
}
"""


def matching_bracket(source: str, start: int, opening: str, closing: str) -> int:
    """Return the matching closing-bracket index, ignoring bracket chars in strings."""
    depth = 0
    quote: str | None = None
    escaped = False
    for index in range(start, len(source)):
        char = source[index]
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in ('"', "'"):
            quote = char
        elif char == opening:
            depth += 1
        elif char == closing:
            depth -= 1
            if depth == 0:
                return index
    raise ValueError(f"Unclosed {opening!r} in columns.ts")


def object_literals(array_source: str) -> Iterator[str]:
    """Yield top-level object literals found inside a TypeScript array body."""
    depth = 0
    object_start: int | None = None
    quote: str | None = None
    escaped = False
    for index, char in enumerate(array_source):
        if quote:
            if escaped:
                escaped = False
            elif char == "\\":
                escaped = True
            elif char == quote:
                quote = None
            continue
        if char in ('"', "'"):
            quote = char
        elif char == "{":
            if depth == 0:
                object_start = index
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0 and object_start is not None:
                yield array_source[object_start : index + 1]
                object_start = None


def property_string(object_source: str, property_name: str) -> str:
    match = re.search(
        rf"\b{re.escape(property_name)}\s*:\s*(\"(?:\\.|[^\"\\])*\")",
        object_source,
    )
    if not match:
        raise ValueError(f"Could not read {property_name!r} from columns.ts")
    return json.loads(match.group(1))


def property_array(object_source: str, property_name: str) -> str:
    match = re.search(rf"\b{re.escape(property_name)}\s*:\s*\[", object_source)
    if not match:
        raise ValueError(f"Could not read {property_name!r} array from columns.ts")
    start = object_source.index("[", match.start())
    end = matching_bracket(object_source, start, "[", "]")
    return object_source[start + 1 : end]


def string_items(array_source: str) -> list[str]:
    return [json.loads(match.group(0)) for match in re.finditer(r'"(?:\\.|[^"\\])*"', array_source)]


def read_supergroups(columns_path: Path) -> list[dict[str, Any]]:
    source = columns_path.read_text(encoding="utf-8")
    assignment = re.search(r"\bSUPER_GROUPS\s*:[^=]+?=\s*\[", source)
    if not assignment:
        raise ValueError(f"Could not find SUPER_GROUPS in {columns_path}")

    # The declaration's type includes `SuperGroup[]`, so use the final `[` in
    # the assignment match (the array initializer), not the type's brackets.
    start = assignment.end() - 1
    end = matching_bracket(source, start, "[", "]")
    groups: list[dict[str, Any]] = []
    for supergroup_source in object_literals(source[start + 1 : end]):
        subgroup_data = []
        for subgroup_source in object_literals(property_array(supergroup_source, "groups")):
            subgroup_data.append(
                {
                    "label": property_string(subgroup_source, "label"),
                    "color": property_string(subgroup_source, "color"),
                    "columns": string_items(property_array(subgroup_source, "columns")),
                }
            )
        groups.append(
            {
                "label": property_string(supergroup_source, "label"),
                "color": property_string(supergroup_source, "color"),
                "groups": subgroup_data,
            }
        )
    return groups


def sankey_dimensions(supergroups: list[dict[str, Any]]) -> list[dict[str, Any]]:
    by_label = {item["label"]: item for item in supergroups}
    required = [
        "Domain Application",
        "Design Space",
        "Study Type",
        "Emotional Valence",
        "Outcome",
    ]

    def supergroup_dimension(label: str, excluded_columns: set[str] | None = None) -> dict[str, Any]:
        item = by_label.get(label)
        if item is None:
            raise ValueError(f"Could not find supergroup {label!r} in lib/columns.ts")
        excluded_columns = excluded_columns or set()
        categories = [
            column
            for group in item["groups"]
            for column in group["columns"]
            if column not in excluded_columns
        ]
        column_map = {column: [column] for column in categories}
        color_map = {
            column: group["color"]
            for group in item["groups"]
            for column in group["columns"]
            if column not in excluded_columns
        }
        return {
            "label": label,
            "categories": categories,
            "columns_by_category": column_map,
            "category_colors": color_map,
        }

    design_space = by_label.get("Design Space")
    if design_space is None:
        raise ValueError("Could not find supergroup 'Design Space' in lib/columns.ts")
    design_categories = [group["label"] for group in design_space["groups"]]
    design_dimension = {
        "label": "Design Space",
        "categories": design_categories,
        # A Design Space subgroup is active when any of its columns is marked X.
        "columns_by_category": {
            group["label"]: group["columns"] for group in design_space["groups"]
        },
        "category_colors": {
            group["label"]: group["color"] for group in design_space["groups"]
        },
    }

    study_method = by_label.get("Study Method")
    if study_method is None:
        raise ValueError("Could not find supergroup 'Study Method' in lib/columns.ts")
    study_type = next(
        (group for group in study_method["groups"] if group["label"] == "Study Type"),
        None,
    )
    if study_type is None:
        raise ValueError("Could not find subgroup 'Study Type' in lib/columns.ts")

    conceptual = by_label.get("Outcome")
    if conceptual is None:
        raise ValueError("Could not find supergroup 'Outcome' in lib/columns.ts")
    emotional_valence = next(
        (group for group in conceptual["groups"] if group["label"] == "Emotional Valence"),
        None,
    )
    if emotional_valence is None:
        raise ValueError("Could not find subgroup 'Emotional Valence' in lib/columns.ts")
    valence_columns = set(emotional_valence["columns"])

    dimensions = [
        supergroup_dimension("Domain Application"),
        design_dimension,
        {
            "label": "Study Type",
            "categories": study_type["columns"],
            "columns_by_category": {column: [column] for column in study_type["columns"]},
            "category_colors": {column: study_type["color"] for column in study_type["columns"]},
        },
        {
            "label": "Emotional Valence",
            "categories": emotional_valence["columns"],
            "columns_by_category": {
                column: [column] for column in emotional_valence["columns"]
            },
            "category_colors": {
                column: emotional_valence["color"] for column in emotional_valence["columns"]
            },
        },
        supergroup_dimension("Outcome", excluded_columns=valence_columns),
    ]
    for dimension, expected in zip(dimensions, required):
        if not dimension["categories"]:
            raise ValueError(f"No categories found for {expected!r} in lib/columns.ts")
    return dimensions


def is_marked(value: Any) -> bool:
    return isinstance(value, str) and value.strip().upper() == "X"


def rgba(hex_color: str, alpha: float = 0.28) -> str:
    value = hex_color.lstrip("#")
    if len(value) != 6:
        return f"rgba(120,120,120,{alpha})"
    red, green, blue = (int(value[index : index + 2], 16) for index in (0, 2, 4))
    return f"rgba({red},{green},{blue},{alpha})"


def build_figure(rows: list[dict[str, Any]], dimensions: list[dict[str, Any]]) -> go.Figure:
    data_columns = set().union(*(row.keys() for row in rows)) if rows else set()
    expected_columns = {
        column
        for dimension in dimensions
        for category_columns in dimension["columns_by_category"].values()
        for column in category_columns
    }
    missing_columns = sorted(expected_columns - data_columns)
    if missing_columns:
        raise ValueError(
            "Sankey categories reference columns missing from classtable.json: "
            + ", ".join(missing_columns)
        )

    node_labels: list[str] = []
    node_colors: list[str] = []
    node_x: list[float] = []
    node_y: list[float] = []
    node_ids: dict[tuple[int, str], int] = {}
    category_counts: Counter[tuple[int, str]] = Counter()
    side_padding = 0.06
    stage_span = 1.0 - 2.0 * side_padding

    for stage_index, dimension in enumerate(dimensions):
        categories = dimension["categories"]
        for category_index, category in enumerate(categories):
            node_id = len(node_labels)
            node_ids[(stage_index, category)] = node_id
            node_labels.append(category)
            node_colors.append(dimension["category_colors"][category])
            node_x.append(side_padding + stage_index * stage_span / (len(dimensions) - 1))
            node_y.append((category_index + 0.5) / len(categories))

    link_counts: Counter[tuple[int, int]] = Counter()
    for row in rows:
        active_by_stage: list[list[str]] = []
        for stage_index, dimension in enumerate(dimensions):
            active = [
                category
                for category in dimension["categories"]
                if any(
                    is_marked(row.get(column))
                    for column in dimension["columns_by_category"][category]
                )
            ]
            active_by_stage.append(active)
            for category in active:
                category_counts[(stage_index, category)] += 1

        for stage_index in range(len(dimensions) - 1):
            for source, target in product(active_by_stage[stage_index], active_by_stage[stage_index + 1]):
                link_counts[(node_ids[(stage_index, source)], node_ids[(stage_index + 1, target)])] += 1

    sources = [source for source, _ in link_counts]
    targets = [target for _, target in link_counts]
    values = list(link_counts.values())
    link_colors = [rgba(node_colors[source]) for source in sources]

    figure = go.Figure(
        data=[
            go.Sankey(
                arrangement="fixed",
                textfont=dict(size=22),
                node=dict(
                    pad=14,
                    thickness=18,
                    line=dict(color="white", width=0.5),
                    label=node_labels,
                    color=node_colors,
                    x=node_x,
                    y=node_y,
                    customdata=[
                        category_counts[(stage, category)]
                        for stage, dimension in enumerate(dimensions)
                        for category in dimension["categories"]
                    ],
                    hovertemplate="%{label}<br># Papers: %{customdata}<extra></extra>",
                ),
                link=dict(
                    source=sources,
                    target=targets,
                    value=values,
                    color=link_colors,
                    customdata=[
                        [node_labels[source], node_labels[target], value]
                        for source, target, value in zip(sources, targets, values)
                    ],
                    hovertemplate="%{customdata[0]} → %{customdata[1]}<br>Papers: %{customdata[2]}<extra></extra>",
                ),
            )
        ]
    )
    figure.update_layout(
        # title="Affective Stimuli Context, Design, and Methods Overview",
        font=dict(size=12),
        paper_bgcolor="white",
        plot_bgcolor="white",
        margin=dict(l=120, r=150, t=105, b=30),
        height=max(700, max(len(item["categories"]) for item in dimensions) * 34),
        annotations=[
            {
                "x": side_padding + index * stage_span / (len(dimensions) - 1),
                "y": 1.12,
                "xref": "paper",
                "yref": "paper",
                "text": dimension["label"].replace(" ", "<br>", 1),
                "showarrow": False,
                "xanchor": "center",
                "font": {"size": 22, "weight": "bold"},
            }
            for index, dimension in enumerate(dimensions)
        ],
    )
    return figure


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Create a Sankey diagram from classtable.json and the category definitions in lib/columns.ts."
    )
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA, help="Path to classtable.json.")
    parser.add_argument("--columns", type=Path, default=DEFAULT_COLUMNS, help="Path to lib/columns.ts.")
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT, help="Output HTML path.")
    args = parser.parse_args()

    rows = json.loads(args.data.read_text(encoding="utf-8"))
    if not isinstance(rows, list) or any(not isinstance(row, dict) for row in rows):
        raise ValueError(f"Expected a JSON list of paper objects in {args.data}")

    dimensions = sankey_dimensions(read_supergroups(args.columns))
    figure = build_figure(rows, dimensions)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    figure.write_html(
        str(args.output),
        include_plotlyjs="cdn",
        full_html=True,
        post_script=HOVER_TOOLTIP_SCRIPT,
    )
    print(f"Wrote Sankey diagram to {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
