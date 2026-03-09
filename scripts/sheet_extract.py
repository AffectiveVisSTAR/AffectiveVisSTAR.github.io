from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from urllib.parse import parse_qs, urlparse


class SheetExtractError(RuntimeError):
    pass


@dataclass(frozen=True)
class SourceInfo:
    kind: str  # "excel" | "url"
    sheet: str | None = None
    url: str | None = None
    other_matching_sheets: tuple[str, ...] = ()


def normalize_col_name(name: object) -> str:
    if name is None:
        return ""
    return " ".join(str(name).strip().lower().split())


def clean_cell_value(value: object) -> object:
    if value is None:
        return value
    if isinstance(value, str):
        cleaned = value.replace("\r\n", "\n").replace("\r", "\n").replace("\n", " ")
        return " ".join(cleaned.split())
    return value


def sanitize_dataframe_cells(df: "pd.DataFrame") -> "pd.DataFrame":
    return df.apply(lambda col: col.map(clean_cell_value))


def is_url(value: str) -> bool:
    try:
        parsed = urlparse(value)
    except Exception:
        return False
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def google_sheets_export_csv_url(url: str, gid: str | None) -> str:
    """
    Convert a Google Sheets share URL into a direct CSV export URL.
    If the URL already looks like an export URL, return it unchanged.
    """
    if "docs.google.com" not in url:
        return url

    parsed = urlparse(url)
    if "/export" in parsed.path and "format=csv" in parsed.query:
        return url

    match = re.search(r"/spreadsheets/d/([^/]+)", parsed.path)
    if not match:
        return url

    sheet_id = match.group(1)
    extracted_gid: str | None = None

    query_gid = parse_qs(parsed.query).get("gid", [None])[0]
    if isinstance(query_gid, str) and query_gid.strip():
        extracted_gid = query_gid.strip()
    if extracted_gid is None and parsed.fragment:
        frag_gid = parse_qs(parsed.fragment).get("gid", [None])[0]
        if isinstance(frag_gid, str) and frag_gid.strip():
            extracted_gid = frag_gid.strip()

    final_gid = (gid or extracted_gid or "0").strip()
    return f"https://docs.google.com/spreadsheets/d/{sheet_id}/export?format=csv&gid={final_gid}"


def resolve_columns(df: "pd.DataFrame", desired_columns: Iterable[str]) -> dict[str, str]:
    """
    Returns mapping of desired column name -> actual df column name.
    Matching is done by normalized column names (case/whitespace-insensitive).
    """
    norm_to_actual: dict[str, str] = {}
    for col in list(df.columns):
        norm = normalize_col_name(col)
        if norm and norm not in norm_to_actual:
            norm_to_actual[norm] = str(col)

    mapping: dict[str, str] = {}
    missing: list[str] = []
    for desired in desired_columns:
        norm = normalize_col_name(desired)
        actual = norm_to_actual.get(norm)
        if actual is None:
            missing.append(desired)
        else:
            mapping[desired] = actual

    if missing:
        available = ", ".join([str(c) for c in list(df.columns)])
        missing_str = ", ".join(missing)
        raise SheetExtractError(f"Missing required columns: {missing_str}. Available: {available}")

    return mapping


def extract_columns(
    df: "pd.DataFrame",
    desired_columns: list[str],
    *,
    output_columns: list[str] | None = None,
    drop_all_empty_rows: bool = True,
    sanitize_cells: bool = True,
) -> "pd.DataFrame":
    mapping = resolve_columns(df, desired_columns)
    selected = df[[mapping[c] for c in desired_columns]].copy()

    if output_columns is not None:
        if len(output_columns) != len(desired_columns):
            raise ValueError("output_columns must match desired_columns length")
        selected.columns = list(output_columns)
    else:
        selected.columns = list(desired_columns)

    if drop_all_empty_rows:
        selected = selected.dropna(how="all")
    if sanitize_cells:
        selected = sanitize_dataframe_cells(selected)

    return selected


def _find_excel_sheets_with_columns(
    sheets: dict[str, "pd.DataFrame"], required_columns: Iterable[str]
) -> list[tuple[str, dict[str, str]]]:
    required_norm = {normalize_col_name(c) for c in required_columns}
    matches: list[tuple[str, dict[str, str]]] = []

    for sheet_name, df in sheets.items():
        norm_to_actual: dict[str, str] = {}
        for col in list(df.columns):
            norm = normalize_col_name(col)
            if norm:
                norm_to_actual[norm] = str(col)
        if required_norm.issubset(norm_to_actual.keys()):
            matches.append((sheet_name, norm_to_actual))

    return matches


def read_dataframe(
    input_value: str | Path,
    *,
    sheet: str | None = None,
    gid: str | None = None,
    required_columns: list[str] | None = None,
) -> tuple["pd.DataFrame", SourceInfo]:
    """
    Reads either:
    - a local Excel file (.xlsx), optionally selecting a sheet, or auto-detecting a sheet by required_columns
    - a URL (Google Sheets URL or direct CSV URL), loaded via pandas.read_csv
    """
    try:
        import pandas as pd  # type: ignore
    except ImportError as e:
        raise SheetExtractError(f"pandas is required. Details: {e}") from e

    input_str = str(input_value).strip()

    if is_url(input_str):
        csv_url = google_sheets_export_csv_url(input_str, gid)
        try:
            df = pd.read_csv(csv_url)
        except Exception as e:
            raise SheetExtractError(
                "Failed to read URL. If this is a Google Sheet, ensure it is public/published."
            ) from e

        if required_columns is not None:
            _ = resolve_columns(df, required_columns)

        return df, SourceInfo(kind="url", url=csv_url, sheet=None, other_matching_sheets=())

    path = Path(input_str)
    if not path.exists():
        raise SheetExtractError(f"Input file not found: {path}")

    if required_columns is None:
        if sheet is None:
            raise SheetExtractError("For Excel input, either sheet or required_columns must be provided.")
        try:
            df = pd.read_excel(path, sheet_name=sheet)
        except Exception as e:
            raise SheetExtractError("Failed to read Excel sheet.") from e
        return df, SourceInfo(kind="excel", sheet=sheet, url=None, other_matching_sheets=())

    try:
        sheets = pd.read_excel(path, sheet_name=None)
    except Exception as e:
        raise SheetExtractError(
            "Failed to read Excel file. If this mentions 'openpyxl', install it."
        ) from e

    if sheet is not None:
        if sheet not in sheets:
            available = ", ".join(sheets.keys())
            raise SheetExtractError(f"Sheet not found: {sheet}. Available: {available}")
        df = sheets[sheet]
        _ = resolve_columns(df, required_columns)
        return df, SourceInfo(kind="excel", sheet=sheet, url=None, other_matching_sheets=())

    matches = _find_excel_sheets_with_columns(sheets, required_columns)
    if not matches:
        available = {name: [str(c) for c in list(df.columns)] for name, df in sheets.items()}
        raise SheetExtractError(
            "Could not find any Excel sheet containing all required columns. "
            f"Available sheets/columns: {available}"
        )

    sheet_name, _norm_to_actual = matches[0]
    other = tuple([m[0] for m in matches[1:]])
    return sheets[sheet_name], SourceInfo(kind="excel", sheet=sheet_name, url=None, other_matching_sheets=other)

