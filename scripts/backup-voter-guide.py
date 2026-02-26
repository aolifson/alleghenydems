#!/usr/bin/env python3
"""
Backup a voterGuide document from Sanity to a local JSON snapshot.

Usage:
  python3 scripts/backup-voter-guide.py
  python3 scripts/backup-voter-guide.py --document-id voter-guide-2026
  python3 scripts/backup-voter-guide.py --out scripts/backups/voter-guide-2026.json
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import urllib.error
import urllib.parse
import urllib.request


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


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--document-id", default="voter-guide-2026")
    parser.add_argument("--out", help="Output JSON file path. Defaults to scripts/backups/<doc>-<timestamp>.json")
    args = parser.parse_args()

    repo_root = pathlib.Path(__file__).resolve().parent.parent
    env = load_env(repo_root / ".env.local")

    project_id = env.get("NEXT_PUBLIC_SANITY_PROJECT_ID") or os.environ.get("NEXT_PUBLIC_SANITY_PROJECT_ID")
    dataset = env.get("NEXT_PUBLIC_SANITY_DATASET") or os.environ.get("NEXT_PUBLIC_SANITY_DATASET") or "production"
    token = env.get("SANITY_API_TOKEN") or os.environ.get("SANITY_API_TOKEN")

    if not project_id:
        raise SystemExit("ERROR: NEXT_PUBLIC_SANITY_PROJECT_ID not found in .env.local or environment")

    try:
        document = fetch_document(project_id, dataset, token, args.document_id)
    except urllib.error.HTTPError as err:
        snippet = err.read().decode(errors="ignore")[:500]
        raise SystemExit(f"ERROR: failed to fetch document (HTTP {err.code}): {snippet}")
    except urllib.error.URLError as err:
        raise SystemExit(f"ERROR: failed to fetch document: {err}")

    backup_dir = repo_root / "scripts" / "backups"
    backup_dir.mkdir(parents=True, exist_ok=True)

    if args.out:
        output_path = pathlib.Path(args.out)
    else:
        timestamp = dt.datetime.now(tz=dt.timezone.utc).strftime("%Y%m%d-%H%M%S")
        output_path = backup_dir / f"{args.document_id}-{timestamp}.json"

    output_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "metadata": {
            "backedUpAt": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
            "projectId": project_id,
            "dataset": dataset,
            "documentId": args.document_id,
        },
        "document": document,
    }
    output_path.write_text(json.dumps(payload, indent=2))

    print(f"Backup created: {output_path}")
    print(f"Document id: {document.get('_id')}")
    print(f"Document type: {document.get('_type')}")


if __name__ == "__main__":
    main()
