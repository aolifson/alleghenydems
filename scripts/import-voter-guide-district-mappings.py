#!/usr/bin/env python3
"""
Populate voter-guide district lookup fields from official Allegheny district data.

What it updates on voter-guide local races:
  - district.searchTerms (municipality aliases)
  - district.zipCodes (Allegheny ZIP crosswalk + fallback seeds)

Usage:
  python3 scripts/import-voter-guide-district-mappings.py
  python3 scripts/import-voter-guide-district-mappings.py --dry-run
"""

from __future__ import annotations

import argparse
import collections
import csv
import json
import os
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request


SOURCE_FILE = pathlib.Path(__file__).resolve().parent / "data" / "allegheny-precinct-directory-2026.txt"
CENSUS_REL_DIR = pathlib.Path(__file__).resolve().parent / "data" / "census-rel"
CROSSWALK_FILE = pathlib.Path(__file__).resolve().parent / "data" / "allegheny-zip-district-crosswalk.json"
TARGET_DOCUMENT_ID = "voter-guide-2026"

RACE_CODE_BY_TITLE = {
    "Representative in Congress": "congress",
    "Senator in the General Assembly": "senate",
    "Representative in the General Assembly": "house",
}

# Seed ZIP mappings are used as fallback/additions.
ZIP_SEED_ROWS = [
    {"zip": "15238", "congress": "17", "senate": "38", "house": "33"},
]

LINE_RE = re.compile(
    r"^(?P<c_name>.+?) - [DR](?P<c_num>\d{2})(?P<s_name>.+?) - [DR](?P<s_num>\d{2})"
    r"(?P<h_name>.+?)(?: - )?(?:[DR])?(?P<h_num>\d{3})(?P<municipality>[A-Z'\.\-\s]+)$"
)

RACE_CROSSWALK_FILES = {
    "congress": ("tab20_cd11820_zcta520_natl.txt", "GEOID_CD118_20"),
    "senate": ("tab20_sldu202420_zcta520_natl.txt", "GEOID_SLDU2024_20"),
    "house": ("tab20_sldl202420_zcta520_natl.txt", "GEOID_SLDL2024_20"),
}

COUNTY_CROSSWALK_FILE = "tab20_zcta520_county20_natl.txt"
ALLEGHENY_COUNTY_GEOID = "42003"


def load_env(path: pathlib.Path) -> dict[str, str]:
    env: dict[str, str] = {}
    if not path.exists():
        return env
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    return env


def request_json(
    project_id: str,
    token: str | None,
    method: str,
    path: str,
    body: dict | list | None = None,
) -> dict:
    base_url = f"https://{project_id}.api.sanity.io/v2021-10-21"
    url = f"{base_url}{path}"
    headers: dict[str, str] = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    payload = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=payload, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read() or b"{}")


def fetch_document(project_id: str, dataset: str, token: str | None, document_id: str) -> dict:
    encoded_id = urllib.parse.quote(document_id, safe="")
    response = request_json(project_id, token, "GET", f"/data/doc/{dataset}/{encoded_id}")
    documents = response.get("documents", [])
    if not documents:
        raise SystemExit(f"ERROR: document not found: {document_id}")
    return documents[0]


def mutate_document(project_id: str, dataset: str, token: str, document: dict) -> dict:
    mutation = {"mutations": [{"createOrReplace": document}], "returnIds": True}
    return request_json(project_id, token, "POST", f"/data/mutate/{dataset}", mutation)


def normalize_space(value: str) -> str:
    return " ".join(value.replace("\xa0", " ").split()).strip()


def smart_word(token: str) -> str:
    upper = token.upper()
    if upper == "TWP":
        return "Twp"
    if upper == "BOROUGH":
        return "Borough"
    if upper == "CITY":
        return "City"
    if upper in {"ST", "ST."}:
        return "St."

    parts = upper.lower().split("'")
    titled = "'".join(part.capitalize() for part in parts)
    if titled.startswith("Mc") and len(titled) > 2:
        titled = "Mc" + titled[2:].capitalize()
    return titled


