#!/usr/bin/env python3
"""
Restore a voterGuide document from a backup JSON snapshot.

Usage:
  python3 scripts/restore-voter-guide.py scripts/backups/voter-guide-2026-YYYYMMDD-HHMMSS.json --dry-run
  python3 scripts/restore-voter-guide.py scripts/backups/voter-guide-2026-YYYYMMDD-HHMMSS.json
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import urllib.error
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
    token: str,
    method: str,
    path: str,
    body: dict | list | None = None,
) -> dict:
    base_url = f"https://{project_id}.api.sanity.io/v2021-10-21"
    url = f"{base_url}{path}"
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    payload = json.dumps(body).encode() if body is not None else None
    request = urllib.request.Request(url, data=payload, headers=headers, method=method)
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.loads(response.read() or b"{}")


def load_backup(path: pathlib.Path) -> dict:
    if not path.exists():
        raise SystemExit(f"ERROR: backup file not found: {path}")
    raw = json.loads(path.read_text())
    if isinstance(raw, dict) and isinstance(raw.get("document"), dict):
        return raw["document"]
    if isinstance(raw, dict) and raw.get("_id"):
        return raw
    raise SystemExit("ERROR: backup JSON must contain either top-level document fields or {\"document\": {...}}")


def sanitize_for_write(document: dict) -> dict:
    output = json.loads(json.dumps(document))
    output.pop("_rev", None)
    output.pop("_updatedAt", None)
    output.pop("_createdAt", None)
    return output


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("backup_file", help="Path to backup file created by scripts/backup-voter-guide.py")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print target document id without writing")
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

    document = sanitize_for_write(load_backup(pathlib.Path(args.backup_file)))
    document_id = document.get("_id")
    if not document_id:
        raise SystemExit("ERROR: backup document has no _id")

    print(f"Ready to restore document: {document_id}")
    if args.dry_run:
        print("Dry run only: no Sanity write performed.")
        return

    mutation = {"mutations": [{"createOrReplace": document}], "returnIds": True}
    try:
        response = request_json(project_id, token, "POST", f"/data/mutate/{dataset}", mutation)
    except urllib.error.HTTPError as err:
        snippet = err.read().decode(errors="ignore")[:500]
        raise SystemExit(f"ERROR: failed to restore document (HTTP {err.code}): {snippet}")
    except urllib.error.URLError as err:
        raise SystemExit(f"ERROR: failed to restore document: {err}")

    results = response.get("results", [])
    print(f"Restore complete. Result count: {len(results)}")
    if results:
        print(f"Document id: {results[0].get('id', document_id)}")


if __name__ == "__main__":
    main()
