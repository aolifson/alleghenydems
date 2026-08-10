# Multi-Project Migration & Go-Live Runbook

**Goal:** Separate, hand-off-able infrastructure for ACDC — a dedicated Vercel team and a
Sanity org containing only ACDC + municipality projects. Each municipality gets its own
free Sanity project (hard access isolation); one Vercel project serves all domains and
municipalities. Final ownership handoff uses **`info@alleghenydems.com`** once that inbox
is reachable.

**Status as of 2026-08-10:** Phases 1–4 are **done**. The county project cutover has
happened: `6tkl67at` is the live project behind `alleghenydems.vercel.app`, served from the
`acdcpa` Vercel team. The old project `mfzgc4rr` is no longer read by the site.
Remaining work is Phase 5 (point the domain at Vercel) and Phase 6 (identity handoff),
both of which need GoDaddy/SiteGround access.

**Vocabulary used below and in conversation** — worth stating because the wrong reading
caused real mistakes:

| Term | Means |
|---|---|
| **current site** | `alleghenydems.vercel.app` — Vercel team `acdcpa`, Sanity `6tkl67at`. This is the site being prepared for launch. |
| **WordPress site** | `alleghenydems.com` — still the live public site until Phase 5. |
| **old site** | Alan's personal Vercel account + Sanity `mfzgc4rr`. Superseded; do not edit. |

---

## ⚠️ Two corrections to what this doc said before

1. **`alleghenydems.com` is currently a live WordPress site**, not the Vercel/Sanity app —
   confirmed just now (fetched the live page: WordPress `/wp-content/uploads/` paths
   throughout). The Next.js/Sanity site this whole doc is about is a **not-yet-launched
   replacement**, currently reachable only at `alleghenydems.vercel.app` and branch-preview
   URLs. This changes the earlier framing: this isn't an internal Sanity-data cutover on an
   already-live site, it's a from-scratch replacement of the WordPress site.
2. Earlier this doc said merging the refactor branch would make `fox-chapel.alleghenydems.com`
   "just work, no DNS change needed." **That was wrong.** It assumed DNS already pointed at
   Vercel. It doesn't — `alleghenydems.com`'s nameservers are `siteground.net` (confirmed via
   DNS lookup), i.e. WordPress's host, not Vercel. No `*.alleghenydems.com` subdomain will
   resolve to anything on Vercel until Phase 5 actually happens.

---

## Systems, logins, and accounts — the complete map

| System | Login / account | Contains | Status |
|---|---|---|---|
| **Vercel — ACDC team** | `alan@amiggi.com`; `aolifson@gmail.com` added as member | Team **"ACDC"** (`acdcpa`, `team_KhleDO7g7H6Xv0ovxO2466bR`) → project `alleghenydems` (`prj_DJ5eKEp2gltGDSp12ngdBrGrk7TQ`) | ✅ live, on **Hobby plan — see ⚠️ in Phase 8, this needs to change** |
| **Vercel — Alan's main account** | `aolifson@gmail.com` | ~13 unrelated personal projects | untouched |
| **Sanity — org "ACDC"** (`oyIn7fj8d`) | `aolifson@gmail.com` (Google) is admin | County project `6tkl67at` (**live**), Fox Chapel `ihpwz2dj`, old project `mfzgc4rr` (superseded — no longer read by the site) | ✅ cutover done |
| **Sanity — "Alan Olifson Projects" org** (`oM9ilNuwi`) | `aolifson@gmail.com` | destination for the 3 personal projects | ⚠️ didn't appear in a live org listing recently — confirm it still exists |
| **GitHub repo** | `aolifson/alleghenydems` (personal) | source code | connected to the new Vercel team |
| **Domain registrar** | **GoDaddy** (confirmed via WHOIS) | owns `alleghenydems.com`, expires 2027-03-14 | ⚠️ access unknown — see Phase 5 |
| **DNS host / WordPress hosting** | **SiteGround** (confirmed — nameservers are `ns1/ns2.siteground.net`) | current live WordPress site, DNS records for the domain (A, MX, any other subdomains like `store.alleghenydems.com`) | ⚠️ access unknown — see Phase 5 |
| **`info@alleghenydems.com`** | unknown mail provider | the org's role email | not reachable right now — possibly hosted at SiteGround itself, see Phase 5 |

