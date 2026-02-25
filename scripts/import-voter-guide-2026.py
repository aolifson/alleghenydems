#!/usr/bin/env python3
"""
Import the 2026 ACDC voter guide into Sanity as structured data.

Creates/updates:
  - voterGuide document (id: voter-guide-2026)
  - nested race -> district -> candidate fields
  - candidate photo assets extracted from the PDF when available

Usage:
  python3 scripts/import-voter-guide-2026.py
  python3 scripts/import-voter-guide-2026.py --dry-run
  python3 scripts/import-voter-guide-2026.py --skip-images
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import re
import urllib.error
import urllib.parse
import urllib.request
import uuid

try:
    from pypdf import PdfReader
except Exception:  # pragma: no cover - optional dependency at runtime
    PdfReader = None  # type: ignore


PROJECT_ID = os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID", "mfzgc4rr")
DATASET = os.environ.get("NEXT_PUBLIC_SANITY_DATASET", "production")
SANITY_API = f"https://{PROJECT_ID}.api.sanity.io/v2021-10-21"

DEFAULT_PDF = "/Users/alanolifson/programming/acdc/2026-ACDC-VoterGuide-Digital.pdf"
DEFAULT_TEXT = pathlib.Path(__file__).parent / "voter-guide-2026-extracted.txt"

STATUS_LISTED = "listed"
STATUS_ALSO = "alsoAppearing"
STATUS_APPEARING = "appearing"

LOCAL_ACDC_RACES = {
    "Representative in Congress",
    "Senator in the General Assembly",
    "Representative in the General Assembly",
}


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


def make_key() -> str:
    return uuid.uuid4().hex[:12]


def slugify(text: str) -> str:
    s = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return s or "item"


def clean_line(text: str) -> str:
    return " ".join(text.replace("\xa0", " ").strip().split())


def is_probable_name_line(text: str) -> bool:
    if not text:
        return False
    if any(text.startswith(prefix) for prefix in ("DISTRICT ", "TERM", "ANNUAL SALARY", "POWERS & DUTIES")):
        return False
    if text in {
        "REPRESENTATIVE IN THE",
        "ALSO APPEARING ON THE BALLOT:",
        "APPEARING ON THE BALLOT:",
        "ENDORSED by ACDC",
        "ENDORSED by PADems",
    }:
        return False
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return False
    uppercase_ratio = sum(1 for c in letters if c.isupper()) / len(letters)
    return uppercase_ratio > 0.9 and len(text.split()) <= 8


def to_url(value: str) -> str:
    value = clean_line(value)
    if not value:
        return ""
    if value.startswith("http://") or value.startswith("https://"):
        return value
    return f"https://{value}"


def join_text(lines: list[str]) -> str:
    cleaned = [clean_line(line) for line in lines if clean_line(line)]
    if not cleaned:
        return ""
    return " ".join(cleaned)


def split_pages(raw_text: str) -> dict[int, list[str]]:
    pages: dict[int, list[str]] = {}
    current_page: int | None = None

    for line in raw_text.splitlines():
        match = re.match(r"^===== PAGE (\d+) =====$", line.strip())
        if match:
            current_page = int(match.group(1))
            pages[current_page] = []
            continue
        if current_page is not None:
            pages[current_page].append(line.rstrip())
    return pages


def extract_stats_block(lines: list[str], term_index: int = 0) -> tuple[str, str, list[str]]:
    term_positions = [idx for idx, line in enumerate(lines) if clean_line(line) == "TERM"]
    if not term_positions:
        return "", "", []
    start = term_positions[term_index]

    term = ""
    salary = ""
    duties: list[str] = []

    idx = start + 1
    while idx < len(lines):
        line = clean_line(lines[idx])
        if line:
            term = line
            break
        idx += 1

    salary_label = next((i for i in range(start, len(lines)) if clean_line(lines[i]) == "ANNUAL SALARY"), None)
    if salary_label is not None:
        idx = salary_label + 1
        while idx < len(lines):
            line = clean_line(lines[idx])
            if line:
                salary = line
                break
            idx += 1

    duties_label = next((i for i in range(start, len(lines)) if clean_line(lines[i]) == "POWERS & DUTIES"), None)
    if duties_label is not None:
        idx = duties_label + 1
        while idx < len(lines):
            line = clean_line(lines[idx])
            if not line:
                idx += 1
                continue
            if line in {"TERM", "ANNUAL SALARY"}:
                break
            if re.match(r"^DISTRICT \d+", line):
                break
            if line in {
                "UNITED STATES SENATOR",
                "ATTORNEY GENERAL",
                "STATE TREASURER",
                "AUDITOR GENERAL",
            }:
                break
            if re.fullmatch(r"\d+", line):
                idx += 1
                continue

            if line.startswith("»"):
                duties.append(line.lstrip("» ").strip())
            elif duties:
                duties[-1] = f"{duties[-1]} {line}"
            idx += 1

    return term, salary, duties


def parse_candidates_and_districts(
    lines: list[str],
    source_page: int,
    default_district_label: str | None = None,
) -> list[dict]:
    districts: list[dict] = []
    current_district: dict | None = None
    district_description_lines: list[str] = []
    current_candidate: dict | None = None
    candidate_description_lines: list[str] = []
    status_mode = STATUS_LISTED
    candidate_order = 0

    def flush_candidate() -> None:
        nonlocal current_candidate, candidate_description_lines
        if current_candidate is None:
            return
        description = join_text(candidate_description_lines)
        if description:
            current_candidate["description"] = description
        if "candidates" not in current_district:
            current_district["candidates"] = []
        current_district["candidates"].append(current_candidate)
        current_candidate = None
        candidate_description_lines = []

    def flush_district() -> None:
        nonlocal current_district, district_description_lines
        if current_district is None:
            return
        description = join_text(district_description_lines)
        if description:
            current_district["districtDescription"] = description
        candidates = current_district.get("candidates", [])
        if candidates:
            current_district["displayOrder"] = len(districts)
            districts.append(current_district)
        current_district = None
        district_description_lines = []

    def ensure_district() -> None:
        nonlocal current_district
        if current_district is not None:
            return
        label = default_district_label or "STATEWIDE"
        current_district = {
            "_key": make_key(),
            "_type": "voterGuideDistrict",
            "districtLabel": label,
            "candidates": [],
        }

    for raw in lines:
        line = clean_line(raw)
        if not line:
            continue
        if re.fullmatch(r"\d+", line):
            continue
        if line.startswith("===== PAGE "):
            continue
        if line in {"ENDORSED by ACDC", "ENDORSED by PADems"}:
            continue
        if line in {
            "REPRESENTATIVE IN CONGRESS",
            "REPRESENTATIVE IN THE",
            "SENATOR IN THE",
            "GENERAL ASSEMBLY",
            "PRESIDENT OF THE UNITED STATES",
            "UNITED STATES SENATOR",
            "ATTORNEY GENERAL",
            "STATE TREASURER",
            "AUDITOR GENERAL",
            "ANNUAL SALARY",
            "POWERS & DUTIES",
            "TERM",
        }:
            flush_candidate()
            continue
        if line in {"ALSO APPEARING ON THE BALLOT:", "APPEARING ON THE BALLOT:"}:
            flush_candidate()
            status_mode = STATUS_ALSO if line.startswith("ALSO") else STATUS_APPEARING
            continue
        if line.startswith("DISTRICT "):
            flush_candidate()
            flush_district()
            current_district = {
                "_key": make_key(),
                "_type": "voterGuideDistrict",
                "districtLabel": line,
                "candidates": [],
            }
            status_mode = STATUS_LISTED
            continue
        if line in {"MAKE CHECKS OUT TO:", "FIGHT FOR DEMOCRACY,", "CONTRIBUTE TO ACDC NOW!"}:
            flush_candidate()
            continue
        if line.startswith("Allegheny County Democratic Committee"):
            flush_candidate()
            continue
        if line.startswith("APPLY AT VOTE.PA.GOV"):
            flush_candidate()
            continue
        if line == "SIGN UP FOR VOTE BY MAIL":
            flush_candidate()
            continue

        name = ""
        website = ""
        if "|" in line and not line.startswith("ALLEGHENYDEMS.COM"):
            left, right = line.split("|", 1)
            name = clean_line(left)
            website = to_url(right)
        elif is_probable_name_line(line):
            name = line

        if name:
            ensure_district()
            flush_candidate()
            current_candidate = {
                "_key": make_key(),
                "_type": "voterGuideCandidate",
                "name": name,
                "ballotStatus": status_mode,
                "displayOrder": candidate_order,
                "_sourcePage": source_page,
                "_sourceOrder": candidate_order,
            }
            if website:
                current_candidate["campaignWebsite"] = website
            candidate_order += 1
            continue

        if current_candidate is not None:
            candidate_description_lines.append(line)
        else:
            ensure_district()
            district_description_lines.append(line)

    flush_candidate()
    flush_district()
    return districts


def portable_blocks_from_page2(page2_lines: list[str]) -> list[dict]:
    paragraphs: list[str] = []
    current: list[str] = []
    for raw in page2_lines:
        line = clean_line(raw)
        if not line or line == "2":
            if current:
                paragraphs.append(" ".join(current))
                current = []
            continue
        current.append(line)
    if current:
        paragraphs.append(" ".join(current))

    blocks: list[dict] = []
    for paragraph in paragraphs:
        blocks.append(
            {
                "_type": "block",
                "_key": make_key(),
                "style": "normal",
                "markDefs": [],
                "children": [
                    {
                        "_type": "span",
                        "_key": make_key(),
                        "text": paragraph,
                        "marks": [],
                    }
                ],
            }
        )
    return blocks


def image_content_type(data: bytes) -> str:
    if data.startswith(b"\x89PNG"):
        return "image/png"
    if data.startswith(b"\xff\xd8\xff"):
        return "image/jpeg"
    if data.startswith(b"RIFF") and b"WEBP" in data[:16]:
        return "image/webp"
    return "image/jpeg"


def image_extension(content_type: str) -> str:
    return {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp",
    }.get(content_type, "jpg")


def request_json(token: str, method: str, path: str, body=None, content_type: str = "application/json"):
    url = f"{SANITY_API}{path}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": content_type}
    payload = body
    if isinstance(body, (dict, list)):
        payload = json.dumps(body).encode()
    request = urllib.request.Request(url, data=payload, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        response_body = response.read()
    return json.loads(response_body) if response_body else {}


def upload_image(token: str, image_bytes: bytes, filename: str) -> str | None:
    content_type = image_content_type(image_bytes)
    encoded_name = urllib.parse.quote(filename)
    path = f"/assets/images/{DATASET}?filename={encoded_name}"
    try:
        result = request_json(token, "POST", path, body=image_bytes, content_type=content_type)
    except urllib.error.HTTPError as err:
        snippet = err.read().decode(errors="ignore")[:300]
        print(f"  !! image upload failed ({filename}): HTTP {err.code} {snippet}")
        return None
    except urllib.error.URLError as err:
        print(f"  !! image upload failed ({filename}): {err}")
        return None
    document = result.get("document") if isinstance(result, dict) else None
    return document.get("_id") if isinstance(document, dict) else None


def build_races(pages: dict[int, list[str]]) -> list[dict]:
    page3 = pages.get(3, [])
    page4 = pages.get(4, [])
    page5 = pages.get(5, [])
    page6 = pages.get(6, [])
    page7 = pages.get(7, [])
    page8 = pages.get(8, [])
    page9 = pages.get(9, [])

    race_rep_congress = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "Representative in Congress",
        "displayOrder": 0,
    }
    term, salary, duties = extract_stats_block(page3, 0)
    race_rep_congress["term"] = term
    race_rep_congress["annualSalary"] = salary
    race_rep_congress["powersAndDuties"] = duties
    race_rep_congress["districts"] = parse_candidates_and_districts(page3, source_page=3)

    race_state_senate = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "Senator in the General Assembly",
        "displayOrder": 1,
    }
    term, salary, duties = extract_stats_block(page4, 0)
    race_state_senate["term"] = term
    race_state_senate["annualSalary"] = salary
    race_state_senate["powersAndDuties"] = duties
    race_state_senate["districts"] = parse_candidates_and_districts(page4, source_page=4)

    race_state_house = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "Representative in the General Assembly",
        "displayOrder": 2,
    }
    term, salary, duties = extract_stats_block(page5, 0)
    race_state_house["term"] = term
    race_state_house["annualSalary"] = salary
    race_state_house["powersAndDuties"] = duties
    race_state_house["districts"] = parse_candidates_and_districts(page5, source_page=5)

    president_term, president_salary, president_duties = extract_stats_block(page6, 0)
    senate_term, senate_salary, senate_duties = extract_stats_block(page6, 1)

    race_president = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "President of the United States",
        "term": president_term,
        "annualSalary": president_salary,
        "powersAndDuties": president_duties,
        "displayOrder": 3,
        "districts": [
            {
                "_key": make_key(),
                "_type": "voterGuideDistrict",
                "districtLabel": "STATEWIDE",
                "displayOrder": 0,
                "candidates": [],
            }
        ],
    }

    race_us_senate = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "United States Senator",
        "term": senate_term,
        "annualSalary": senate_salary,
        "powersAndDuties": senate_duties,
        "displayOrder": 4,
        "districts": [
            {
                "_key": make_key(),
                "_type": "voterGuideDistrict",
                "districtLabel": "STATEWIDE",
                "displayOrder": 0,
                "candidates": [],
            }
        ],
    }

    page6_candidates = parse_candidates_and_districts(page6, source_page=6, default_district_label="STATEWIDE")
    flattened_page6 = []
    for district in page6_candidates:
        flattened_page6.extend(district.get("candidates", []))
    by_name = {c["name"].upper(): c for c in flattened_page6}

    if "ROBERT P. CASEY, JR." in by_name:
        race_us_senate["districts"][0]["candidates"].append(by_name["ROBERT P. CASEY, JR."])
    if "JOSEPH R. BIDEN, JR." in by_name:
        race_president["districts"][0]["candidates"].append(by_name["JOSEPH R. BIDEN, JR."])

    race_attorney_general = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "Attorney General",
        "displayOrder": 5,
    }
    term, salary, duties = extract_stats_block(page7, 0)
    race_attorney_general["term"] = term
    race_attorney_general["annualSalary"] = salary
    race_attorney_general["powersAndDuties"] = duties
    race_attorney_general["districts"] = parse_candidates_and_districts(
        page7,
        source_page=7,
        default_district_label="STATEWIDE",
    )

    race_state_treasurer = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "State Treasurer",
        "displayOrder": 6,
    }
    term, salary, duties = extract_stats_block(page8, 0)
    race_state_treasurer["term"] = term
    race_state_treasurer["annualSalary"] = salary
    race_state_treasurer["powersAndDuties"] = duties
    race_state_treasurer["districts"] = parse_candidates_and_districts(
        page8,
        source_page=8,
        default_district_label="STATEWIDE",
    )

    race_auditor_general = {
        "_key": make_key(),
        "_type": "voterGuideRace",
        "officeTitle": "Auditor General",
        "displayOrder": 7,
    }
    term, salary, duties = extract_stats_block(page9, 0)
    race_auditor_general["term"] = term
    race_auditor_general["annualSalary"] = salary
    race_auditor_general["powersAndDuties"] = duties
    race_auditor_general["districts"] = parse_candidates_and_districts(
        page9,
        source_page=9,
        default_district_label="STATEWIDE",
    )

    races = [
        race_rep_congress,
        race_state_senate,
        race_state_house,
        race_president,
        race_us_senate,
        race_attorney_general,
        race_state_treasurer,
        race_auditor_general,
    ]

    for race in races:
        for district in race.get("districts", []):
            candidates = district.get("candidates", [])
            if not candidates:
                continue
            candidates.sort(key=lambda c: c.get("displayOrder", 999))
            for candidate in candidates:
                candidate.setdefault("ballotStatus", STATUS_LISTED)
    return races


def get_race_by_title(races: list[dict], title: str) -> dict:
    match = next((race for race in races if race.get("officeTitle") == title), None)
    if not match:
        raise RuntimeError(f"Could not find race with title: {title}")
    return match


def flatten_candidates(race: dict) -> list[dict]:
    result: list[dict] = []
    for district in race.get("districts", []):
        result.extend(district.get("candidates", []))
    return result


def flatten_listed_candidates(race: dict) -> list[dict]:
    result: list[dict] = []
    for district in race.get("districts", []):
        for candidate in district.get("candidates", []):
            if candidate.get("ballotStatus") == STATUS_LISTED:
                result.append(candidate)
    return result


def apply_acdc_endorsements(races: list[dict]) -> None:
    # Clear existing flags first.
    for race in races:
        for district in race.get("districts", []):
            for candidate in district.get("candidates", []):
                candidate["endorsedByAcdc"] = False

    # In the PDF, endorsements are shown for the lead listed candidate in each local district.
    for race in races:
        if race.get("officeTitle") not in LOCAL_ACDC_RACES:
            continue
        for district in race.get("districts", []):
            listed = [
                candidate
                for candidate in district.get("candidates", [])
                if candidate.get("ballotStatus") == STATUS_LISTED
            ]
            if listed:
                listed[0]["endorsedByAcdc"] = True


def extract_images_by_page(pdf_path: str) -> dict[int, list[bytes]]:
    if PdfReader is None:
        print("  ! pypdf is not installed; skipping photo extraction")
        return {}
    reader = PdfReader(pdf_path)
    images_by_page: dict[int, list[bytes]] = {}
    for page_index, page in enumerate(reader.pages, start=1):
        page_images = list(page.images)
        if not page_images:
            continue

        def image_key(image_obj):
            name = getattr(image_obj, "name", "") or ""
            match = re.search(r"(\d+)", name)
            return int(match.group(1)) if match else 99999

        ordered = sorted(page_images, key=image_key)
        images_by_page[page_index] = [img.data for img in ordered]
    return images_by_page


def apply_photos(token: str, races: list[dict], images_by_page: dict[int, list[bytes]], skip_images: bool) -> None:
    if skip_images:
        return
    if not images_by_page:
        return

    mapping: list[tuple[int, list[dict], int | None]] = [
        (3, flatten_listed_candidates(get_race_by_title(races, "Representative in Congress")), None),
        (4, flatten_listed_candidates(get_race_by_title(races, "Senator in the General Assembly")), None),
        (5, flatten_listed_candidates(get_race_by_title(races, "Representative in the General Assembly")), None),
        (
            6,
            flatten_listed_candidates(get_race_by_title(races, "United States Senator"))
            + flatten_listed_candidates(get_race_by_title(races, "President of the United States")),
            None,
        ),
        (7, flatten_listed_candidates(get_race_by_title(races, "Attorney General")), 4),
        (8, flatten_listed_candidates(get_race_by_title(races, "State Treasurer")), 1),
    ]

    for page_num, candidates, max_upload in mapping:
        page_images = images_by_page.get(page_num, [])
        if not page_images or not candidates:
            continue
        usable_count = min(len(page_images), len(candidates))
        if max_upload is not None:
            usable_count = min(usable_count, max_upload)

        print(f"  -> assigning photos from page {page_num}: {usable_count} candidate(s)")
        for index in range(usable_count):
            candidate = candidates[index]
            image_bytes = page_images[index]
            filename = f"{page_num:02d}-{index+1:02d}-{slugify(candidate['name'])}.jpg"
            asset_id = upload_image(token, image_bytes, filename)
            if not asset_id:
                continue
            candidate["photo"] = {
                "_type": "image",
                "asset": {"_type": "reference", "_ref": asset_id},
                "alt": candidate["name"],
            }


def strip_import_only_fields(races: list[dict]) -> None:
    for race in races:
        for district in race.get("districts", []):
            for candidate in district.get("candidates", []):
                candidate.pop("_sourcePage", None)
                candidate.pop("_sourceOrder", None)


def summarize(races: list[dict]) -> None:
    print("\nSummary:")
    total_candidates = 0
    for race in races:
        count = sum(len(d.get("candidates", [])) for d in race.get("districts", []))
        total_candidates += count
        print(f"  - {race['officeTitle']}: {count} candidate(s), {len(race.get('districts', []))} district(s)")
    print(f"  Total candidates: {total_candidates}")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pdf", default=DEFAULT_PDF, help="Path to voter guide PDF")
    parser.add_argument(
        "--text",
        default=str(DEFAULT_TEXT),
        help="Path to extracted text file (from pypdf extraction)",
    )
    parser.add_argument("--dry-run", action="store_true", help="Build and print summary only")
    parser.add_argument("--skip-images", action="store_true", help="Do not extract/upload candidate photos")
    args = parser.parse_args()

    env_path = pathlib.Path(__file__).resolve().parent.parent / ".env.local"
    env = load_env(env_path)

    token = env.get("SANITY_API_TOKEN") or os.environ.get("SANITY_API_TOKEN")
    if not token and not args.dry_run:
        raise SystemExit("ERROR: SANITY_API_TOKEN not found in .env.local or environment")

    text_path = pathlib.Path(args.text)
    if not text_path.exists():
        raise SystemExit(f"ERROR: extracted text file not found: {text_path}")

    raw_text = text_path.read_text()
    pages = split_pages(raw_text)
    missing_pages = [page for page in range(2, 10) if page not in pages]
    if missing_pages:
        raise SystemExit(f"ERROR: missing pages in extracted text: {missing_pages}")

    races = build_races(pages)
    apply_acdc_endorsements(races)
    summarize(races)

    if args.dry_run:
        return

    images_by_page = extract_images_by_page(args.pdf)
    apply_photos(token, races, images_by_page, skip_images=args.skip_images)
    strip_import_only_fields(races)

    document = {
        "_id": "voter-guide-2026",
        "_type": "voterGuide",
        "title": "2026 Endorsement Voter Guide",
        "slug": {"_type": "slug", "current": "voter-guide-2026"},
        "cycleYear": 2026,
        "heroHeadline": "2026 Endorsement Voter Guide",
        "heroSubhead": "Allegheny County Democratic Committee",
        "sourcePdfTitle": pathlib.Path(args.pdf).name,
        "intro": portable_blocks_from_page2(pages[2]),
        "races": races,
    }

    mutation = {
        "mutations": [
            {
                "createOrReplace": document
            }
        ],
        "returnIds": True,
    }

    print("\nUploading voter guide document to Sanity...")
    try:
        response = request_json(token, "POST", f"/data/mutate/{DATASET}", body=mutation)
    except urllib.error.HTTPError as err:
        snippet = err.read().decode(errors="ignore")[:500]
        raise SystemExit(f"ERROR: Sanity mutation failed with HTTP {err.code}: {snippet}")
    except urllib.error.URLError as err:
        raise SystemExit(f"ERROR: Sanity mutation failed: {err}")

    results = response.get("results", [])
    print(f"Done. Mutation result count: {len(results)}")
    if results:
        print(f"Document id: {results[0].get('id', 'voter-guide-2026')}")


if __name__ == "__main__":
    main()
