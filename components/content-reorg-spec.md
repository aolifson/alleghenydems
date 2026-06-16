# ACDC Site — Content Reorg, Public Member Directory & Members-Only Area

**Implementation spec for Claude Code** · Repo: `aolifson/alleghenydems` · Branch: create `content-reorg` off `main`

---

## 1 · Context & Goals

This is a Next.js 16 (App Router) + Sanity v5 site deployed on Vercel, with multi-tenant municipality routing via `middleware.ts` (do not change the tenant routing). The reorg has four goals:

1. **Clear public site.** A regular visitor should immediately see: how to get involved, what immediate actions are needed, what the committee does, and voter guide info. No duplicate links or content.
2. **Sleek public committee-member directory.** Anyone can find a committee member, see their role, ward/municipality, photo, email, and social links. This is *public* content with a modern, user-friendly design — not a gated section and not the current dense tables.
3. **Members-only area** behind login for content not of interest to the general public (admin guide, full roster with phones, internal documents).
4. **External links visually distinct from internal links** everywhere.

### Out of scope — do not touch
- Municipality multi-tenant routing in `middleware.ts` (hostname/subdomain → slug logic). The auth additions below extend this file but must not alter the existing rewrite/header behavior.
- Sanity Studio role scoping in `sanity.config.ts` (municipality editors).
- The voter guide, legislative tracker, and Facebook feed implementations.
- ISR `revalidate` values on existing pages.

### Preflight check
`app/(site)/layout.tsx` has a WordPress hybrid mode: `wpMode = process.env.NEXT_PUBLIC_WP_NAV !== 'false'` swaps in `WORDPRESS_NAV_ITEMS` pointing at the old alleghenydems.com. **This entire reorg targets the native nav** (`DEFAULT_NAV_ITEMS` in `components/nav.tsx` and the Sanity `navigationItems` override). Leave `wpMode` working, but verify your dev/preview environment sets `NEXT_PUBLIC_WP_NAV=false` so you can see your changes. Add a note to the PR description that production needs `NEXT_PUBLIC_WP_NAV=false` to show the new nav.

---

## 2 · Navigation Reorg

Replace `DEFAULT_NAV_ITEMS` in `components/nav.tsx` with the structure below. Principle: each top-level item maps to one visitor intent; every destination appears in exactly one place.

```
About                          /about
  ├─ Who We Are                /about/who-we-are
  ├─ What We Do                /about            (committee's purpose; see §4)
  ├─ Elected Officials         /elected-officials
  ├─ Legislative Tracker       /legislative-tracker
  └─ News                      /news

Get Involved                   /get-involved
  ├─ Volunteer                 /get-involved#volunteer
  ├─ Become a Committee Member /become-a-committee-member
  ├─ Events                    /events
  └─ Donate                    https://secure.actblue.com   [external]

Vote                           /vote
  ├─ 2026 Voter Guide          /voter-guide
  ├─ Register to Vote          pavoterservices.pa.gov…      [external]
  ├─ Vote by Mail              vote.pa.gov…                 [external]
  ├─ Find Your Polling Place   pavoterservices.pa.gov…      [external]
  └─ Election Calendar         vote.pa.gov…                 [external]

Committee Directory            /committee-members           (single item, no dropdown)

Local Committees ▾             (existing municipalities dropdown — unchanged)

Contact                        /contact

[right-aligned, visually secondary]  Member Login → /members
[right-aligned button]               Donate (keep the existing red button)
```

