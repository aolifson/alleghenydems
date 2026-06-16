# Deploy Checklist — Legislative Tracker Upgrade

Covers the auto-refresh importer, per-official scorecards, and GOTV tie-ins.

## Key fact
The **live site needs no new Vercel env vars.** Scorecards/tracker only read from Sanity
(already configured in Vercel), and the schema changes ship with the code deploy because
Studio is embedded in the app. The LegiScan/Congress keys are used **only** by the weekly
importer, which runs in GitHub Actions — not by the Next app.

---

## 1. Ship the site (commit + push → Vercel auto-deploys)

Run from the repo root on your Mac:

```bash
rm -f .git/index.lock     # clears a stale lock left by the build sandbox
git add -A
git commit -m "Add legislative tracker auto-refresh, scorecards & GOTV tie-ins"
git push origin main      # Vercel auto-builds main
```

- [ ] Pushed to `main`
- [ ] Vercel build succeeded (watch the build log — see note at bottom)
- [ ] `/legislative-tracker` shows the new "See each official's record" banner
- [ ] `/legislative-tracker/scorecards` lists officials; a detail page loads
- [ ] A scorecard's share buttons + social preview image work

## 2. Enable the weekly importer (GitHub Actions)

Add repo secrets at **GitHub → Settings → Secrets and variables → Actions**
(values are in your local `.env.local`):

- [ ] `LEGISCAN_API_KEY`
- [ ] `CONGRESS_GOV_API_KEY`
- [ ] `NEXT_PUBLIC_SANITY_PROJECT_ID`
- [ ] `NEXT_PUBLIC_SANITY_DATASET`
- [ ] `SANITY_API_TOKEN`  (Editor token — lets the job write review drafts)

## 3. First backfill (one time)

- [ ] GitHub → **Actions** tab → "Legislative Tracker Refresh" → **Run workflow**
- [ ] Set `since` = `2026-02-01` (pulls everything since the last manual update)
- [ ] Optionally set `dry_run` = `true` first to preview counts in the log

## 4. Review drafts → publish

- [ ] Open Sanity Studio (`/studio`) → Legislative Tracker
- [ ] New auto-imported items are flagged **🆕 REVIEW**
- [ ] For each: set Action Type (delivered / blocked / harmful), pick a real Category,
      rewrite the description in plain voter language, confirm the source
- [ ] Uncheck **Needs Review** and **Publish** — only then does it go public

After this, the job runs every Monday and only fetches what's new. The roster
(`scripts/data/tracked-officials.json`) is editor-friendly: add/remove people by
name + chamber + district — no ID lookups needed.

---

## Notes
- **Build watch:** a full `next build` couldn't be run in the build sandbox (no network
  for a native binary). TypeScript passes clean; just confirm the Vercel build is green.
- **No duplicates / no gaps:** each item has a stable `externalId` and a "seen" ledger
  (`scripts/data/legislative-import-state.json`, committed back by the Action), so items
  are never imported twice and rejected items don't return.
- **Full details:** `scripts/README-legislative-refresh.md`.
