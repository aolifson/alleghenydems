# Multi-Project Migration Runbook

**Goal:** Separate, hand-off-able infrastructure for ACDC — a dedicated Vercel team and a
Sanity org containing only ACDC + municipality projects. Each municipality gets its own
free Sanity project (hard access isolation); one Vercel project serves all domains.
Final ownership handoff runs through **`info@alleghenydems.com`** once that inbox is
reachable (not yet — as of 2026-08-08 Alan has no one who can access it).

**Status as of 2026-08-08:** Vercel side is transferred and reconnected. What's left below
is split into what needs that inbox vs. what doesn't, so prep can continue tonight/tomorrow
without it.

---

## Systems & logins — who has access to what

Two separate Vercel logins, two separate Sanity destinations. Mixing them up is the main
source of confusion, so here's the map:

| System | Login | Contains | Status |
|---|---|---|---|
| **Vercel — interim account** | Alan's 2nd personal email (not `aolifson@gmail.com`) | Team **"ACDC"** (slug `acdcpa`, Hobby plan) → project `alleghenydems`, GitHub-connected | ✅ live, this is the real site now |
| **Vercel — Alan's main account** | `aolifson@gmail.com` | Alan's ~13 unrelated personal projects | untouched, not part of this migration |
| **Sanity — org "ACDC"** (`oyIn7fj8d`) | `aolifson@gmail.com` (Google login) is admin | County project `6tkl67at`, Fox Chapel project `ihpwz2dj`, old project `mfzgc4rr` (still serving prod), **+ 3 of Alan's personal projects (temporary, need to move out)** | needs cleanup, see below |
| **Sanity — "Alan Olifson Projects" org** (`oM9ilNuwi`) | `aolifson@gmail.com` | destination for those 3 personal projects | ⚠️ didn't show up in a live org listing today — confirm it still exists before moving anything into it |
| **GitHub repo** | `aolifson/alleghenydems` (personal) | source code | connected to the new Vercel team; org transfer deferred, not urgent |

**The only thing gated on `info@alleghenydems.com`** is proving ACDC — not Alan personally
— controls the Vercel account and the Sanity org. Everything else below runs on logins
Alan already has tonight.

---

## ✅ Done

- Sanity: county project cloned (`6tkl67at`), Fox Chapel project created (`ihpwz2dj`).
  Verified identical to old project: 3,876 docs (469 events, 13 news, 35 municipalities,
  6 drafts, 180 assets re-uploaded). Tokens in gitignored `.env.migration.local`
  (`ACDC_SANITY_PROJECT_ID/READ_TOKEN/WRITE_TOKEN`, `FOXCHAPEL_SANITY_*`, `OLD_SANITY_PROJECT_ID`)
  — move to a password manager.
- Vercel: `alleghenydems` project transferred out of Alan's personal team into the new
  "ACDC" team (confirmed 2026-08-08 via API — it's gone from the personal team's project
  list, live in `acdcpa`). Domains/env vars/deployment history move automatically with a
  Vercel project transfer.
- Vercel: GitHub App reconnected on the new account — latest push (`acfb44c`,
  "ogranize events by time") deployed successfully, so pushes auto-deploy again.
- App refactor (client-per-tenant, two-source merging, schema split, opt-out UI, studio
  workspaces, Fox Chapel data split) — done on branch `multi-project-refactor`,
  smoke-tested via curl against the real `ihpwz2dj` project. **Not merged to `main`.**

---

## 🔒 Blocked until `info@alleghenydems.com` is reachable

~10–15 minutes total once someone can receive/click a verification email there. Nothing
else in this doc depends on these — they're pure identity handoff, not site functionality.

- [ ] **Vercel**: interim account → Account Settings → Emails → add `info@alleghenydems.com`,
      verify it, set primary, then remove Alan's personal email. (Vercel allows 3
      emails/account — the account *becomes* ACDC's, no re-transfer needed.)