**Open question I can't resolve myself:** do you (or anyone reachable tonight) have login
access to **GoDaddy** and/or **SiteGround**? This gates Phase 5 and is worth figuring out
in parallel with everything below, since it's a completely different set of credentials
from Vercel/Sanity/GitHub.

---

## Phase 1 — Silo the Vercel + Sanity projects — ✅ mostly done

- ✅ Vercel: `alleghenydems` project transferred out of Alan's personal team into "ACDC"
  (confirmed via API — gone from the personal team's project list).
- ✅ Vercel: GitHub App reconnected — pushes auto-deploy.
- ✅ Sanity: county project cloned (`6tkl67at`), Fox Chapel project created (`ihpwz2dj`),
  verified identical to the old project (3,876 docs).
- ⬜ **Not done:** move Alan's 3 personal Sanity projects (Forge & Function, Oakmont
  Sourdough Co., M&O Landscaping) out of the ACDC org → "Alan Olifson Projects" org. Each
  project's Settings → General → Transfer project. Confirm that destination org still
  exists first (see table above).

---

## Phase 2 — CORS — ✅ done tonight

Checked and fixed live via the Sanity API just now:

| Project | Had | Added tonight |
|---|---|---|
| `6tkl67at` (new county) | `localhost`, `alleghenydems.com`, `www.alleghenydems.com` | + branch preview URL, + `alleghenydems.vercel.app` |
| `ihpwz2dj` (Fox Chapel) | `localhost`, branch preview URL, `alleghenydems.com`, `www.alleghenydems.com` | + `alleghenydems.vercel.app` |
| `mfzgc4rr` (old/current county) | `localhost`, `alleghenydems.vercel.app`, `alleghenydems-training.vercel.app` | ⚠️ **tried to add the branch preview URL, blocked** — this project is flagged as production, so it needs your own action: Sanity dashboard → project `mfzgc4rr` → API → CORS Origins → add `https://alleghenydems-git-multi-project-refactor-acdcpa.vercel.app`, allow credentials. Takes 30 seconds. Without this, `/studio/county` will throw CORS errors when you open it on the branch preview URL in Phase 3/4 (it still reads the old project pre-cutover). |

I deliberately added specific origins, not a `*.vercel.app` wildcard — the CORS tool
supports wildcards, but that would let *any* Vercel-hosted app make authenticated requests
to these projects, and the county project holds the "🔒 Internal Documents" doc type
(see Phase 8 — it's currently in a public dataset, so this isn't a hypothetical).

---

## Phase 3 — Preview the Fox Chapel POC on a temp domain — ✅ possible right now, no merge needed

Nothing here touches production. Two links work today:

- **Private (only people with the link)** — the branch preview build, already live at
  `https://alleghenydems-git-multi-project-refactor-acdcpa.vercel.app`:
  - `/municipalities/fox-chapel` — the public-facing demo page.
  - `/studio/fox-chapel` — the Studio workspace, log in with your Sanity account.
