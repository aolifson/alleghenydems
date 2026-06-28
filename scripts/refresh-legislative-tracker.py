#!/usr/bin/env python3
"""
Refresh the Legislative Tracker from live sources (LegiScan + Congress.gov / official feeds).

What it does
------------
1. Pulls recent roll-call votes for the officials listed in scripts/data/tracked-officials.json
   - PA state House/Senate via the LegiScan API
   - U.S. House via the Congress.gov API, U.S. Senate via the official senate.gov vote XML
2. Turns each vote into a draft `legislativeAction` item (description, source link,
   bill id, chamber, how-they-voted, the official's municipalities).
3. MERGES those items into the *draft* of the `legislative-tracker` Sanity document,
   without touching your hand-curated items, and flags each new one `needsReview: true`.
   Nothing reaches the public page until an editor classifies it and publishes in Studio.

Backfill / no-gap behavior
--------------------------
The window pulled is controlled by --since:
  * If --since is passed, that date is used.
  * Else, the date of the last successful run is used (scripts/data/legislative-import-state.json).
  * Else (very first run), it falls back to BACKFILL_START below.
So the FIRST run backfills the entire gap since your last content update (Feb 2026) and every
later run only fetches what is new. There is no gap and no double-import — a per-item
externalId plus a "seen" ledger prevent duplicates and stop rejected items from coming back.

Usage
-----
  # Safe preview, no writes, real network:
  python3 scripts/refresh-legislative-tracker.py --dry-run

  # First-time backfill from your last update through today, write drafts:
  python3 scripts/refresh-legislative-tracker.py --since 2026-02-01

  # Normal weekly incremental run (used by the scheduled task):
  python3 scripts/refresh-legislative-tracker.py

  # Offline test of the transform + merge using a fixture of normalized events:
  python3 scripts/refresh-legislative-tracker.py --mock scripts/data/_mock-vote-events.json --dry-run

Flags
-----
  --since YYYY-MM-DD   Override the start of the fetch window.
  --source            legiscan | congress | senate | all   (default: all)
  --mock FILE         Load normalized vote events from FILE instead of the network (for testing).
  --dry-run           Do everything except write to Sanity; prints what would change.
  --emit FILE         Write the normalized vote events fetched this run to FILE (debugging).
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import pathlib
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
import xml.etree.ElementTree as ET

# If no prior run and no --since, backfill from here (your last manual content update).
BACKFILL_START = "2026-02-01"

REPO_ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA_DIR = REPO_ROOT / "scripts" / "data"
ROSTER_PATH = DATA_DIR / "tracked-officials.json"
STATE_PATH = DATA_DIR / "legislative-import-state.json"

DOC_ID = "legislative-tracker"
DRAFT_ID = f"drafts.{DOC_ID}"
SANITY_API_VERSION = "v2021-10-21"

# LegiScan vote_id -> normalized value
LEGISCAN_VOTE = {1: "Yea", 2: "Nay", 3: "Not Voting", 4: "Not Voting"}

# ── Vote significance filter ──
# We only want votes worth an editor's time and a voter's attention: final passage /
# concurrence / veto overrides — NOT amendments, motions, adjournments, procedural votes.
# And we skip near-unanimous (ceremonial) votes. Tune via --all-votes / MIN_MINORITY.
PASSAGE_KEYWORDS = (
    "final passage", "third consideration", "concur", "veto", "passed over veto",
    "on passage", "override", "and pass", "pass the bill",
    "on the nomination", "nomination",  # Senate confirmations are high-salience
)
PROCEDURAL_KEYWORDS = (
    "amendment", "motion to", "adjourn", "recommit", "table", "previous question",
    "first consideration", "second consideration", "quorum", "recess", "germane",
    "reconsider", "rule", "suspend",
)
MIN_MINORITY = 8          # absolute floor: losing side must have at least this many votes
MIN_MINORITY_FRACTION = 0.10  # and be at least this share of votes cast (filters routine bills)


def is_significant_vote(desc: str, yea, nay, keep_all: bool = False) -> bool:
    """True if a roll call is a substantive, contested vote worth importing."""
    d = (desc or "").lower()
    if keep_all:
        passage = True
    else:
        if any(k in d for k in PROCEDURAL_KEYWORDS) and not any(k in d for k in PASSAGE_KEYWORDS):
            return False
        passage = any(k in d for k in PASSAGE_KEYWORDS)
        if not passage:
            return False
    try:
        y, n = int(yea or 0), int(nay or 0)
    except (TypeError, ValueError):
        y, n = 0, 0
    if keep_all:
        return True
    total = y + n
    minority = min(y, n)
    if minority < MIN_MINORITY:
        return False  # near-unanimous / ceremonial
    if total and (minority / total) < MIN_MINORITY_FRACTION:
        return False  # lopsided: a routine bill with scattered opposition
    return True


# ─────────────────────────── small helpers ───────────────────────────

def log(msg: str) -> None:
    print(msg, flush=True)


def make_key() -> str:
    return uuid.uuid4().hex[:12]


def load_env(path: pathlib.Path) -> dict:
    env: dict = {}
    if not path.exists():
        return env
    for raw in path.read_text().splitlines():
        line = raw.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip().strip('"').strip("'")
    return env


USER_AGENT = "alleghenydems-tracker/1.0 (+https://alleghenydems.com)"


def http_json(url: str, headers: dict | None = None, timeout: int = 90, retries: int = 3) -> dict:
    # A real User-Agent is REQUIRED: api.congress.gov sits behind a CDN that returns
    # 403 Forbidden for the default "Python-urllib" agent. Congress.gov can also be slow,
    # so we retry on timeouts/transient errors with a longer timeout each attempt.
    import time
    h = {"User-Agent": USER_AGENT, "Accept": "application/json"}
    h.update(headers or {})
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            req = urllib.request.Request(url, headers=h)
            with urllib.request.urlopen(req, timeout=timeout + attempt * 60) as resp:
                return json.loads(resp.read() or b"{}")
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:  # noqa: PERF203
            last_err = e
            if attempt < retries - 1:
                time.sleep(2 + attempt * 3)
    raise last_err if last_err else RuntimeError("request failed")


def http_text(url: str, timeout: int = 60) -> str:
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode("utf-8", errors="ignore")


def parse_date(value: str) -> dt.date | None:
    if not value:
        return None
    value = value.strip()[:10]
    for fmt in ("%Y-%m-%d", "%m/%d/%Y", "%B %d, %Y"):
        try:
            return dt.datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


def current_congress(today: dt.date) -> int:
    # 119th Congress runs 2025-2026; each Congress is 2 years starting odd years.
    return (today.year - 1789) // 2 + 1


def congress_session(today: dt.date) -> int:
    return 1 if today.year % 2 == 1 else 2


def norm_name(value: str) -> str:
    """Lowercase a (last) name for fuzzy matching: strip accents, punctuation, spaces."""
    import unicodedata
    s = unicodedata.normalize("NFKD", value or "")
    s = "".join(c for c in s if not unicodedata.combining(c))
    return "".join(ch for ch in s.lower() if ch.isalnum())


def district_num(value) -> int | None:
    """Pull the integer district out of values like 'HD-036', 'SD-43', 12, '12'."""
    if value is None:
        return None
    digits = "".join(ch for ch in str(value) if ch.isdigit())
    return int(digits) if digits else None


# ─────────────────────── normalized vote event ───────────────────────
# Every source produces a list of these dicts; the transform + merge code
# below is source-agnostic and is what the offline tests exercise.
#   {
#     "externalId": str,   # stable de-dup key
#     "official": str, "party": "D"|"R", "office": str,
#     "chamber": "pa-house"|"pa-senate"|"us-house"|"us-senate",
#     "billId": str, "billTitle": str,
#     "voteValue": "Yea"|"Nay"|"Present"|"Not Voting",
#     "date": "YYYY-MM-DD",
#     "sourceLabel": str, "sourceUrl": str,
#     "municipalities": [str, ...],
#   }


def _party_letter(party: str) -> str:
    p = (party or "").strip().lower()
    if p in ("d", "democrat", "democratic", "dem"):
        return "D"
    if p in ("r", "republican", "rep", "gop"):
        return "R"
    return "O"


def analyze_roll(per_person: list, member_party: str, member_value: str) -> dict:
    """Summarize a roll call from (party, value) pairs for ALL voters.

    Returns tally string, per-party breakdown, and whether the member broke with
    the majority of their own party — the signals a reviewer needs at a glance.
    """
    oy = on = 0
    by = {"D": [0, 0], "R": [0, 0]}  # party -> [yea, nay]
    for party, value in per_person:
        v = (value or "").strip().lower()
        pl = _party_letter(party)
        if v in ("yea", "yes", "aye"):
            oy += 1
            if pl in by:
                by[pl][0] += 1
        elif v in ("nay", "no"):
            on += 1
            if pl in by:
                by[pl][1] += 1
    crossed = False
    mp = _party_letter(member_party)
    mv = (member_value or "").strip().lower()
    if mp in by and mv in ("yea", "nay"):
        dy, dn = by[mp]
        if dy or dn:
            party_majority = "yea" if dy >= dn else "nay"
            crossed = mv != party_majority
    breakdown = f"Dem {by['D'][0]}–{by['D'][1]} · GOP {by['R'][0]}–{by['R'][1]}"
    return {"tally": f"{oy}–{on}", "breakdown": breakdown, "crossed": crossed}


def event_to_action(ev: dict) -> dict:
    """Turn a normalized vote event into a draft legislativeAction item."""
    vote = ev.get("voteValue", "")
    yes_no = "YES" if vote == "Yea" else "NO" if vote == "Nay" else vote
    bill = ev.get("billId", "").strip()
    title = (ev.get("billTitle") or "").strip()
    summary = (ev.get("billSummary") or "").strip()
    result = (ev.get("voteResult") or "").strip()       # e.g. "Passed 105–98"
    breakdown = (ev.get("partyBreakdown") or "").strip()  # e.g. "Dem 100–2 · GOP 5–96"
    crossed = ev.get("crossedParty")
    party = ev.get("party", "")

    # ── At-a-glance review block (first lines an editor sees) ──
    lines = [f"Voted {yes_no} on {bill}" + (f" — {result}" if result else "")]
    if title:
        lines[0] += f"  ({title})"
    if crossed:
        lines.append(f"⚠ CROSSED PARTY: {ev.get('official','This member')} ({party}) voted "
                     f"against most of their own caucus.")
    if breakdown:
        lines.append(f"Party split: {breakdown}.")
    if summary and summary != title:
        lines.append(f"Bill: {summary}")
    lines.append(
        "\n[AUTO-IMPORTED — needs editor review. Set the Action Type "
        "(accomplishment / blocked / harmful), choose a real Category, rewrite this "
        "description in plain language for voters, and confirm the source before publishing.]"
    )
    desc = "\n".join(lines)
    return {
        "_type": "legislativeAction",
        "_key": make_key(),
        "official": ev["official"],
        "party": ev.get("party", "R"),
        "office": ev.get("office", ""),
        "description": desc,
        "date": ev.get("date", ""),
        # `type` deliberately omitted -> Studio requires it before publish (the review gate).
        "category": "Needs Review",
        "sourceLabel": ev.get("sourceLabel", "Official roll-call record"),
        "sourceUrl": ev.get("sourceUrl", ""),
        "municipalities": ev.get("municipalities") or ["Allegheny County"],
        "displayOrder": 9000,
        "autoImported": True,
        "needsReview": True,
        "externalId": ev["externalId"],
        "billId": bill,
        "chamber": ev.get("chamber"),
        "voteValue": vote if vote in ("Yea", "Nay", "Present", "Not Voting") else None,
        "billSummary": summary or title or None,
        "voteResult": result or None,
        "partyBreakdown": breakdown or None,
        "crossedParty": bool(crossed),
    }


# ─────────────────────────── source: LegiScan (PA state) ───────────────────────────

def fetch_legiscan(api_key: str, roster: list, since: dt.date, until: dt.date,
                   keep_all: bool = False) -> list:
    """PA House/Senate roll-call votes for tracked state legislators."""
    state_roster = [o for o in roster if o.get("level") == "state"]
    if not state_roster:
        log("  legiscan: no state officials in roster — skipping.")
        return []
    base = "https://api.legiscan.com/"

    def call(op: str, **params) -> dict:
        q = urllib.parse.urlencode({"key": api_key, "op": op, **params})
        return http_json(f"{base}?{q}")

    # Find the current PA session.
    sessions = call("getSessionList", state="PA").get("sessions", [])
    if not sessions:
        log("  legiscan: no PA sessions returned.")
        return []
    session = sorted(sessions, key=lambda s: s.get("year_end", 0), reverse=True)[0]
    session_id = session["session_id"]
    log(f"  legiscan: PA session {session.get('session_name', session_id)}")

    # ── Resolve each roster legislator's LegiScan people_id automatically ──
    # Primary key is chamber + district (uniquely identifies a seat, so it survives
    # name changes/marriages); last name is only a tie-breaker. Editors never enter IDs.
    session_people = call("getSessionPeople", id=session_id).get("sessionpeople", {}).get("people", [])
    pid_party = {p.get("people_id"): p.get("party") for p in session_people}  # for party-split analysis
    people: dict = {}  # people_id -> roster official
    for o in state_roster:
        pid = o.get("legiscanPeopleId")  # explicit override wins
        if not pid:
            want_role = "sen" if o.get("chamber") == "pa-senate" else "rep"
            want_dist = district_num(o.get("district"))
            want_last = norm_name(o.get("lastName") or o["name"].split()[-1])
            # All sitting members in this chamber + district (usually exactly one).
            seat = [p for p in session_people
                    if want_role in str(p.get("role", "")).lower()
                    and district_num(p.get("district")) == want_dist]
            match = None
            if len(seat) == 1:
                match = seat[0]
            elif len(seat) > 1:  # e.g. mid-term replacement: prefer the name match
                match = next((p for p in seat if norm_name(p.get("last_name", "")) == want_last), seat[-1])
            if not match:  # district lookup failed: fall back to last name
                match = next((p for p in session_people if norm_name(p.get("last_name", "")) == want_last), None)
            if match:
                pid = match.get("people_id")
                log(f"  legiscan: matched {o['name']} -> people_id {pid} "
                    f"({match.get('role')} {match.get('district')}, {match.get('name', '')})")
            else:
                log(f"  legiscan: NO MATCH for {o['name']} (district {o.get('district')}) — set legiscanPeopleId manually.")
                continue
        people[pid] = o
    if not people:
        log("  legiscan: no state officials could be resolved — skipping.")
        return []

    # getMasterList (full) includes last_action_date; getMasterListRaw does NOT (hashes only).
    master = call("getMasterList", id=session_id).get("masterlist", {})
    bill_ids = []
    for k, v in master.items():
        if k == "session" or not isinstance(v, dict):
            continue
        d = parse_date(v.get("last_action_date", "") or v.get("status_date", ""))
        if d and d >= since:
            bill_ids.append(v["bill_id"])
    log(f"  legiscan: {len(bill_ids)} bills with action since {since}")

    events: list = []
    for bid in bill_ids:
        bill = call("getBill", id=bid).get("bill", {})
        bnum = bill.get("bill_number", str(bid))
        btitle = bill.get("title", "")
        bsummary = bill.get("description", "")  # LegiScan "description" is usually plainer than title
        for v in bill.get("votes", []):
            vdate = parse_date(v.get("date", ""))
            if not vdate or vdate < since or vdate > until:
                continue
            # Skip procedural / near-unanimous votes (also saves an API call each).
            if not is_significant_vote(v.get("desc", ""), v.get("yea"), v.get("nay"), keep_all):
                continue
            rc = call("getRollCall", id=v["roll_call_id"]).get("roll_call", {})
            rc_votes = rc.get("votes", [])
            per_person = [(pid_party.get(pv.get("people_id")),
                           LEGISCAN_VOTE.get(pv.get("vote_id"), pv.get("vote_text", "")))
                          for pv in rc_votes]
            passed = rc.get("passed")
            for pv in rc_votes:
                pid = pv.get("people_id")
                if pid not in people:
                    continue
                o = people[pid]
                mvalue = LEGISCAN_VOTE.get(pv.get("vote_id"), pv.get("vote_text", ""))
                a = analyze_roll(per_person, o.get("party", ""), mvalue)
                outcome = "Passed" if passed == 1 else "Failed" if passed == 0 else ""
                events.append({
                    "externalId": f"legiscan-rc{rc.get('roll_call_id')}-p{pid}",
                    "official": o["name"], "party": o.get("party", "R"),
                    "office": o.get("office", ""), "chamber": o.get("chamber"),
                    "billId": f"PA {bnum}", "billTitle": btitle, "billSummary": bsummary,
                    "voteValue": mvalue,
                    "voteResult": f"{outcome} {a['tally']}".strip(),
                    "partyBreakdown": a["breakdown"], "crossedParty": a["crossed"],
                    "date": vdate.isoformat(),
                    "sourceLabel": f"LegiScan roll call — PA {bnum}",
                    "sourceUrl": rc.get("url") or bill.get("url", ""),
                    "municipalities": o.get("municipalities", []),
                })
    return events


# ─────────────────────── source: Congress.gov (U.S. House) ───────────────────────

def fetch_congress_house(api_key: str, roster: list, since: dt.date, until: dt.date,
                         today: dt.date, keep_all: bool = False) -> list:
    """U.S. House roll-call votes for tracked representatives via the Congress.gov API.

    NOTE: the House vote endpoints are newer in the Congress.gov v3 API. The call shape
    here follows their documented `house-vote` group. Smoke-test once with your key; if the
    response shape differs, only this function needs adjusting — the rest of the pipeline is
    driven by the normalized event dict it returns.
    """
    house_roster = [o for o in roster if o.get("chamber") == "us-house"]
    if not house_roster:
        log("  congress(house): no US House officials in roster — skipping.")
        return []
    reps_by_bioguide = {o["bioguideId"]: o for o in house_roster if o.get("bioguideId")}
    reps_by_name = {norm_name(o.get("lastName") or o["name"].split()[-1]): o for o in house_roster}

    def match_rep(rec: dict):
        bg = rec.get("bioguideId") or rec.get("bioguideID")
        if bg and bg in reps_by_bioguide:
            return reps_by_bioguide[bg]
        # Fall back to PA + last name (handles a missing/changed bioguide id).
        state = (rec.get("voteState") or rec.get("state") or "").upper()
        if state and state not in ("PA", "PENNSYLVANIA"):
            return None
        last = norm_name(rec.get("lastName") or rec.get("last_name") or "")
        return reps_by_name.get(last)

    congress = current_congress(today)
    session = congress_session(today)
    base = "https://api.congress.gov/v3"
    # Congress.gov authenticates via the ?api_key= query param ONLY. Sending an
    # additional X-Api-Key header trips their gateway and returns 403 Forbidden.

    listing = http_json(
        f"{base}/house-vote/{congress}/{session}?format=json&limit=250&api_key={api_key}",
    )
    votes = listing.get("houseRollCallVotes") or listing.get("votes") or []
    log(f"  congress(house): {len(votes)} roll calls listed for congress {congress} session {session}")

    events: list = []
    for v in votes:
        vdate = parse_date(str(v.get("startDate") or v.get("date") or ""))
        if not vdate or vdate < since or vdate > until:
            continue
        rollnum = v.get("rollCallNumber") or v.get("voteNumber")
        if rollnum is None:
            continue
        title = v.get("voteQuestion") or v.get("question") or ""
        # Cheap keyword screen before spending an API call on the member list
        # (dummy counts isolate the keyword test; contestedness is checked after the fetch).
        if not is_significant_vote(title, 999, 999, keep_all):
            continue
        members = http_json(
            f"{base}/house-vote/{congress}/{session}/{rollnum}/members?format=json&api_key={api_key}",
        )
        recs = (members.get("houseRollCallVoteMemberVotes", {}) or {}).get("results") \
            or members.get("members") or []
        # Contestedness: skip near-unanimous votes.
        yea = sum(1 for r in recs if _norm_vote(r.get("voteCast") or r.get("vote") or "") == "Yea")
        nay = sum(1 for r in recs if _norm_vote(r.get("voteCast") or r.get("vote") or "") == "Nay")
        if not is_significant_vote(title, yea, nay, keep_all):
            continue
        bill_id = v.get("legislationNumber") or v.get("bill", {}).get("number") or f"Roll {rollnum}"
        bill_summary = v.get("legislationTitle") or v.get("bill", {}).get("title") or ""
        url = v.get("url") or f"https://clerk.house.gov/Votes/{vdate.year}{rollnum}"
        per_person = [(r.get("voteParty") or r.get("party"),
                       _norm_vote(r.get("voteCast") or r.get("vote") or "")) for r in recs]
        result_word = (v.get("result") or "").strip()
        for rec in recs:
            o = match_rep(rec)
            if not o:
                continue
            slug = norm_name(o.get("lastName") or o["name"])
            mvalue = _norm_vote(rec.get("voteCast") or rec.get("vote") or "")
            a = analyze_roll(per_person, o.get("party", ""), mvalue)
            events.append({
                "externalId": f"ushouse-{congress}-{session}-rc{rollnum}-{slug}",
                "official": o["name"], "party": o.get("party", "D"),
                "office": o.get("office", ""), "chamber": "us-house",
                "billId": f"US {bill_id}", "billTitle": title, "billSummary": bill_summary,
                "voteValue": mvalue,
                "voteResult": (f"{result_word} " if result_word else "") + a["tally"],
                "partyBreakdown": a["breakdown"], "crossedParty": a["crossed"],
                "date": vdate.isoformat(),
                "sourceLabel": f"U.S. House roll call {rollnum}",
                "sourceUrl": url,
                "municipalities": o.get("municipalities", []),
            })
    return events


# ─────────────────────── source: senate.gov XML (U.S. Senate) ───────────────────────

def fetch_senate(roster: list, since: dt.date, until: dt.date, today: dt.date,
                 keep_all: bool = False) -> list:
    """U.S. Senate roll-call votes for tracked senators via the official senate.gov XML.

    No API key needed. Senate member-level votes are not yet in the Congress.gov API, so
    we read the official vote menu + per-vote XML and match senators by last name
    (LIS id is auto-resolved; the lisMemberId override is rarely needed).
    """
    senate_roster = [o for o in roster if o.get("chamber") == "us-senate"]
    if not senate_roster:
        log("  senate: no US Senate officials in roster — skipping.")
        return []
    sens_by_lis = {o["lisMemberId"]: o for o in senate_roster if o.get("lisMemberId")}
    sens_by_name = {norm_name(o.get("lastName") or o["name"].split()[-1]): o for o in senate_roster}
    congress = current_congress(today)
    session = congress_session(today)
    menu_url = (
        f"https://www.senate.gov/legislative/LIS/roll_call_lists/"
        f"vote_menu_{congress}_{session}.xml"
    )
    try:
        menu = ET.fromstring(http_text(menu_url))
    except Exception as e:  # noqa: BLE001
        log(f"  senate: could not read vote menu ({e}).")
        return []

    events: list = []
    for vote in menu.findall(".//vote"):
        num = (vote.findtext("vote_number") or "").strip()
        vdate = parse_date(vote.findtext("vote_date") or "")
        if not num or not vdate or vdate < since or vdate > until:
            continue
        vurl = (
            f"https://www.senate.gov/legislative/LIS/roll_call_votes/"
            f"vote{congress}{session}/vote_{congress}_{session}_{int(num):05d}.xml"
        )
        try:
            detail = ET.fromstring(http_text(vurl))
        except Exception:  # noqa: BLE001
            continue
        question = detail.findtext("vote_question_text") or detail.findtext("question") or ""
        doc = (detail.findtext("document/document_name") or "").strip()
        doc_title = (detail.findtext("document/document_title")
                     or detail.findtext("vote_title") or "").strip()
        yeas = detail.findtext("count/yeas") or detail.findtext(".//yeas") or 0
        nays = detail.findtext("count/nays") or detail.findtext(".//nays") or 0
        if not is_significant_vote(question, yeas, nays, keep_all):
            continue
        result_word = (detail.findtext("vote_result") or "").strip()
        all_members = detail.findall(".//member")
        per_person = [(m.findtext("party"), _norm_vote(m.findtext("vote_cast") or ""))
                      for m in all_members]
        for member in all_members:
            lis = (member.findtext("lis_member_id") or "").strip()
            last = norm_name(member.findtext("last_name") or "")
            o = sens_by_lis.get(lis) or sens_by_name.get(last)
            if not o:
                continue
            key = lis or last
            mvalue = _norm_vote(member.findtext("vote_cast") or "")
            a = analyze_roll(per_person, o.get("party", ""), mvalue)
            events.append({
                "externalId": f"ussenate-{congress}-{session}-rc{num}-{key}",
                "official": o["name"], "party": o.get("party", "D"),
                "office": o.get("office", ""), "chamber": "us-senate",
                "billId": f"US {doc}" if doc else f"Senate Vote {num}",
                "billTitle": question, "billSummary": doc_title,
                "voteValue": mvalue,
                "voteResult": (f"{result_word} " if result_word else "") + a["tally"],
                "partyBreakdown": a["breakdown"], "crossedParty": a["crossed"],
                "date": vdate.isoformat(),
                "sourceLabel": f"U.S. Senate roll call {num}",
                "sourceUrl": vurl,
                "municipalities": o.get("municipalities", []),
            })
    return events


def _norm_vote(raw: str) -> str:
    r = (raw or "").strip().lower()
    if r in ("yea", "yes", "aye", "guilty"):
        return "Yea"
    if r in ("nay", "no", "not guilty"):
        return "Nay"
    if r == "present":
        return "Present"
    return "Not Voting"


# ─────────────────────────── Sanity I/O ───────────────────────────

def sanity_fetch_existing(project_id: str, dataset: str, token: str) -> dict:
    """Return {'published': doc|None, 'draft': doc|None}."""
    groq = f'*[_id in ["{DOC_ID}", "{DRAFT_ID}"]]'
    url = (f"https://{project_id}.api.sanity.io/{SANITY_API_VERSION}/data/query/{dataset}"
           f"?query={urllib.parse.quote(groq)}")
    data = http_json(url, headers={"Authorization": f"Bearer {token}"})
    out = {"published": None, "draft": None}
    for d in data.get("result", []):
        if d.get("_id") == DRAFT_ID:
            out["draft"] = d
        elif d.get("_id") == DOC_ID:
            out["published"] = d
    return out


def sanity_write_draft(project_id: str, dataset: str, token: str, doc: dict) -> dict:
    url = f"https://{project_id}.api.sanity.io/{SANITY_API_VERSION}/data/mutate/{dataset}"
    body = json.dumps({"mutations": [{"createOrReplace": doc}], "returnIds": True}).encode()
    req = urllib.request.Request(
        url, data=body, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=60) as resp:
        return json.loads(resp.read() or b"{}")


# ─────────────────────────── merge core (tested offline) ───────────────────────────

def existing_external_ids(existing: dict, seen_ledger: list) -> set:
    ids = set(seen_ledger or [])
    for which in ("published", "draft"):
        doc = existing.get(which) or {}
        for a in doc.get("actions", []) or []:
            if a.get("externalId"):
                ids.add(a["externalId"])
    return ids


def build_merged_draft(existing: dict, new_actions: list) -> dict:
    """Copy the current draft (or published) doc and append new review items to its actions."""
    base = dict(existing.get("draft") or existing.get("published") or {})
    base = {k: v for k, v in base.items()
            if k not in ("_id", "_rev", "_createdAt", "_updatedAt")}
    base["_id"] = DRAFT_ID
    base["_type"] = "legislativeTracker"
    base.setdefault("title", "Legislative Tracker")
    base.setdefault("slug", {"_type": "slug", "current": DOC_ID})
    base["actions"] = list(base.get("actions") or []) + new_actions
    return base


# ─────────────────────────── state ledger ───────────────────────────

def load_state() -> dict:
    if STATE_PATH.exists():
        try:
            return json.loads(STATE_PATH.read_text())
        except json.JSONDecodeError:
            pass
    return {"lastRun": None, "seenExternalIds": []}


def save_state(state: dict) -> None:
    STATE_PATH.write_text(json.dumps(state, indent=2))


# ─────────────────────────── main ───────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--since", help="Window start (YYYY-MM-DD). Default: last run, else backfill start.")
    ap.add_argument("--until", help="Window end (YYYY-MM-DD), inclusive. Default: today. "
                                    "Use with --since to back-load a few weeks at a time.")
    ap.add_argument("--source", choices=["legiscan", "congress", "senate", "all"], default="all")
    ap.add_argument("--mock")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--emit")
    ap.add_argument("--all-votes", action="store_true",
                    help="Import every roll call (incl. procedural & near-unanimous). "
                         "Default: only substantive, contested votes.")
    args = ap.parse_args()

    today = dt.date.today()
    env = load_env(REPO_ROOT / ".env.local")

    def cfg(name: str) -> str | None:
        return env.get(name) or os.environ.get(name)

    state = load_state()
    if args.since:
        since = parse_date(args.since)
    elif state.get("lastRun"):
        since = parse_date(state["lastRun"])
    else:
        since = parse_date(BACKFILL_START)
    if not since:
        sys.exit("ERROR: could not determine --since date.")
    until = parse_date(args.until) if args.until else today
    if not until:
        sys.exit("ERROR: could not parse --until date.")
    if until < since:
        sys.exit(f"ERROR: --until ({until}) is before --since ({since}).")
    log(f"Fetch window: votes {since} … {until} (today {today})")

    roster = json.loads(ROSTER_PATH.read_text()).get("officials", [])
    roster = [o for o in roster if not str(o.get("name", "")).endswith("EXAMPLE")]

    # ── gather normalized vote events ──
    events: list = []
    if args.mock:
        events = json.loads(pathlib.Path(args.mock).read_text())
        log(f"Loaded {len(events)} mock events from {args.mock}")
    else:
        if args.source in ("legiscan", "all"):
            key = cfg("LEGISCAN_API_KEY")
            if not key:
                log("  legiscan: LEGISCAN_API_KEY not set — skipping.")
            else:
                try:
                    events += fetch_legiscan(key, roster, since, until, args.all_votes)
                except Exception as e:  # noqa: BLE001
                    log(f"  legiscan: ERROR {e}")
        if args.source in ("congress", "all"):
            key = cfg("CONGRESS_GOV_API_KEY")
            if not key:
                log("  congress(house): CONGRESS_GOV_API_KEY not set — skipping.")
            else:
                try:
                    events += fetch_congress_house(key, roster, since, until, today, args.all_votes)
                except Exception as e:  # noqa: BLE001
                    log(f"  congress(house): ERROR {e}")
        if args.source in ("senate", "all"):
            try:
                events += fetch_senate(roster, since, until, today, args.all_votes)
            except Exception as e:  # noqa: BLE001
                log(f"  senate: ERROR {e}")

    log(f"Fetched {len(events)} raw vote events.")
    if args.emit:
        pathlib.Path(args.emit).write_text(json.dumps(events, indent=2))
        log(f"Wrote raw events to {args.emit}")

    # ── connect to Sanity (unless purely offline dry-run with mock) ──
    project_id = cfg("NEXT_PUBLIC_SANITY_PROJECT_ID")
    dataset = cfg("NEXT_PUBLIC_SANITY_DATASET") or "production"
    token = cfg("SANITY_API_TOKEN")

    existing = {"published": None, "draft": None}
    if project_id and token:
        try:
            existing = sanity_fetch_existing(project_id, dataset, token)
        except Exception as e:  # noqa: BLE001
            log(f"  sanity: could not read existing doc ({e}); proceeding as if empty.")
    else:
        log("  sanity: project id / token not set — running in offline merge-preview mode.")

    # ── de-dup + transform ──
    known = existing_external_ids(existing, state.get("seenExternalIds", []))
    fresh, fresh_ids = [], set()
    for ev in events:
        eid = ev.get("externalId")
        if not eid or eid in known or eid in fresh_ids:
            continue
        fresh.append(event_to_action(ev))
        fresh_ids.add(eid)

    log(f"New items after de-dup: {len(fresh)} (skipped {len(events) - len(fresh)} already seen)")
    if fresh:
        by_person: dict = {}
        for a in fresh:
            by_person[a["official"]] = by_person.get(a["official"], 0) + 1
        for name, n in sorted(by_person.items()):
            log(f"    + {n:>3}  {name}")

    merged = build_merged_draft(existing, fresh)
    total_actions = len(merged.get("actions", []))
    log(f"Draft would contain {total_actions} total actions "
        f"({total_actions - len(fresh)} existing + {len(fresh)} new for review).")

    if args.dry_run:
        log("DRY RUN — no Sanity write, state not advanced.")
        return
    if not (project_id and token):
        sys.exit("ERROR: SANITY_API_TOKEN / project id required for a real write. Use --dry-run to preview.")
    if not fresh:
        log("Nothing new to write. Advancing run timestamp only.")
    else:
        res = sanity_write_draft(project_id, dataset, token, merged)
        log(f"Wrote draft {DRAFT_ID}: {res.get('results', [])}")

    # ── advance state (forward only) ──
    # Move lastRun to the end of the window we just processed, but never backward — so you
    # can back-load in chunks (Feb1–Feb21, then Feb21–Mar14, …) and the weekly run later
    # resumes from wherever the chunks left off. seenExternalIds always grows.
    prev = parse_date(state.get("lastRun") or "") if state.get("lastRun") else None
    new_last = max([d for d in (prev, until) if d])
    state["lastRun"] = new_last.isoformat()
    state["seenExternalIds"] = sorted(set(state.get("seenExternalIds", [])) | fresh_ids)
    save_state(state)
    log(f"State saved. lastRun={state['lastRun']}, tracked ids={len(state['seenExternalIds'])}")
    if until < today:
        log(f"NOTE: window ended {until} (before today {today}). Next chunk: "
            f"--since {until} --until <later date>.")
    log("Done. Open Sanity Studio → Legislative Tracker (draft) to review 🆕 items, "
        "set Action Type + Category, then publish.")


if __name__ == "__main__":
    main()