def humanize(value: str) -> str:
    return " ".join(smart_word(token) for token in value.split())


def municipality_aliases(raw: str) -> list[str]:
    upper = normalize_space(raw).upper()
    if not upper:
        return []

    variants = {upper}
    if upper.endswith(" TWP"):
        variants.add(upper[:-4] + " TOWNSHIP")
    if upper.endswith(" TOWNSHIP"):
        variants.add(upper[:-9] + " TWP")

    for value in list(variants):
        for suffix in (" TWP", " TOWNSHIP", " BOROUGH", " CITY"):
            if value.endswith(suffix):
                variants.add(value[: -len(suffix)])

    expanded = set()
    for value in variants:
        expanded.add(value)
        if value.startswith("MOUNT "):
            expanded.add("MT " + value[6:])
        if value.startswith("MT "):
            expanded.add("MOUNT " + value[3:])
        if value.startswith("ST. "):
            expanded.add("SAINT " + value[4:])
        if value.startswith("SAINT "):
            expanded.add("ST. " + value[6:])

    return sorted(humanize(v) for v in expanded if len(v.strip()) >= 2)


def merge_unique(existing: list[str], incoming: list[str], *, normalize_fn) -> tuple[list[str], int]:
    output: list[str] = []
    seen: set[str] = set()

    for value in existing:
        key = normalize_fn(value)
        if not key or key in seen:
            continue
        output.append(value)
        seen.add(key)

    added = 0
    for value in incoming:
        key = normalize_fn(value)
        if not key or key in seen:
            continue
        output.append(value)
        seen.add(key)
        added += 1

    return output, added


def parse_source_file(path: pathlib.Path) -> tuple[dict[str, dict[str, set[str]]], int]:
    if not path.exists():
        raise SystemExit(f"ERROR: source file not found: {path}")

    by_race: dict[str, dict[str, set[str]]] = {
        "congress": collections.defaultdict(set),
        "senate": collections.defaultdict(set),
        "house": collections.defaultdict(set),
    }

    parsed_lines = 0
    for raw in path.read_text().splitlines():
        line = normalize_space(raw)
        if not line:
            continue
        match = LINE_RE.match(line)
        if not match:
            continue
        parsed_lines += 1

        municipality = match.group("municipality").strip()
        terms = municipality_aliases(municipality)

        congress_num = str(int(match.group("c_num")))
        senate_num = str(int(match.group("s_num")))
        house_num = str(int(match.group("h_num")))

        by_race["congress"][congress_num].update(terms)
        by_race["senate"][senate_num].update(terms)
        by_race["house"][house_num].update(terms)

    return by_race, parsed_lines


def zip_seed_map() -> dict[str, dict[str, set[str]]]:
    by_race: dict[str, dict[str, set[str]]] = {
        "congress": collections.defaultdict(set),
        "senate": collections.defaultdict(set),
        "house": collections.defaultdict(set),
    }
    for row in ZIP_SEED_ROWS:
        zip_code = str(row.get("zip", "")).strip()
        if not re.fullmatch(r"\d{5}", zip_code):
            continue
        for race_code in ("congress", "senate", "house"):
            district = str(row.get(race_code, "")).strip()
            if district:
                by_race[race_code][district].add(zip_code)
    return by_race


def parse_float(value: str | None) -> float:
    try:
        return float(value or 0)
    except ValueError:
        return 0.0


def parse_allegheny_zips(census_dir: pathlib.Path) -> set[str]:
    county_path = census_dir / COUNTY_CROSSWALK_FILE
    if not county_path.exists():
        return set()

    zips: set[str] = set()
    with county_path.open(newline="") as handle:
        reader = csv.DictReader(handle, delimiter="|")
        for row in reader:
            if (row.get("GEOID_COUNTY_20") or "").strip() != ALLEGHENY_COUNTY_GEOID:
                continue
            land = parse_float(row.get("AREALAND_PART"))
            water = parse_float(row.get("AREAWATER_PART"))
            if land <= 0 and water <= 0:
                continue
            zip_code = (row.get("GEOID_ZCTA5_20") or "").strip()
            if re.fullmatch(r"\d{5}", zip_code):
                zips.add(zip_code)
    return zips