- **Public-ish (anyone with the link, no login wall)** — same thing at
  `https://alleghenydems.vercel.app`, but only *after* you merge `multi-project-refactor`
  into `main` (that's what deploys to that URL).

**What "merge" actually does right now, precisely:** Fox Chapel's Sanity project ID is
hardcoded in `lib/municipality-projects.ts`, not read from an env var — so merging turns on
Fox Chapel's isolated content everywhere the app runs, including production. It does
**not** touch the rest of the county site: `NEXT_PUBLIC_SANITY_PROJECT_ID` (the env var
controlling everything else) is untouched, so county content and the other 34 municipalities
keep reading the old project exactly as before. Merging is safe on its own — but see Phase
4, since testing the *whole* siloed setup on preview first (before merging anything) is
easy to do and de-risks this further.

**What to actually click and verify** (this code has only been smoke-tested with `curl`,
never opened as a logged-in editor in a real browser):
1. `/studio` — confirm the workspace switcher (top-left) lists "Allegheny Dems" (county)
   and "fox-chapel (Municipality)" and both open without erroring. *(County will error
   with a CORS message until you do the manual fix in Phase 2's table above.)*
2. In "fox-chapel," open a document, edit it, save it. This project isn't public yet, so a
   real save is low-risk and actually proves the write path works, not just reads.
3. Still in "fox-chapel," open **Municipality Settings** → **Shared County Content** tab →
   **Hide Shared County Items**. Should show a live list of checkboxes pulled from the
   county project — the one hand-written piece of custom UI in this refactor, so the most
   likely thing to be broken.
4. In "Allegheny Dems" (county), just confirm a document opens and renders — **don't save**.
   This workspace reads the **old, live** project pre-cutover (see the gotcha below), so a
   real save here is a real edit to whatever's currently in production.
5. Visit `/municipalities/fox-chapel` in a normal tab — `curl` only reads raw text, so this
   is the first real visual check (images, layout).

**Gotcha:** on the branch preview URL, anything that isn't Fox-Chapel-specific reads the
same env var as production (`NEXT_PUBLIC_SANITY_PROJECT_ID` = old project `mfzgc4rr`) — so
step 4's county data is today's real data, not stale. That's expected. Phase 4 below shows
how to test the *new* county project too, safely.

---

## Phase 4 — Preview the full siloed ACDC site, then flip for real — ✅ DONE

> **Completed.** Production env vars point at `6tkl67at` and the site serves from it.
> Steps 4a/4b below are kept for reference and for the next municipality migration.

This is where "ready to go" actually gets decided. Two stages: a fully safe preview, then
the real flip (still on the temp Vercel domain — Phase 5 is what makes it public at the
real domain).

**4a. Preview the whole thing safely, with zero risk to live data:**
1. Vercel → `alleghenydems` project → Settings → Environment Variables → add/override,
   scoped to **Preview only** (not Production): `NEXT_PUBLIC_SANITY_PROJECT_ID=6tkl67at`,
   `SANITY_API_TOKEN=<ACDC_SANITY_WRITE_TOKEN from .env.migration.local>`.
2. Trigger a fresh preview build (env var changes need a redeploy to take effect — push
   any small commit to `multi-project-refactor`, or use "Redeploy" in the Vercel dashboard).
3. Now the **same** branch preview URL has `/studio/county` pointed at the new,
   isolated county project (`6tkl67at`) instead of the live old one. Unlike Phase 3 step 4,
   it's now safe to actually edit and save here too — `6tkl67at` is a snapshot, not live
   production data. Click through the whole site and both Studio workspaces thoroughly.
4. Re-run the county data re-sync once more right before step 5 below, so the snapshot
   you're about to go live with is current (old project keeps taking real edits until then):
   ```sh
   node node_modules/@sanity/cli/bin/sanity dataset export production /tmp/acdc.tar.gz --overwrite
   NEXT_PUBLIC_SANITY_PROJECT_ID=6tkl67at node node_modules/@sanity/cli/bin/sanity dataset import /tmp/acdc.tar.gz production --replace
   ```

**4b. Flip for real — you're now fully live, just not at the real domain yet:**
1. Merge `multi-project-refactor` → `main` (if not already, from Phase 3).
2. Set the **same** env vars from step 4a.1 as **Production**-scoped (not just Preview),
   then redeploy.
3. Spot-check `https://alleghenydems.vercel.app` — county site, `/municipalities/fox-chapel`,
   both `/studio` workspaces. This is now the real, fully-functional new site. It's just
   sitting at the Vercel default domain instead of `alleghenydems.com`.
4. After 2+ quiet weeks of confidence: delete/archive the old Sanity project `mfzgc4rr`.

---

## Phase 5 — Transfer `alleghenydems.com` from WordPress to Vercel

**This is the part that needs SiteGround and/or GoDaddy access — see the open question
above the table.** Everything below is the technical procedure regardless of who ends up
executing it.

**Recommended approach: keep SiteGround as the DNS host, just change specific records.**
The alternative — switching nameservers away from SiteGround entirely so Vercel manages
all DNS — means manually re-creating *every* existing record yourself (mail, the
`store.alleghenydems.com` merch subdomain, any SPF/DKIM records for email deliverability).
Changing only the records that need to change is much lower-risk.

1. **In Vercel** (ACDC team → `alleghenydems` project → Settings → Domains): add
   `alleghenydems.com`, `www.alleghenydems.com`, and `*.alleghenydems.com` (wildcard, for
   future municipality subdomains like `northside.alleghenydems.com`). Vercel will display
   the exact DNS records it needs — typically an `A` record (`76.76.21.21`) for the apex
   and `CNAME` records (`cname.vercel-dns.com`) for `www` and `*`. Use the values Vercel
   actually shows you, not these as gospel — they do change.
2. **In SiteGround** (DNS Zone Editor for `alleghenydems.com`): add/update only the `A`
   record for `@` and the `CNAME` records for `www` and `*` to Vercel's values.
   **Do not touch MX records or any other existing records** — that's mail routing (likely
   including `info@alleghenydems.com` itself) and the `store` subdomain. A wildcard record
   only catches hostnames with no more specific match, so this is safe to leave everything
   else alone.
3. Wait for propagation (usually minutes, can take longer) and Vercel's automatic SSL
   provisioning.
4. Verify: visit `alleghenydems.com` and `www.alleghenydems.com`, confirm the **new** site
   loads (not WordPress) with a valid SSL padlock.
5. **Verify email still works** — since MX wasn't touched, `info@alleghenydems.com` should
   be unaffected. Confirm this explicitly; it's the one thing genuinely worth double-checking
   given it's also what Phase 6 depends on.
6. Leave the SiteGround WordPress hosting running for a rollback window (just revert the
   `A`/`CNAME` records if something's badly wrong) rather than cancelling immediately.
   Cancelling it later is a real cost saving — see Phase 8.

---

## Phase 6 — Identity handoff to `info@alleghenydems.com`

Independent of Phase 5 technically, but doing it right after — once the site itself is
confirmed working on the real domain — makes for one clean, final handoff moment instead of
two.

- [ ] **Vercel**: interim account → Account Settings → Emails → add
      `info@alleghenydems.com`, verify, set primary, then remove Alan's personal email.
      (Vercel allows 3 emails/account — the account *becomes* ACDC's, no re-transfer needed.)
- [ ] **Sanity**: create a fresh Sanity login using `info@alleghenydems.com` (Sanity
      accounts can't change email later — confirmed), then from `aolifson@gmail.com` invite
      it at [sanity.io/manage](https://www.sanity.io/manage) → org **ACDC** → Members →
      **Administrator**.
- [ ] *(optional, not urgent)* GitHub org for ACDC + repo transfer.

---

## Phase 7 — Preview → staging → production, for changes after go-live

Once live, the workflow you already used for this migration is the standing process for
every future change:

1. Work on a branch, push it. Vercel auto-builds a preview deployment — no PR required for
   the build itself, but open one anyway so the preview link is easy to find (Vercel's bot
   comments it on the PR) and so there's a record of what shipped.
2. Review on the preview URL before merging. **Careful:** as established in Phase 3/4,
   preview deployments inherit **Production** env vars by default — so any preview build
   reads and can write to the *real* live Sanity data unless you've deliberately overridden
   Preview-scoped env vars (the way Phase 4a did). Don't casually hit save while testing
   unrelated UI changes.
3. Merge to `main` → auto-deploys to production.
4. Recommended hardening once more than one person can push: turn on branch protection on
   `main` in GitHub (require a PR, no direct pushes) so this stays the actual path rather
   than an honor system.
5. **Recommended: a real `staging` dataset for county, so Preview never touches live data
   again.** Create a `staging` dataset in the county project (`6tkl67at`) — a periodic copy
   of `production`, refreshed manually when test data gets stale, not continuously synced —
   then set `NEXT_PUBLIC_SANITY_DATASET=staging` scoped to **Preview only** in Vercel
   (Production keeps reading `production`). Removes the "don't actually save" caution from
   Phase 3/4 entirely for county. Uses the second of the 2 datasets already included on
   county's plan — no cost increase.
   - **Does not cover Fox Chapel or any municipality workspace as-is.** Municipality
     projects don't read the dataset from an env var — `lib/municipality-projects.ts`
     hardcodes `{ projectId: 'ihpwz2dj', dataset: 'production' }` per municipality, so every
     preview build, on every branch, always reads and writes Fox Chapel's real `production`
     dataset. Low stakes while Fox Chapel isn't public yet, but once any municipality is
     live, this is the same live-data-leak risk with no dashboard-only fix —
     `MunicipalityProjectConfig` would need to become environment-aware (e.g. keyed off
     `VERCEL_ENV`) to get the same protection. Worth doing before the second municipality
     migrates, not urgent for Fox Chapel alone today.

---

## Phase 8 — Pricing & account breakdown

Pulled from Vercel's and Sanity's current pricing pages just now — verify before committing
to anything, pricing changes.

### ⚠️ Compliance issue found: the ACDC Vercel team is on Hobby, which isn't allowed

Vercel's own terms: **"Our Hobby plan is for personal, non-commercial use."** ACDC is an
organization — the team needs to be on **Pro** regardless of traffic level. This isn't
optional/nice-to-have, it should happen before or immediately at go-live.

### Minimum recurring cost, current setup (county + Fox Chapel)

| Item | Plan | Cost |
|---|---|---|
| Vercel — 1 team, 1 project serves everything | **Pro**, 1 seat | **$20/month** (unlimited free viewer seats; more paid seats only if more people need deploy/code access) |
| Sanity — county project (`6tkl67at`) | Free (up to 20 seats, 2 datasets, **public only**) | $0/month — *unless* fixing the Internal Documents privacy gap below |
| Sanity — Fox Chapel project (`ihpwz2dj`) | Free | $0/month |
| GitHub — 1 repo | Free | $0/month |
| Domain — GoDaddy registration | existing, unaffected by this migration | ~$12–20/yr (whatever's already being paid) |
| **Total new recurring cost** | | **$20/month**, or up to **~$65/month** if also fixing the item below |

### The Internal Documents doc type is a real security decision, not just a "known open item"

**The mechanism:** the app's members-only login, session cookie, and download proxy
(`app/(site)/members/(authed)/documents/`, `app/api/members/doc/[id]/route.ts`) are real,
well-built access control — but they only protect the Next.js app's own routes. They don't
protect the underlying Sanity data. The county project's ID (`6tkl67at`) isn't a secret —
it can't be, the browser needs it to load every public image, and it's visible in "view
source" on any page in seconds. Because the dataset is on the **public** tier (privacy is a
paid-plan feature — see below), Sanity's hosted API answers *any* query against that
project ID with no login and no token, including one that returns every internal
document's metadata *and* a working download URL for the attached PDF/Word file — fully
bypassing the app's login, session, and proxy, none of which exist at the Sanity data layer.

**Exploitability:** trivial. No hacking skill required — just knowing Sanity has a public
query API (documented on Sanity's own site) and grabbing the project ID from any page's
source. No exploit, no stolen credentials.

**What's exposed:** schema categories are Bylaws / Minutes / Forms / Training / Other —
committee-governance material, not obviously donor/financial data, but real internal
documents, some plausibly containing member names/addresses. For a political committee,
this is exactly the kind of thing an opposition researcher or disgruntled ex-member would
have both motive and trivial means to pull.

**Related, separate thing worth checking while in this area:** `app/api/members/preview-login/route.ts`
grants a full member session via a single shared password (`MEMBERS_PREVIEW_PASSWORD`), a
pre-launch bypass with a code comment saying to unset that env var at public launch —
confirm it's actually unset in production. Lower-tech than the issue above, but a second
real way into the members area if missed.

**Two real options, not one "fix later":**
- **Make it actually private (Sanity Growth, $15/seat/month).** Privacy is set *per
  dataset*, not per document type — you can't flag just `internalDoc` private while
  `production` stays public in the same project, it's all-or-nothing per dataset. Clean
  version: move internal docs to their **own small Sanity project** (consistent with the
  per-municipality isolation approach already used elsewhere), mark it private, and only
  the already-gated members-authed server routes read it with a token — the public site is
  untouched. Cost is seat-based on *that* project specifically — only the people who
  actually manage bylaws/minutes need seats, not all 3 county project members, so
  realistically **$15–30/month**, not the full county project's seat count.
  - **Must be its own project, not a second dataset bolted onto the existing county
    project — confirmed against Sanity's own docs, not assumed.** Built-in roles (Free and
    Growth alike) grant access to *all datasets* and *all documents* in a project;
    per-dataset/per-document scoping is a **custom roles** feature, Enterprise-only (same
    ~$30k+/yr tier already ruled out for this migration). So a second dataset in the same
    project would be invisible to the public internet, but visible in Studio to every
    existing county Editor/Administrator — not actually restricted to the right people.
  - **This must also stay per-entity if extended to municipalities later** — never one
    shared "private docs" project across municipalities. Same rule: any municipality
    officer invited to a shared private project to manage their own bylaws would, by the
    same all-datasets/all-documents default, be able to see every *other* municipality's
    internal documents too. That's the identical cross-municipality leak the whole
    per-project architecture exists to prevent, just relocated. Today this only matters for
    county — `internalDoc` isn't in the municipality schema yet — but if a municipality
    wants this feature later, it needs its own small dedicated Growth project, same as
    county's, never pooled.
- **Move it out of Sanity entirely — $0/month.** Drive (or similar) with real folder-level
  permissions; the members-authed route links to/proxies from there instead. No new
  subscription, but gives up the integrated Studio-upload workflow committee admins
  currently use for everything else.
- Lean: the small-dedicated-project version of the first option — keeps the editing
  workflow unified for a modest recurring cost — but it's a genuine tradeoff against
  Option 2's zero cost, not a technical no-brainer either way.

### Incremental cost per additional municipality: **$0/month**

One Vercel project already serves every municipality — no new Vercel cost ever, regardless
of how many municipalities join. Each new municipality is just another **free** Sanity
project (up to 20 seats each). The only cost is the one-time effort: run
`scripts/split-municipality-data.ts <slug>`, add an entry to `MIGRATED_MUNICIPALITY_PROJECTS`,
invite that committee's editors to their own project.

### Billing / ownership open questions

- Vercel Pro and Sanity Growth (if used) both need a payment method on file under ACDC's
  control eventually, not Alan's personal card indefinitely.
- SiteGround WordPress hosting is a cost that goes away once Phase 5 is confident and that
  account is cancelled (an actual savings, not just cleanup) — don't cancel until the
  rollback window has passed.

---

## Correction: unpublished drafts are NOT publicly readable

Commit `cc63b79` claims it fixed "a latent draft leak" where an unpublished draft could
render on the live site. **That claim is wrong** — recorded here so nobody acts on it.

The public read client (`sanity/lib/client.ts`, `countyClient`) is created **without a
token**, and Sanity's API excludes drafts from unauthenticated requests. Verified against
the live CDN endpoint: `count(*[_id in path("drafts.**")])` returns `0` publicly, while the
same query with an authenticated token returns the drafts. So drafts have never been
visible on the site.

The `PUBLISHED_ONLY` filter that commit added to `getPageBySlug` is harmless — keep it as
defence in depth — but it did not close a security hole.

**The general trap:** MCP/CLI tooling queries Sanity *authenticated*, so it sees drafts the
site cannot. Counts taken that way run high (this is why `municipality` looked like 35
records with a duplicate "Shaler" when the site only ever saw 34). Check the unauthenticated
CDN endpoint before concluding anything about what the public can see.

---

## Known open items

- Internal Documents privacy gap — see Phase 8, this is now a scoped decision (upgrade vs.
  migrate out) with a concrete mechanism and cost, not just a flag.
- Confirm `MEMBERS_PREVIEW_PASSWORD` is unset in production (see Phase 8) — a pre-launch
  shared-password bypass into the members area, meant to be removed before public launch.
- GitHub org/repo transfer — deferred, not urgent, deploys work fine without it.