- [ ] **Sanity**: create a Sanity login using `info@alleghenydems.com`, then (from
      `aolifson@gmail.com`) invite it at [sanity.io/manage](https://www.sanity.io/manage) →
      org **ACDC** → Members → **Administrator**. (Sanity accounts can't change email later —
      confirmed — so this has to be a fresh login with that address, not a converted one.)
- [ ] *(optional, not urgent)* GitHub org for ACDC + repo transfer + re-point Vercel's Git
      connection. Deploys keep working without this.

---

## 🎯 Do now — safe prep, no email needed, doesn't touch production

Everything here is either invisible to the live site or fully reversible.

- [ ] **Confirm `oM9ilNuwi` ("Alan Olifson Projects") still exists.** A Sanity org listing
      pulled today only returned "ACDC" — recheck in the dashboard before the next step.
- [ ] **Move Alan's 3 personal projects out of the ACDC org**: Forge & Function, Oakmont
      Sourdough Co., M&O Landscaping → each project's Settings → General → Transfer project
      → Alan Olifson Projects. Leaves the ACDC org holding only ACDC-relevant projects.
- [ ] **Test the refactor branch on a Preview deployment first — merge comes next, in its
      own section below.**
      - *Mechanics:* the Vercel GitHub App (reconnected — see ✅ Done) watches every push to
        this repo. Any push to a branch that isn't `main` auto-triggers a **Preview
        Deployment** — the build happens on push alone, a PR isn't what causes it. Opening
        a PR is just the easiest place to *find* the resulting link: Vercel's bot comments
        the preview URL directly on the PR.
      - `multi-project-refactor` is already pushed to `origin` (latest commit `bb50437`) —
        a preview build likely already exists, no new push needed. Two ways to get the URL:
        - **Open a PR** (recommended): GitHub → PR from `multi-project-refactor` into
          `main`. Don't merge it. Within a minute or two the Vercel bot comments with the
          preview link.
        - **Or skip the PR**: Vercel dashboard → ACDC team → `alleghenydems` project →
          Deployments tab → filter by branch `multi-project-refactor` → latest one → Visit.
      - **What this checks:** before the refactor there was one Sanity Studio for the whole
        county. This splits it into multiple "workspaces" in the same Studio — `county`
        (unchanged) plus a new `fox-chapel` one, so Fox Chapel editors only ever see Fox
        Chapel's own content. That's new code, only exercised so far by `curl` against
        public pages — never opened in a browser as a logged-in editor. Steps, on the
        preview URL:
        1. Go to `<preview-url>/studio`. Confirm the workspace switcher (top-left) lists
           **"Allegheny Dems"** (county) and **"fox-chapel (Municipality)"**, and both open
           without erroring.
        2. In "Allegheny Dems", open any document, confirm the edit form renders. **Don't
           save** — see gotcha below, this workspace writes to the real live project.
        3. Switch to "fox-chapel", same check — open a document. This project isn't public
           yet, so a real save here (if you want extra confidence) is low-risk.
        4. Still in "fox-chapel", open **Municipality Settings** → **Shared County Content**
           tab → **Hide Shared County Items**. Should show a live list of checkboxes pulled
           from the county project — the one hand-written piece of UI in this refactor, so
           the most likely thing to be broken. Blank/stuck/erroring = the bug to look for.
        5. In a normal tab (not Studio), visit `<preview-url>/municipalities/fox-chapel` —
           `curl` only reads raw text, so this is just eyeballing that it looks right.
      - **Gotcha:** anything not Fox-Chapel-specific reads the same env var as the real live
        site (`NEXT_PUBLIC_SANITY_PROJECT_ID`), so step 2's county workspace shows today's
        real data — expected, not stale. Only fox-chapel (steps 3–4) runs on the new,
        isolated project actually being tested here.
- [ ] **Sanity CORS** on both new projects (`6tkl67at`, `ihpwz2dj`): add
      `https://alleghenydems.com` and `https://www.alleghenydems.com`. (Correcting this doc:
      an earlier version said `.org` — the real production domain, per `middleware.ts`, is
      `.com`.) Check whether Sanity's CORS origin field accepts a `*.alleghenydems.com`
      wildcard for the per-municipality subdomains, or whether each has to be added as it
      onboards.
- [ ] **Verify the domain rode along with the Vercel transfer**: in the new ACDC team's
      project → Domains tab, confirm `alleghenydems.com` / `www.alleghenydems.com` are
      listed and valid. Should already be true (transfers carry domains automatically) —
      this is just confirming it, not an action.
- [ ] Invite Fox Chapel's editors to the Fox Chapel Sanity project (their 20 free seats) —
      isolated from prod, safe to do whenever.

---

## 🧪 Merge the multi-tenant code — do this now, as a standalone Fox Chapel POC

**Do this before the full cutover, once the Preview checks above pass.** It does not need
to wait for anything else in this doc, including `info@alleghenydems.com`.

**Why it's safe to merge early:** only Fox Chapel's project ID is hardcoded (in
`lib/municipality-projects.ts`) — it's not read from an env var. The county-wide
`NEXT_PUBLIC_SANITY_PROJECT_ID` env var is untouched by this merge, so the county site and
all 34 other (not-yet-migrated) municipalities keep serving from the **old** project
(`mfzgc4rr`) exactly as before. Merging only turns on Fox Chapel's isolated project — it is
not the full cutover, and doesn't touch anything in the 🚀 section below.

**What actually happens when you merge:** pushing to `main` deploys to production. Because
wildcard DNS for `*.alleghenydems.com` and the hostname routing in `middleware.ts` are
already live, `https://fox-chapel.alleghenydems.com` starts serving from the new isolated
project **the moment that deploy finishes** — no domain purchase, no DNS change, nothing
else to configure. That subdomain *is* the "temp domain" — Fox Chapel doesn't need (or
have) its own vanity domain for the POC; `fox-chapel.alleghenydems.com` is the standard
default hosting arrangement every migrated municipality gets before/unless they bring
their own domain (see the "Custom Domain" field note in `sanity/schemaTypes/municipality.ts`).

