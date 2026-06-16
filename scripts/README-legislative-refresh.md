# Legislative Tracker — Auto-Refresh

Keeps the Legislative Tracker current by pulling recent roll-call votes for the
officials you track and staging them as **draft** items in Sanity for editor review.
Nothing reaches the public page automatically — the draft/publish flow in Studio is
the gate.

## How it flows

```
LegiScan (PA state)  ─┐
Congress.gov (US House)├─►  normalized vote events  ─►  draft legislativeAction items
senate.gov XML (US Sen)┘                                 (needsReview: true)
                                                              │
                                                              ▼
                              MERGE into drafts.legislative-tracker
                              (keeps your hand-curated items, de-dupes by externalId)
                                                              │
                                                              ▼
                          Editor opens Sanity Studio → reviews 🆕 items →
                          sets Action Type + Category + plain-language description →
                          publishes. Now it's public.
```

## One-time setup

1. **Get API keys** (both free) and put them in `.env.local`:
   - LegiScan: https://legiscan.com/legiscan → `LEGISCAN_API_KEY`
   - Congress.gov: https://api.congress.gov/sign-up/ → `CONGRESS_GOV_API_KEY`
   - (U.S. Senate uses senate.gov XML — no key.)
   You already have `SANITY_API_TOKEN` and the project id/dataset.

2. **Fill in the roster:** `scripts/data/tracked-officials.json`. Each official needs:
   - U.S. House/Senate → `bioguideId` (and `lisMemberId` for senators)
   - PA legislators → `legiscanPeopleId`
   Instructions for finding each ID are at the top of that file. Remove the EXAMPLE rows.
   Also confirm the **current** PA U.S. Senators and your tracked state legislators before
   the first run.

3. **Deploy the schema change** so the new review fields show in Studio:
   ```
   npx sanity@latest schema deploy      # or your usual deploy step
   ```

## First run — backfill the gap since February

The fetch window is controlled by `--since`. On the very first run, point it at your last
content update so it pulls **the entire Feb→today gap in one pass** (no gap, no missed weeks):

```bash
# preview first — no writes:
python3 scripts/refresh-legislative-tracker.py --since 2026-02-01 --dry-run

# then for real (writes drafts):
python3 scripts/refresh-legislative-tracker.py --since 2026-02-01
```

After that, every run records the date in `scripts/data/legislative-import-state.json`, so
later runs only fetch what's new. A per-item `externalId` plus a "seen" ledger mean items
are never imported twice — and items you reject (delete) won't come back.

### Back-load a few weeks at a time (keeps each review batch small)

Use `--until` with `--since` to import one window, review it in Studio, then advance:

```bash
python3 scripts/refresh-legislative-tracker.py --since 2026-02-01 --until 2026-02-21
# review the drafts in Studio, then:
python3 scripts/refresh-legislative-tracker.py --since 2026-02-21 --until 2026-03-14
# …continue until you reach today; weekly runs then take over automatically.
```

`lastRun` only ever moves forward, so the chunks compose cleanly and the weekly job resumes
from wherever you stopped. (`--until` defaults to today when omitted.)

## Ongoing — weekly automation

**GitHub Actions (recommended):** `.github/workflows/legislative-tracker-refresh.yml` runs
every Monday. Add these repo secrets (Settings → Secrets and variables → Actions):
`NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`,
`LEGISCAN_API_KEY`, `CONGRESS_GOV_API_KEY`. Use the workflow's **Run workflow** button with a
`since` date for the first backfill. The script is standard-library-only, so there's nothing
to `pip install`.

**Local cron (alternative)** — run weekly on your Mac:
```bash
# crontab -e  → Mondays 9am
0 9 * * 1 cd /path/to/alleghenydems && /usr/bin/python3 scripts/refresh-legislative-tracker.py >> /tmp/tracker-refresh.log 2>&1
```

> Note: this can't run inside Cowork's sandbox — that environment has no network access to
> LegiScan/Congress/Sanity. It must run on GitHub Actions, your machine, or another host with
> internet + the secrets.

## Flags

| Flag | Purpose |
|------|---------|
| `--since YYYY-MM-DD` | Override the fetch window start (use for backfill). |
| `--source legiscan\|congress\|senate\|all` | Limit to one source. |
| `--dry-run` | Do everything except write to Sanity. |
| `--mock FILE` | Load normalized events from a JSON fixture instead of the network (testing). |
| `--emit FILE` | Dump the raw fetched events to a file for inspection. |

## Testing without touching production

```bash
python3 scripts/refresh-legislative-tracker.py --mock scripts/data/_mock-vote-events.json --dry-run
```

## A note on the federal House adapter

LegiScan (PA) and the senate.gov XML (US Senate) feeds are stable and well-documented. The
U.S. House adapter uses Congress.gov's newer `house-vote` endpoints — smoke-test it once with
your key (`--source congress --dry-run`). If the JSON shape has shifted, only
`fetch_congress_house()` in `refresh-legislative-tracker.py` needs adjusting; everything
downstream is driven by the normalized event dict it returns.