def zip_map_from_census(census_dir: pathlib.Path) -> dict[str, dict[str, set[str]]]:
    allegheny_zips = parse_allegheny_zips(census_dir)
    by_race: dict[str, dict[str, set[str]]] = {
        "congress": collections.defaultdict(set),
        "senate": collections.defaultdict(set),
        "house": collections.defaultdict(set),
    }
    if not allegheny_zips:
        return by_race

    for race_code, (filename, district_field) in RACE_CROSSWALK_FILES.items():
        path = census_dir / filename
        if not path.exists():
            continue

        with path.open(newline="") as handle:
            reader = csv.DictReader(handle, delimiter="|")
            for row in reader:
                zip_code = (row.get("GEOID_ZCTA5_20") or "").strip()
                if zip_code not in allegheny_zips:
                    continue

                geoid = (row.get(district_field) or "").strip()
                if not geoid.startswith("42"):
                    continue

                land = parse_float(row.get("AREALAND_PART"))
                water = parse_float(row.get("AREAWATER_PART"))
                if land <= 0 and water <= 0:
                    continue

                district_num = geoid[2:]
                if not district_num.isdigit():
                    continue
                district_num = str(int(district_num))
                by_race[race_code][district_num].add(zip_code)

    return by_race


def zip_map_from_crosswalk(path: pathlib.Path) -> dict[str, dict[str, set[str]]]:
    by_race: dict[str, dict[str, set[str]]] = {
        "congress": collections.defaultdict(set),
        "senate": collections.defaultdict(set),
        "house": collections.defaultdict(set),
    }
    if not path.exists():
        return by_race

    payload = json.loads(path.read_text())
    races = payload.get("races", {}) if isinstance(payload, dict) else {}
    if not isinstance(races, dict):
        return by_race

    for race_code in ("congress", "senate", "house"):
        race_map = races.get(race_code, {})
        if not isinstance(race_map, dict):
            continue
        for district_num, zip_codes in race_map.items():
            district = str(district_num).strip()
            if not district.isdigit():
                continue
            values = zip_codes if isinstance(zip_codes, list) else []
            for zip_code in values:
                code = str(zip_code).strip()
                if re.fullmatch(r"\d{5}", code):
                    by_race[race_code][str(int(district))].add(code)
    return by_race


def merge_zip_maps(
    primary: dict[str, dict[str, set[str]]],
    fallback: dict[str, dict[str, set[str]]],
) -> dict[str, dict[str, set[str]]]:
    merged: dict[str, dict[str, set[str]]] = {
        "congress": collections.defaultdict(set),
        "senate": collections.defaultdict(set),
        "house": collections.defaultdict(set),
    }
    for race_code in ("congress", "senate", "house"):
        for district, zips in primary.get(race_code, {}).items():
            merged[race_code][district].update(zips)
        for district, zips in fallback.get(race_code, {}).items():
            merged[race_code][district].update(zips)
    return merged


def district_number(label: str) -> str | None:
    match = re.search(r"\d+", label or "")
    if not match:
        return None
    return str(int(match.group(0)))