### Changes this implies
- **Remove** the old "Committee Members" dropdown. "Become a Committee Member" now lives only under Get Involved. `/find-committee-members-and-positions` is absorbed into the new `/committee-members` directory (§5) — add a permanent redirect from the old path. Keep the existing `/committee → /committee-members` redirect.
- **Move** News from top-level into About (it's "what the committee does/says"); top-level Events moves under Get Involved. If nav real estate allows on desktop, keeping Events top-level too is acceptable — but then remove it from the Get Involved dropdown. One location per link is the hard rule.
- **Add** "Find Your Polling Place" to the Vote dropdown (it currently only exists in the homepage quick-action boxes).
- `NavChild` already has an `external?: boolean` flag — extend `NavItem` (top-level) with the same, and in the Sanity `navItem` object (both `siteSettings.ts` and `municipality.ts` schemas) auto-treat any `href` beginning with `http` as external rather than adding a checkbox. Update the `Nav` component to render the external indicator (§7) in dropdowns.
- Add the "Member Login" link rendered subtly (small text link or person icon) on the right side of the nav, before the Donate button. On municipality sites it should still point to the county `/members` (auth is county-level).

---

## 3 · Landing Page Reorg (`app/(site)/page.tsx`)

Restructure the homepage so each section has one job and nothing repeats the nav or other sections. Final section order:

1. **Hero** — headline, subtext, and exactly **two** CTAs: `Get Involved` (red) and `2026 Voter Guide` (gold). Remove the Donate button from the hero (it's permanently in the nav) and remove the generic "Voter Resources" button in favor of the more specific Voter Guide link.
2. **Action alerts / "What's Needed Now"** — move the existing Take Action alert grid up to second position and retitle it "What's Needed Now". This is the "immediate actions" surface. When no alerts are active, render a slim fallback strip with a single line ("No urgent calls to action right now — see ways to get involved →" linking to /get-involved) instead of omitting the section entirely.
3. **Upcoming Events** — existing featured-events cards, with a "View all events →" link.
4. **What the Committee Does** — new short static section (3 cards or a 2-sentence paragraph + 3 links): electing Democrats locally, the voter guide/legislative tracker as civic resources, and supporting local committees. Links to /about, /voter-guide, and the Local Committees dropdown anchor. This replaces the need for visitors to infer purpose from the About page.
5. **News** — existing featured/latest news cards.
6. **Facebook feed** — keep, but move below News (it's supplementary, not primary).

**Remove the Quick Action Boxes section entirely.** Its four links (Register to Vote, Find Polling Place, Events, Volunteer) are all now in the nav/hero/alerts — it's pure duplication. The two external voter links live in the Vote dropdown.

---

## 4 · About / Content De-duplication

- `app/(site)/about/page.tsx` fallback content ends with a "Get Involved" paragraph — remove it (that's the Get Involved page's job) and replace with a single link line: "Ready to participate? → Get Involved".
- `app/(site)/get-involved/page.tsx` fallback cards: change "Become a Committee Person" href from `/contact` to `/become-a-committee-member`, and "Young Democrats" from `/contact` to its real destination if one exists in the Sanity `externalLink` documents (check `category` values); otherwise leave pointing at /contact with a "contact us to connect" description.
- Audit `components/footer.tsx` (not shown here — read it) for links duplicating the nav; footer may repeat nav links (that's conventional and fine) but must use the same labels and the ExternalLink treatment.

---

## 5 · Public Committee Directory — `/committee-members`

Replace the current `/committee-members` page and the table-based `/find-committee-members-and-positions` page with one polished directory at `/committee-members`. This is the centerpiece UI work — invest in design quality here.

### Data model
The `committeeMember` schema (`sanity/schemaTypes/committeeMember.ts`) already has: `name`, `title`, `district`, `photo` (hotspot), `email`, `phone`, `facebookUrl`, `instagramUrl`, `xUrl`, `isActive`, `displayOrder`, `municipality` ref. Add:

- `bio` — `text`, rows 3, optional. "A sentence or two about the member, shown when their card is expanded."
- `blueskyUrl` and `websiteUrl` — `url`, optional (match validation style of existing URL fields).
- `showPhonePublicly` — `boolean`, `initialValue: false`. **Privacy default:** email and socials are public; phone numbers render only in the members-only roster unless this is flipped per member. (Flag this in the PR — it's a deliberate change from today's "Public contact phone" field description, easy to reverse if the committee prefers phones public.)

There is a second dataset: `committeeDirectoryEntry` (seat-level: committee/ward/district/name/office, including vacant seats) and `committeeContactEntry` (committee chairs + links), imported from the old site's ninja tables. Keep these document types and render them in the same page as described below — do not attempt a data migration in this branch.

### Page design (server component + one client component for search/filter)
- **Header**: PageHero pattern, headline "Committee Directory", subhead like "Find the Democratic committee members representing your neighborhood."
- **Sticky filter bar** (client): one search input (matches name, ward, municipality, role) + a municipality/ward select + a role select (Chair / Vice Chair / Committee Person / etc., derived from distinct `title` values). Show a live result count. Debounce input.
- **Leadership row**: members whose `title` matches chair/officer roles (or `displayOrder` set) appear first in a slightly larger card row.
- **Member cards**, responsive grid (1/2/3-4 cols): photo (with initials-avatar fallback in the brand navy/blue), name, role badge, ward/municipality line, then a compact action row of icon buttons — mailto envelope, and social icons for whichever of Facebook/Instagram/X/Bluesky/website are set (all external-link treated, §7). Card click expands (or opens a small dialog) showing `bio` and full details. Use the existing design tokens (`--color-navy`, `--color-blue`, `--color-gold`, etc.) — sleek means generous whitespace, consistent card heights, subtle hover elevation, not new colors.
- **Seats & vacancies section** below the cards: render `committeeDirectoryEntry` rows grouped by committee/ward in a cleaner styled list (replacing the current paginated table aesthetic — keep the existing client-side search/pagination logic from `committee-directory-table.tsx` but restyle). Vacant seats (`firstName`/`lastName` empty) get a gold "Seat open — become a committee member →" inline CTA linking to `/become-a-committee-member`. This turns the directory into a recruiting surface.
- **Local committee contacts**: render `committeeContactEntry` as small cards (committee name, chair, link icons) rather than a table.
- On municipality sites, pre-filter to that municipality (the `municipality` reference / slug header already exists for this pattern elsewhere).

### Routing
- `/find-committee-members-and-positions` → permanent redirect to `/committee-members` (replace the page file with a `redirect()` like the existing `app/(site)/committee/page.tsx` pattern, or use `next.config` redirects).
- Update `getCommitteeMembers`-style queries in `sanity/lib/queries.ts` to project the new fields; filter `isActive == true`.

---

## 6 · Members-Only Area — `/members`

### Contents (Phase 1)
- `/members` — landing: short welcome, links to the items below, who to contact for access problems.
- `/members/roster` — the full committee member roster **including phone numbers** and emails, searchable, with a CSV download button (server route that streams CSV from the same Sanity query).
- `/members/admin-guide` — serve the existing admin guide here. **Important:** `public/admin-guide.html` is currently world-readable; move it out of `public/` (e.g. render its content from a protected route, or relocate the file to a non-public dir and stream it from `/members/admin-guide` after auth). Add a redirect from `/admin-guide.html` to `/members/admin-guide`.
- `/members/documents` — internal documents list backed by a new Sanity type `internalDoc`: `title` (string, required), `file` (file), `category` (string list: Bylaws, Minutes, Forms, Training, Other), `description` (text), `publishedAt` (date), `isActive` (boolean). Add it to the Studio structure under "Committee & People" with a clear "🔒 Internal — members only" title. Files served through an authenticated API route (`/api/members/doc/[id]`) that checks the session then streams from Sanity's asset URL — never link the raw Sanity CDN URL in the page (CDN URLs are unauthenticated).

### Auth: passwordless magic links (recommended — $0, no new services)
Rationale: `resend` is already a dependency; member emails already live in Sanity; this gives per-person access that self-revokes when `isActive` is turned off. No database needed — use stateless signed tokens.

Implementation sketch:

1. **Env vars**: `AUTH_SECRET` (32+ random bytes; add to Vercel + `.env.local.example`), reuse existing `RESEND_API_KEY`. Add `MEMBERS_AREA_FROM_EMAIL`.
2. **`POST /api/members/login`** — body `{ email }`. Normalize, then GROQ check: `*[_type == "committeeMember" && isActive == true && lower(email) == $email][0]`. Always respond `{ ok: true, message: "If that address is on file, a sign-in link is on its way." }` regardless of match (no account enumeration). If matched, sign a JWT (`jose` lib — add as dependency, or HMAC via node `crypto`) with `{ email, purpose: 'login' }`, 15-minute expiry, and send via Resend: a clean branded email with one button linking to `/api/members/verify?token=…`. Rate-limit: simple in-memory/cookie-based throttle of 3 requests per email per 15 min (best-effort is fine at this scale).
3. **`GET /api/members/verify`** — validate token (signature, expiry, purpose), then set an httpOnly, Secure, SameSite=Lax cookie `member_session` containing a second JWT `{ email, purpose: 'session' }` with **30-day** expiry, and redirect to `/members`. Invalid/expired → redirect to `/members/login?error=expired`.
4. **`/members/login`** page — single email field + submit (and the post-submit confirmation state). Note in copy: "Use the email address the committee has on file for you."
5. **Gating** — in `middleware.ts`, before the existing tenant logic, intercept paths matching `/members(/.*)?` and `/api/members/(?!login|verify).*`: verify the `member_session` JWT (edge-compatible — use `jose`, not node `crypto`). No/invalid cookie → redirect to `/members/login`. Do **not** re-check Sanity on every request in middleware; instead the roster/doc API routes (node runtime) re-verify `isActive` on each call, which is where the sensitive data actually flows.
6. **Logout** — `POST /api/members/logout` clears the cookie; small "Sign out" link in the members layout.
7. **Members layout** — `app/(site)/members/layout.tsx` with a slim sub-nav (Roster · Documents · Admin Guide · Sign out) and a visible "Members area" badge so it's obvious you're behind the gate.

Resend free tier (~100 emails/day) is far beyond login-link volume for a committee. If the committee later wants something even simpler, a single shared password checked in middleware is the fallback — but it loses per-person revocation, so don't build it unless asked.

---

## 7 · External vs Internal Link Treatment

Create `components/external-link.tsx`:

- Renders `<a target="_blank" rel="noopener noreferrer">` with children, then an inline ↗ icon (small SVG, `aria-hidden`) and a visually-hidden "(opens in new tab)" span for screen readers.
- Export a helper `isExternalHref(href: string)` → true for `http(s)://` hrefs not on the site's own domains (alleghenydems.com, *.alleghenydems.com, vercel.app previews).

Apply everywhere a link can be external: `components/nav.tsx` dropdown items (auto-detect via `isExternalHref`, in addition to the existing `external` flag), footer, the Get Involved cards, the homepage hero/alert CTAs (`ctaUrl` on action alerts can be external), the committee contact cards (replace `HostLink` internals in `committee-contact-table.tsx`), member directory social icons, and the `/links` page if present. Internal links continue to use `next/link` with no icon. The result: every ↗ means "you're leaving the site," consistently.

---

## 8 · Sanity Studio updates

- Add `bio`, `blueskyUrl`, `websiteUrl`, `showPhonePublicly` to `committeeMember` (descriptions written for non-technical editors, matching the existing style).
- New `internalDoc` type registered in `sanity/schemaTypes/index` and added to `sanity.config.ts` structure (county scope only — do not expose it to municipality-scoped editors in this phase).
- Update the `navItem` href descriptions in `siteSettings.ts` / `municipality.ts` to mention that external links automatically get the ↗ treatment.

---

## 9 · Acceptance Checklist

- [ ] `git checkout -b content-reorg`; all work commits to this branch; no force-pushes to main.
- [ ] With `NEXT_PUBLIC_WP_NAV=false`: nav shows the §2 structure; every destination appears exactly once; external items show ↗.
- [ ] Homepage: hero has 2 CTAs; "What's Needed Now" renders alerts (and the fallback strip when none); no Quick Action Boxes; sections in §3 order; no link appears twice on the page.
- [ ] `/committee-members`: card directory loads with search/filter; photos with initials fallback; email + social icons work; phone numbers absent unless `showPhonePublicly`; vacant seats show the recruiting CTA; old `/find-committee-members-and-positions` and `/committee` redirect here.
- [ ] `/members/*` unreachable without session (direct URL, curl); magic-link round trip works; inactive member email gets the generic message and no link grants access after `isActive` is off (roster/doc routes re-check); logout works.
- [ ] `public/admin-guide.html` no longer publicly served; available at `/members/admin-guide`.
- [ ] Internal doc file downloads require a session; raw Sanity CDN URLs never appear in rendered HTML for internal docs.
- [ ] Municipality sites still resolve correctly (spot-check `/municipalities/<slug>` path mode and a subdomain in preview); their nav/directory pre-filtering still works.
- [ ] `npm run lint` and `npm run build` pass; no new TypeScript errors.
- [ ] PR description notes: required env vars (`AUTH_SECRET`, `MEMBERS_AREA_FROM_EMAIL`), the `NEXT_PUBLIC_WP_NAV=false` production flip, and the phone-privacy default change.

### Suggested commit sequence
1. `ExternalLink` component + nav/footer adoption
2. Nav restructure + redirects
3. Homepage reorg
4. Committee directory schema fields + queries
5. Committee directory UI
6. Auth (login/verify/middleware/logout)
7. Members area pages + internalDoc schema + admin-guide relocation
8. Polish pass + checklist verification