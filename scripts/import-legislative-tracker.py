#!/usr/bin/env python3
"""
Import legislative tracker content into Sanity.

Usage:
  python3 scripts/import-legislative-tracker.py
  python3 scripts/import-legislative-tracker.py --dry-run
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import urllib.error
import urllib.parse
import urllib.request
import uuid


DEFAULT_SEED = pathlib.Path(__file__).resolve().parent / "data" / "legislative-tracker-seed.json"


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


def request_json(project_id: str, token: str, method: str, path: str, body: dict | list | None = None) -> dict:
    base_url = f"https://{project_id}.api.sanity.io/v2021-10-21"
    url = f"{base_url}{path}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=payload, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read() or b"{}")


def typed_items(rows: list[dict], item_type: str) -> list[dict]:
    out: list[dict] = []
    for idx, row in enumerate(rows):
        item = {k: v for k, v in row.items() if v is not None}
        item["_type"] = item_type
        item["_key"] = item.get("_key") or make_key()
        item.setdefault("displayOrder", idx)
        out.append(item)
    return out


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--seed", default=str(DEFAULT_SEED))
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

    seed_path = pathlib.Path(args.seed)
    if not seed_path.exists():
        raise SystemExit(f"ERROR: seed file not found: {seed_path}")
    seed = json.loads(seed_path.read_text())

    actions = typed_items(seed.get("actions", []), "legislativeAction")
    local_entries = typed_items(seed.get("localEntries", []), "legislativeLocalEntry")
    links = typed_items(seed.get("districtLookupLinks", []), "legislativeExternalLink")
    officials = typed_items(seed.get("republicanOfficials", []), "legislativeOfficialRow")

    document = {
        "_id": "legislative-tracker",
        "_type": "legislativeTracker",
        "title": seed.get("title") or "Legislative Tracker",
        "slug": {"_type": "slug", "current": seed.get("slug") or "legislative-tracker"},
        "heroHeadline": seed.get("heroHeadline") or "Legislative Tracker",
        "heroSubhead": seed.get("heroSubhead") or "",
        "categories": seed.get("categories") or [],
        "actions": actions,
        "localEntries": local_entries,
        "districtLookupIntro": seed.get("districtLookupIntro")
        or "Not sure who represents you? Use these official tools to look up your state and county districts by address:",
        "districtLookupLinks": links,
        "officialTableIntro": seed.get("officialTableIntro")
        or "Below is a quick reference for which Republican state legislators represent parts of Allegheny County.",
        "republicanOfficials": officials,
        "aboutTitle": seed.get("aboutTitle") or "About this page",
        "aboutBody": seed.get("aboutBody") or "",
        "lastUpdatedNote": seed.get("lastUpdatedNote") or "",
    }

    print("Prepared legislative tracker document:")
    print(f"  title: {document['title']}")
    print(f"  actions: {len(actions)}")
    print(f"  local entries: {len(local_entries)}")
    print(f"  district links: {len(links)}")
    print(f"  official rows: {len(officials)}")

    if args.dry_run:
        print("Dry run only: no Sanity write performed.")
        return

    mutation = {"mutations": [{"createOrReplace": document}], "returnIds": True}
    try:
        response = request_json(project_id, token, "POST", f"/data/mutate/{dataset}", mutation)
    except urllib.error.HTTPError as err:
        snippet = err.read().decode(errors="ignore")[:500]
        raise SystemExit(f"ERROR: Sanity mutation failed with HTTP {err.code}: {snippet}")
    except urllib.error.URLError as err:
        raise SystemExit(f"ERROR: Sanity mutation failed: {err}")

    results = response.get("results", [])
    print(f"Done. Mutation result count: {len(results)}")
    if results:
        print(f"Document id: {results[0].get('id', 'legislative-tracker')}")


if __name__ == "__main__":
    main()