Checklist:
- [ ] Confirm the two 🎯 items above are done first: Sanity CORS added on `ihpwz2dj`, and
      Fox Chapel editors invited — both are needed for the live (not preview) version to
      work fully.
- [ ] Merge `multi-project-refactor` → `main`.
- [ ] Once deployed, spot-check in production (not preview): `https://fox-chapel.alleghenydems.com`
      and `/studio/fox-chapel`.
- [ ] Share `fox-chapel.alleghenydems.com` as the POC link.

---

## 🚀 Cutover flip — ready to fire anytime, ~15 min, doesn't need the email either

This is the full "domain transfer" moment — the *rest* of the site (county + the other 34
municipalities) starts reading from the new county Sanity project instead of the old one.
Assumes the merge above already happened. Technically independent of the identity handoff
too; whether you fire it now or hold it until that's also done is a judgment call, not a
requirement. Recommend holding until the "do now" list is fully checked off, so it's one
clean cutover instead of two.

1. Re-sync county data — do this step *last*, right before the rest, since the old project
   keeps taking live edits until this moment:
   ```sh
   node node_modules/@sanity/cli/bin/sanity dataset export production /tmp/acdc.tar.gz --overwrite
   NEXT_PUBLIC_SANITY_PROJECT_ID=6tkl67at node node_modules/@sanity/cli/bin/sanity dataset import /tmp/acdc.tar.gz production --replace
   ```
2. Flip **Production** env vars on the Vercel project: `NEXT_PUBLIC_SANITY_PROJECT_ID=6tkl67at`,
   `SANITY_API_TOKEN=<value of ACDC_SANITY_WRITE_TOKEN from .env.migration.local>`. Redeploy
   (env var changes need a redeploy to take effect).
3. Spot-check the live domain: county site and both `/studio` workspaces (`fox-chapel.alleghenydems.com`
   was already verified at merge time above).
4. After 2+ quiet weeks: delete/archive the old project `mfzgc4rr`.

---

## Once `info@alleghenydems.com` is reachable, the whole remaining list is:

1. Vercel: add + verify + set primary + remove personal email (~5 min)
2. Sanity: create login, get invited as org Administrator (~5 min)
3. *(if not already fired)* the cutover flip above (~15 min)

Everything else in this doc will already be done.

---

## Known open items

- The "🔒 Internal Documents" doc type lives in a public dataset — anyone with the project
  ID can query it. Decide whether to fix during the refactor (private dataset or move out
  of Sanity).
- GitHub org/repo transfer — deferred, not urgent, deploys work fine without it.