def sanitize_for_write(document: dict) -> dict:
    output = json.loads(json.dumps(document))
    output.pop("_rev", None)
    output.pop("_updatedAt", None)
    output.pop("_createdAt", None)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--document-id", default=TARGET_DOCUMENT_ID)
    parser.add_argument("--source-file", default=str(SOURCE_FILE))
    parser.add_argument("--census-rel-dir", default=str(CENSUS_REL_DIR))
    parser.add_argument("--crosswalk-file", default=str(CROSSWALK_FILE))
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    repo_root = pathlib.Path(__file__).resolve().parent.parent
    env = load_env(repo_root / ".env.local")

    project_id = env.get("NEXT_PUBLIC_SANITY_PROJECT_ID") or os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID")
    dataset = env.get("NEXT_PUBLIC_SANITY_DATASET") or os.environ.get("NEXT_PUBLIC_SANITY_DATASET") or "production"
    token = env.get("SANITY_API_TOKEN") or os.environ.get("SANITY_API_TOKEN")

    if not project_id:
        raise SystemExit("ERROR: NEXT_PUBLIC_SANITY_PROJECT_ID not found in .env.local or environment")
    if not token and not args.dry_run:
        raise SystemExit("ERROR: SANITY_API_TOKEN not found in .env.local or environment")

    source_map, parsed_lines = parse_source_file(pathlib.Path(args.source_file))
    zip_map_crosswalk = zip_map_from_crosswalk(pathlib.Path(args.crosswalk_file))
    zip_map_census = zip_map_from_census(pathlib.Path(args.census_rel_dir))
    zip_map = merge_zip_maps(zip_map_crosswalk, zip_map_census)
    zip_map = merge_zip_maps(zip_map, zip_seed_map())

    total_zip_district_pairs = sum(len(districts) for districts in zip_map.values())
    total_unique_zips = len(
        {
            zip_code
            for districts in zip_map.values()
            for zips in districts.values()
            for zip_code in zips
        }
    )
    print(f"ZIP mapping districts loaded: {total_zip_district_pairs}")
    print(f"Unique ZIP codes loaded across local races: {total_unique_zips}")

    try:
        document = fetch_document(project_id, dataset, token, args.document_id)
    except urllib.error.HTTPError as err:
        snippet = err.read().decode(errors="ignore")[:500]
        raise SystemExit(f"ERROR: failed to fetch document (HTTP {err.code}): {snippet}")
    except urllib.error.URLError as err:
        raise SystemExit(f"ERROR: failed to fetch document: {err}")

    races = document.get("races", [])
    if not isinstance(races, list):
        raise SystemExit("ERROR: voter guide document does not contain a races array")

    terms_added_total = 0
    zips_added_total = 0
    districts_touched = 0
    districts_seen = 0

    for race in races:
        office_title = race.get("officeTitle", "")
        race_code = RACE_CODE_BY_TITLE.get(office_title)
        if not race_code:
            continue

        for district in race.get("districts", []):
            label = district.get("districtLabel", "")
            number = district_number(label)
            if not number:
                continue

            districts_seen += 1

            incoming_terms = sorted(source_map[race_code].get(number, set()))
            existing_terms = list(district.get("searchTerms") or [])
            merged_terms, terms_added = merge_unique(
                existing_terms,
                incoming_terms,
                normalize_fn=lambda v: normalize_space(v).lower(),
            )
            if terms_added > 0:
                district["searchTerms"] = merged_terms
                terms_added_total += terms_added

            incoming_zips = sorted(zip_map[race_code].get(number, set()))
            existing_zips = list(district.get("zipCodes") or [])
            merged_zips, zips_added = merge_unique(
                existing_zips,
                incoming_zips,
                normalize_fn=lambda v: re.sub(r"\D", "", v),
            )
            if zips_added > 0:
                district["zipCodes"] = merged_zips
                zips_added_total += zips_added

            if terms_added > 0 or zips_added > 0:
                districts_touched += 1

    print(f"Source rows parsed: {parsed_lines}")
    print(f"Districts scanned in target races: {districts_seen}")
    print(f"Districts updated: {districts_touched}")
    print(f"Search terms added: {terms_added_total}")
    print(f"ZIP codes added: {zips_added_total}")

    if args.dry_run:
        print("Dry run only: no Sanity write performed.")
        return

    write_doc = sanitize_for_write(document)
    try:
        response = mutate_document(project_id, dataset, token, write_doc)
    except urllib.error.HTTPError as err:
        snippet = err.read().decode(errors="ignore")[:500]
        raise SystemExit(f"ERROR: failed to mutate document (HTTP {err.code}): {snippet}")
    except urllib.error.URLError as err:
        raise SystemExit(f"ERROR: failed to mutate document: {err}")

    results = response.get("results", [])
    print(f"Mutation complete. Result count: {len(results)}")
    if results:
        print(f"Document id: {results[0].get('id', args.document_id)}")


if __name__ == "__main__":
    main()
