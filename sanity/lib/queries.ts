import { client, getTenantClient, type TenantClient } from './client'
import type { SanityDocument } from 'next-sanity'

// ─── Types ──────────────────────────────────────────────────────────

export interface SanityImage {
  asset: { _ref: string }
  hotspot?: { x: number; y: number }
  alt?: string
  caption?: string
}

export interface ActionAlert extends SanityDocument {
  title: string
  headline: string
  body?: unknown[]
  urgency: 'urgent' | 'action' | 'announcement'
  ctaLabel?: string
  ctaUrl?: string
  startDate: string
  endDate?: string
  isActive: boolean
  showInBanner: boolean
  shareWithAll?: boolean
  sharedWith?: Array<{ _key: string; _ref: string }>
}

export interface Event extends SanityDocument {
  title: string
  slug: { current: string }
  date: string
  endDate?: string
  locationName?: string
  locationAddress?: string
  description?: unknown[]
  image?: SanityImage
  rsvpUrl?: string
  isFeatured?: boolean
  shareWithAll?: boolean
  sharedWith?: Array<{ _key: string; _ref: string }>
}

export interface NewsPost extends SanityDocument {
  title: string
  slug: { current: string }
  publishedAt: string
  excerpt?: string
  image?: SanityImage
  isExternal?: boolean
  externalUrl?: string
  externalPublication?: string
  body?: unknown[]
  isFeatured?: boolean
  shareWithAll?: boolean
  sharedWith?: Array<{ _key: string; _ref: string }>
}

export interface CommitteeMember extends SanityDocument {
  name: string
  title?: string
  district?: string
  bio?: string
  email?: string
  phone?: string
  showPhonePublicly?: boolean
  facebookUrl?: string
  instagramUrl?: string
  xUrl?: string
  blueskyUrl?: string
  websiteUrl?: string
  photo?: SanityImage
  isActive?: boolean
  displayOrder?: number
}

export interface CommitteeDirectoryEntry extends SanityDocument {
  committee: string
  ward?: string
  district?: string
  firstName?: string
  lastName?: string
  committeeOffice?: string
  isActive?: boolean
  displayOrder?: number
}

export interface CommitteeContactEntry extends SanityDocument {
  committee: string
  chair?: string
  websiteUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  otherUrl?: string
  isActive?: boolean
  displayOrder?: number
}

export interface ExternalLink extends SanityDocument {
  label: string
  url: string
  description?: string
  category: string
  isActive?: boolean
  displayOrder?: number
}

export interface NavChild {
  _key?: string
  label: string
  href: string
  external?: boolean
}

export interface NavItem {
  _key?: string
  label: string
  href: string
  external?: boolean
  children?: NavChild[]
}

export interface SiteSettings extends SanityDocument {
  heroHeadline?: string
  heroSubtext?: string
  heroImage?: SanityImage
  facebookPageUrl?: string
  instagramHandle?: string
  contactEmail?: string
  contactPhone?: string
  address?: string
  officeHours?: string
  footerText?: string
  googleCalendarEmbedUrl?: string
  googleAnalyticsId?: string
  facebookPixelId?: string
  navigationItems?: NavItem[]
}

export interface MunicipalitySettings extends SanityDocument {
  name: string
  slug: { current: string }
  customDomain?: string
  subdomain?: string
  logo?: SanityImage
  accentColor?: string
  heroHeadline?: string
  heroSubtext?: string
  heroImage?: SanityImage
  contactEmail?: string
  contactPhone?: string
  address?: string
  facebookPageUrl?: string
  instagramHandle?: string
  footerText?: string
  navigationItems?: NavItem[]
  hiddenDefaultNavSections?: string[]
  additionalNavItems?: NavItem[]
  googleAnalyticsId?: string
  isActive?: boolean
  voterGuideSearchTerms?: string[]
}

export interface PageDocument extends SanityDocument {
  title: string
  slug: { current: string }
  heroHeadline?: string
  heroSubhead?: string
  heroImage?: SanityImage
  body?: unknown[]
}

export interface VoterGuideCandidate {
  _key?: string
  name: string
  campaignWebsite?: string
  volunteerUrl?: string
  facebookUrl?: string
  instagramUrl?: string
  xUrl?: string
  photo?: SanityImage
  description?: string
  endorsedByAcdc?: boolean
  ballotStatus?: 'listed' | 'alsoAppearing' | 'appearing' | 'endorsed' | 'unknown'
  displayOrder?: number
}

export interface VoterGuideDistrict {
  _key?: string
  districtLabel: string
  districtDescription?: string
  searchTerms?: string[]
  zipCodes?: string[]
  candidates: VoterGuideCandidate[]
  numberToElect?: number
  displayOrder?: number
}

export interface VoterGuideRace {
  _key?: string
  officeTitle: string
  numberToElect?: number
  term?: string
  annualSalary?: string
  powersAndDuties?: string[]
  candidates?: VoterGuideCandidate[]
  districts?: VoterGuideDistrict[]
  displayOrder?: number
}

export interface VoterGuideDocument extends SanityDocument {
  title: string
  slug: { current: string }
  cycleYear: number
  heroHeadline?: string
  heroSubhead?: string
  electionDate?: string
  intro?: unknown[]
  races: VoterGuideRace[]
  sourcePdfTitle?: string
}

export interface LegislativeAction {
  _key?: string
  official: string
  party: 'D' | 'R'
  office: string
  description: string
  date: string
  type: 'accomplishment' | 'blocked' | 'harmful'
  category: string
  sourceLabel: string
  sourceUrl: string
  municipalities?: string[]
  displayOrder?: number
  // Auto-import metadata (populated by scripts/refresh-legislative-tracker.py)
  needsReview?: boolean
  autoImported?: boolean
  externalId?: string
  billId?: string
  chamber?: 'pa-house' | 'pa-senate' | 'us-house' | 'us-senate'
  voteValue?: 'Yea' | 'Nay' | 'Present' | 'Not Voting'
  voteResult?: string
  partyBreakdown?: string
  crossedParty?: boolean
  billSummary?: string
}

export interface LegislativeLocalEntry {
  _key?: string
  community: string
  outcome: 'helped' | 'hurt' | 'ongoing'
  party: 'D' | 'R' | 'both'
  summary: string
  detail: string
  date: string
  sourceLabel: string
  sourceUrl: string
  displayOrder?: number
}

export interface LegislativeExternalLink {
  _key?: string
  label: string
  url: string
  description?: string
  displayOrder?: number
}

export interface LegislativeOfficialRow {
  _key?: string
  official: string
  office: string
  municipalities: string
  displayOrder?: number
}

export interface LegislativeTrackerDocument extends SanityDocument {
  title: string
  slug: { current: string }
  heroHeadline?: string
  heroSubhead?: string
  heroImage?: SanityImage
  categories?: string[]
  actions?: LegislativeAction[]
  localEntries?: LegislativeLocalEntry[]
  districtLookupIntro?: string
  districtLookupLinks?: LegislativeExternalLink[]
  officialTableIntro?: string
  republicanOfficials?: LegislativeOfficialRow[]
  aboutTitle?: string
  aboutBody?: string
  lastUpdatedNote?: string
}

function dedupeMembersByName<T extends CommitteeMember>(members: T[]): T[] {
  const seen = new Set<string>()
  return members.filter((member) => {
    const key = `${(member.district ?? '').trim().toLowerCase()}|${member.name.trim().toLowerCase()}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ─── Queries ─────────────────────────────────────────────────────────

export async function getSiteSettings(): Promise<SiteSettings | null> {
  return client.fetch(`*[_type == "siteSettings"][0]`)
}

export async function getMunicipalitySettings(municipalitySlug: string): Promise<MunicipalitySettings | null> {
  const tenant = getTenantClient(municipalitySlug)
  if (!tenant.isMigrated) {
    return client.fetch(
      `*[_type == "municipality" && slug.current == $municipalitySlug && isActive == true][0]`,
      { municipalitySlug }
    )
  }

  // Migrated tenants: branding/nav/contact live in their own project's
  // municipalitySettings singleton; slug/domain routing stays in the
  // county's thin municipality registry (see docs/MULTI-PROJECT-MIGRATION.md).
  const [registryDoc, ownSettings] = await Promise.all([
    client.fetch<{ slug: { current: string }; customDomain?: string; subdomain?: string; isActive?: boolean } | null>(
      `*[_type == "municipality" && slug.current == $municipalitySlug && isActive == true][0]{ slug, customDomain, subdomain, isActive }`,
      { municipalitySlug }
    ),
    // Typed as the full interface for convenience — this doc doesn't actually
    // store slug/customDomain/subdomain/isActive (those are county-registry-
    // only), but the merge below always overrides them with registryDoc's
    // values before this is returned.
    tenant.client.fetch<MunicipalitySettings | null>(`*[_type == "municipalitySettings"][0]`),
  ])
  if (!registryDoc || !ownSettings) return null

  const merged: MunicipalitySettings = {
    ...ownSettings,
    slug: registryDoc.slug,
    customDomain: registryDoc.customDomain,
    subdomain: registryDoc.subdomain,
    isActive: registryDoc.isActive,
  }
  return stampSourceProject<MunicipalitySettings>(merged, tenant, ['logo', 'heroImage'])
}

export interface MunicipalityListItem {
  _id: string
  name: string
  slug: { current: string }
  logo?: SanityImage
  customDomain?: string
  subdomain?: string
  externalSiteUrl?: string
  contactEmail?: string
  facebookPageUrl?: string
}

export async function getActiveMunicipalities(): Promise<MunicipalityListItem[]> {
  return client.fetch(
    `*[_type == "municipality" && isActive == true] | order(name asc) {
      _id, name, slug, logo, customDomain, subdomain, externalSiteUrl, contactEmail, facebookPageUrl
    }`
  )
}

// ─── Municipality filter helper ───────────────────────────────────────────────
// County queries match documents with no municipality reference OR an explicit
// allegheny-county reference. Municipality queries match by slug, shareWithAll, or sharedWith array.
function municipalityFilter(slug: string): string {
  if (slug === 'allegheny-county') {
    return `(!defined(municipality) || municipality->slug.current == "allegheny-county")`
  }
  return `(municipality->slug.current == $municipalitySlug || shareWithAll == true || $municipalitySlug in sharedWith[]->slug.current)`
}

// ─── Migrated-municipality helpers ─────────────────────────────────────────
// A migrated municipality (see lib/municipality-projects.ts) owns its content
// in its own Sanity project. Its site shows that content plus county items
// pushed down via shareWithAll/sharedWith — minus anything the committee has
// opted out of via `hiddenSharedItems` on their own municipalitySettings doc.
// Not-yet-migrated municipalities keep using `municipalityFilter` above,
// unchanged, against the single county project.

// County image refs fetched from a migrated tenant's OWN project need a
// builder pointed at that project (see sanity/lib/image.ts) — stamp it on
// after fetch since GROQ can't add it, and Sanity's image type can't carry it.
function stampSourceProject<T extends Record<string, unknown>>(
  doc: T,
  tenant: TenantClient,
  imageFields: string[]
): T {
  if (!tenant.isMigrated) return doc
  const stamped: Record<string, unknown> = { ...doc }
  for (const field of imageFields) {
    const value = stamped[field]
    if (value && typeof value === 'object') {
      stamped[field] = { ...(value as object), _sourceProject: { projectId: tenant.projectId, dataset: tenant.dataset } }
    }
  }
  return stamped as T
}

function mergeAndSort<T extends Record<string, unknown>>(
  own: T[],
  shared: T[],
  key: string,
  direction: 'asc' | 'desc',
  limit?: number
): T[] {
  const merged = [...own, ...shared]
  merged.sort((a, b) => {
    const av = String(a[key] ?? '')
    const bv = String(b[key] ?? '')
    const cmp = av < bv ? -1 : av > bv ? 1 : 0
    return direction === 'asc' ? cmp : -cmp
  })
  return typeof limit === 'number' ? merged.slice(0, limit) : merged
}

async function getHiddenSharedItemIds(tenant: TenantClient): Promise<string[]> {
  if (!tenant.isMigrated) return []
  const settings = await tenant.client.fetch<{ hiddenSharedItems?: string[] } | null>(
    `*[_type == "municipalitySettings"][0]{ hiddenSharedItems }`
  )
  return settings?.hiddenSharedItems ?? []
}

// Shared-from-county filter for a migrated tenant, run against the county
// project. Mirrors municipalityFilter's share logic but excludes anything
// the committee has opted out of.
function sharedFromCountyFilter(): string {
  return `!defined(municipality) && (shareWithAll == true || $municipalitySlug in sharedWith[]->slug.current) && !(_id in $hiddenSharedItems)`
}

// Shared shape for the four list queries below (featured/upcoming/past
// events, and their news equivalents): in legacy mode, one query against
// the county project exactly as before. In migrated mode, the tenant's own
// content plus county items shared-down to them, merged and sorted in JS
// since they come from two separate projects.
async function fetchTenantScopedList<T extends Record<string, unknown>>(
  type: 'event' | 'news',
  ownAndCountyFilter: string,
  legacyFilter: string,
  sortField: string,
  sortDirection: 'asc' | 'desc',
  limit: number,
  municipalitySlug: string,
  imageFields: string[]
): Promise<T[]> {
  const tenant = getTenantClient(municipalitySlug)
  if (!tenant.isMigrated) {
    return client.fetch(
      `*[_type == "${type}" && ${ownAndCountyFilter} && ${legacyFilter}] | order(${sortField} ${sortDirection}) [0...$limit]`,
      { now: new Date().toISOString(), limit, municipalitySlug }
    )
  }

  const hiddenSharedItems = await getHiddenSharedItemIds(tenant)
  const [own, shared] = await Promise.all([
    tenant.client.fetch<T[]>(
      `*[_type == "${type}" && ${ownAndCountyFilter}] | order(${sortField} ${sortDirection})`,
      { now: new Date().toISOString() }
    ),
    client.fetch<T[]>(
      `*[_type == "${type}" && ${ownAndCountyFilter} && ${sharedFromCountyFilter()}] | order(${sortField} ${sortDirection})`,
      { now: new Date().toISOString(), municipalitySlug, hiddenSharedItems }
    ),
  ])
  const stampedOwn = own.map((doc) => stampSourceProject(doc, tenant, imageFields))
  return mergeAndSort(stampedOwn, shared, sortField, sortDirection, limit)
}

// Single-document lookups (by slug): try the tenant's own project first,
// then fall back to a matching county item shared down to them.
async function fetchTenantScopedDoc<T extends Record<string, unknown>>(
  type: 'event' | 'news',
  slug: string,
  municipalitySlug: string,
  imageFields: string[]
): Promise<T | null> {
  const tenant = getTenantClient(municipalitySlug)
  if (!tenant.isMigrated) {
    return client.fetch(
      `*[_type == "${type}" && slug.current == $slug && ${municipalityFilter(municipalitySlug)}][0]`,
      { slug, municipalitySlug }
    )
  }

  const own = await tenant.client.fetch<T | null>(`*[_type == "${type}" && slug.current == $slug][0]`, { slug })
  if (own) return stampSourceProject(own, tenant, imageFields)

  const hiddenSharedItems = await getHiddenSharedItemIds(tenant)
  return client.fetch<T | null>(
    `*[_type == "${type}" && slug.current == $slug && ${sharedFromCountyFilter()}][0]`,
    { slug, municipalitySlug, hiddenSharedItems }
  )
}

export async function getFeaturedEvents(limit = 3, municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  return fetchTenantScopedList<Event>('event', 'isFeatured == true && date >= $now', municipalityFilter(municipalitySlug), 'date', 'asc', limit, municipalitySlug, ['image'])
}

export async function getUpcomingEvents(limit = 20, municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  return fetchTenantScopedList<Event>('event', 'date >= $now', municipalityFilter(municipalitySlug), 'date', 'asc', limit, municipalitySlug, ['image'])
}

export async function getPastEvents(limit = 10, municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  return fetchTenantScopedList<Event>('event', 'date < $now', municipalityFilter(municipalitySlug), 'date', 'desc', limit, municipalitySlug, ['image'])
}

export async function getEventBySlug(slug: string, municipalitySlug = 'allegheny-county'): Promise<Event | null> {
  return fetchTenantScopedDoc<Event>('event', slug, municipalitySlug, ['image'])
}

export async function getLatestNews(limit = 6, municipalitySlug = 'allegheny-county'): Promise<NewsPost[]> {
  return fetchTenantScopedList<NewsPost>('news', 'defined(_id)', municipalityFilter(municipalitySlug), 'publishedAt', 'desc', limit, municipalitySlug, ['image'])
}

export async function getFeaturedNews(limit = 3, municipalitySlug = 'allegheny-county'): Promise<NewsPost[]> {
  return fetchTenantScopedList<NewsPost>('news', 'isFeatured == true', municipalityFilter(municipalitySlug), 'publishedAt', 'desc', limit, municipalitySlug, ['image'])
}

export async function getNewsPost(slug: string, municipalitySlug = 'allegheny-county'): Promise<NewsPost | null> {
  return fetchTenantScopedDoc<NewsPost>('news', slug, municipalitySlug, ['image'])
}

// Committee roster types aren't shareable/push-down content (no
// shareWithAll/sharedWith field) — a migrated tenant simply owns its own
// rows, with no county merge needed.
function tenantScopedFilter(baseFilter: string, municipalitySlug: string, tenant: TenantClient): string {
  return tenant.isMigrated ? baseFilter : `${baseFilter} && ${municipalityFilter(municipalitySlug)}`
}

export async function getCommitteeMembers(municipalitySlug = 'allegheny-county'): Promise<CommitteeMember[]> {
  const tenant = getTenantClient(municipalitySlug)
  // Phone is projected only when the member opted into showing it publicly,
  // so private numbers never reach the public payload.
  const members = await tenant.client.fetch<CommitteeMember[]>(
    `*[
      _type == "committeeMember" &&
      isActive == true &&
      !(
        defined(district) &&
        lower(district) in ["elected-official", "elected officials", "who-we-are"]
      ) &&
      ${tenantScopedFilter('true', municipalitySlug, tenant)}
    ] | order(district asc, displayOrder asc, name asc) {
      _id, _type, name, title, district, bio, photo, email,
      "phone": select(showPhonePublicly == true => phone),
      "showPhonePublicly": showPhonePublicly == true,
      facebookUrl, instagramUrl, xUrl, blueskyUrl, websiteUrl,
      isActive, displayOrder
    }`,
    { municipalitySlug }
  )
  return dedupeMembersByName(members).map((m) => stampSourceProject(m, tenant, ['photo']))
}

export async function getCommitteeDirectoryEntries(municipalitySlug = 'allegheny-county'): Promise<CommitteeDirectoryEntry[]> {
  const tenant = getTenantClient(municipalitySlug)
  return tenant.client.fetch(
    `*[
      _type == "committeeDirectoryEntry" &&
      isActive != false &&
      ${tenantScopedFilter('true', municipalitySlug, tenant)}
    ] | order(committee asc, ward asc, district asc, displayOrder asc, firstName asc, lastName asc)`,
    { municipalitySlug }
  )
}

export async function getCommitteeContactEntries(municipalitySlug = 'allegheny-county'): Promise<CommitteeContactEntry[]> {
  const tenant = getTenantClient(municipalitySlug)
  return tenant.client.fetch(
    `*[
      _type == "committeeContactEntry" &&
      isActive != false &&
      ${tenantScopedFilter('true', municipalitySlug, tenant)}
    ] | order(committee asc, displayOrder asc)`,
    { municipalitySlug }
  )
}

export async function getElectedOfficials(): Promise<CommitteeMember[]> {
  const members = await client.fetch<CommitteeMember[]>(
    `*[
      _type == "committeeMember" &&
      defined(district) &&
      lower(district) in ["elected-official", "elected officials"]
    ] | order(_updatedAt desc, name asc)`
  )
  return dedupeMembersByName(members)
}

export async function getWhoWeAreMembers(municipalitySlug = 'allegheny-county'): Promise<CommitteeMember[]> {
  const tenant = getTenantClient(municipalitySlug)
  const members = await tenant.client.fetch<CommitteeMember[]>(
    `*[
      _type == "committeeMember" &&
      isActive != false &&
      (!defined(district) || district == "" || lower(district) == "who-we-are") &&
      ${tenantScopedFilter('true', municipalitySlug, tenant)}
    ] | order(displayOrder asc, name asc)`,
    { municipalitySlug }
  )
  return dedupeMembersByName(members).map((m) => stampSourceProject(m, tenant, ['photo']))
}

export async function getExternalLinks(): Promise<ExternalLink[]> {
  return client.fetch(
    `*[_type == "externalLink" && isActive != false] | order(category asc, displayOrder asc)`
  )
}

const CALENDAR_EVENT_PROJECTION = `{
  _id, _type, title, slug, date, endDate, locationName, locationAddress, description, rsvpUrl, isFeatured
}`

export async function getAllEventsForCalendar(municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  const tenant = getTenantClient(municipalitySlug)
  if (!tenant.isMigrated) {
    return client.fetch(
      `*[_type == "event" && ${municipalityFilter(municipalitySlug)}] | order(date asc) ${CALENDAR_EVENT_PROJECTION}`,
      { municipalitySlug }
    )
  }

  const hiddenSharedItems = await getHiddenSharedItemIds(tenant)
  const [own, shared] = await Promise.all([
    tenant.client.fetch<Event[]>(`*[_type == "event"] | order(date asc) ${CALENDAR_EVENT_PROJECTION}`),
    client.fetch<Event[]>(
      `*[_type == "event" && ${sharedFromCountyFilter()}] | order(date asc) ${CALENDAR_EVENT_PROJECTION}`,
      { municipalitySlug, hiddenSharedItems }
    ),
  ])
  return mergeAndSort(own, shared, 'date', 'asc')
}

export async function getPageBySlug(slug: string, municipalitySlug = 'allegheny-county'): Promise<PageDocument | null> {
  const tenant = getTenantClient(municipalitySlug)

  if (!tenant.isMigrated) {
    const page = await client.fetch<PageDocument | null>(
      `*[_type == "page" && slug.current == $slug && ${municipalityFilter(municipalitySlug)}][0]`,
      { slug, municipalitySlug }
    )
    if (page || municipalitySlug === 'allegheny-county') return page
    // Municipality sites fall back to the county's page when the committee
    // hasn't created its own version — a bare hero with no body is worse than
    // county copy. A committee page always wins when it exists.
    return client.fetch<PageDocument | null>(
      `*[_type == "page" && slug.current == $slug && ${municipalityFilter('allegheny-county')}][0]`,
      { slug }
    )
  }

  const ownPage = await tenant.client.fetch<PageDocument | null>(`*[_type == "page" && slug.current == $slug][0]`, { slug })
  if (ownPage) return stampSourceProject(ownPage, tenant, ['heroImage'])
  // Same inherit-from-county fallback as legacy mode, above.
  return client.fetch<PageDocument | null>(
    `*[_type == "page" && slug.current == $slug && ${municipalityFilter('allegheny-county')}][0]`,
    { slug }
  )
}

export async function getVoterGuideBySlug(slug: string): Promise<VoterGuideDocument | null> {
  return client.withConfig({ useCdn: false }).fetch(
    `*[_type == "voterGuide" && slug.current == $slug][0]`,
    { slug },
    { cache: 'no-store' }
  )
}

export async function getLatestVoterGuide(): Promise<VoterGuideDocument | null> {
  return client.withConfig({ useCdn: false }).fetch(
    `*[_type == "voterGuide"] | order(cycleYear desc, _updatedAt desc)[0]`,
    {},
    { cache: 'no-store' }
  )
}

export async function getLegislativeTrackerBySlug(slug: string): Promise<LegislativeTrackerDocument | null> {
  return client.withConfig({ useCdn: false }).fetch(
    `*[_type == "legislativeTracker" && slug.current == $slug][0]`,
    { slug },
    { cache: 'no-store' }
  )
}

const ACTIVE_ALERT_FILTER = 'isActive == true && startDate <= $now && (endDate == null || endDate >= $now)'

export async function getActiveActionAlerts(municipalitySlug = 'allegheny-county'): Promise<ActionAlert[]> {
  const tenant = getTenantClient(municipalitySlug)
  const now = new Date().toISOString()
  if (!tenant.isMigrated) {
    return client.withConfig({ useCdn: false }).fetch(
      `*[_type == "actionAlert" && ${ACTIVE_ALERT_FILTER} && ${municipalityFilter(municipalitySlug)}] | order(startDate desc)`,
      { now, municipalitySlug },
      { next: { revalidate: 300 } }
    )
  }

  const hiddenSharedItems = await getHiddenSharedItemIds(tenant)
  const [own, shared] = await Promise.all([
    tenant.client.withConfig({ useCdn: false }).fetch<ActionAlert[]>(
      `*[_type == "actionAlert" && ${ACTIVE_ALERT_FILTER}] | order(startDate desc)`,
      { now },
      { next: { revalidate: 300 } }
    ),
    client.withConfig({ useCdn: false }).fetch<ActionAlert[]>(
      `*[_type == "actionAlert" && ${ACTIVE_ALERT_FILTER} && ${sharedFromCountyFilter()}] | order(startDate desc)`,
      { now, municipalitySlug, hiddenSharedItems },
      { next: { revalidate: 300 } }
    ),
  ])
  return mergeAndSort(own, shared, 'startDate', 'desc')
}

// ─── Members-only queries ─────────────────────────────────────────────
// Only call these from members-area pages and /api/members routes that
// have already verified the session — they expose private contact info.

export interface RosterRow {
  _id: string
  name: string
  role?: string
  seat?: string
  email?: string
  phone?: string
}

// The roster merges two sources: county leadership profiles (committeeMember,
// which carry email/phone) and the seat-level directory entries imported from
// the old site (committeeDirectoryEntry, names + seats only for now).
export async function getMemberRoster(): Promise<RosterRow[]> {
  const noCdn = client.withConfig({ useCdn: false })
  const [leadership, members, seats] = await Promise.all([
    noCdn.fetch<Array<{ _id: string; name: string; role?: string; email?: string; phone?: string }>>(
      `*[_type == "committeeMember" && isActive == true && lower(district) == "who-we-are"]
        | order(displayOrder asc, name asc) { _id, name, "role": title, email, phone }`,
      {},
      { cache: 'no-store' }
    ),
    noCdn.fetch<Array<{ _id: string; name: string; role?: string; seat?: string; email?: string; phone?: string }>>(
      `*[
        _type == "committeeMember" &&
        isActive == true &&
        !(defined(district) && lower(district) in ["elected-official", "elected officials", "who-we-are"])
      ] | order(district asc, name asc) { _id, name, "role": title, "seat": district, email, phone }`,
      {},
      { cache: 'no-store' }
    ),
    noCdn.fetch<Array<{ _id: string; firstName?: string; lastName?: string; committeeOffice?: string; committee?: string; ward?: string; district?: string }>>(
      `*[
        _type == "committeeDirectoryEntry" &&
        isActive != false &&
        (coalesce(firstName, '') + coalesce(lastName, '')) != ''
      ] | order(committee asc, ward asc, district asc, lastName asc, firstName asc) {
        _id, firstName, lastName, committeeOffice, committee, ward, district
      }`,
      {},
      { cache: 'no-store' }
    ),
  ])

  const leadershipRows: RosterRow[] = leadership.map((m) => ({ ...m, seat: 'County Leadership' }))
  const seatRows: RosterRow[] = seats.map((s) => ({
    _id: s._id,
    name: [s.firstName, s.lastName].filter(Boolean).join(' '),
    role: s.committeeOffice || undefined,
    seat: [
      s.committee,
      s.ward && s.ward !== '0' ? `Ward ${s.ward}` : null,
      s.district ? `District ${s.district}` : null,
    ]
      .filter(Boolean)
      .join(' · '),
  }))
  return [...leadershipRows, ...members, ...seatRows]
}

export interface InternalDoc extends SanityDocument {
  title: string
  category?: string
  description?: string
  publishedAt?: string
  fileName?: string
  fileExtension?: string
}

// Deliberately never projects the file asset URL — Sanity CDN URLs are
// unauthenticated, so downloads go through /api/members/doc/[id] instead.
export async function getInternalDocs(): Promise<InternalDoc[]> {
  return client.withConfig({ useCdn: false }).fetch(
    `*[_type == "internalDoc" && isActive == true && defined(file.asset)] | order(category asc, publishedAt desc, title asc) {
      _id, _type, title, category, description, publishedAt,
      "fileName": file.asset->originalFilename,
      "fileExtension": file.asset->extension
    }`,
    {},
    { cache: 'no-store' }
  )
}

export async function getBannerAlert(municipalitySlug = 'allegheny-county'): Promise<ActionAlert | null> {
  const tenant = getTenantClient(municipalitySlug)
  const now = new Date().toISOString()
  const bannerFilter = `${ACTIVE_ALERT_FILTER} && showInBanner == true`

  if (!tenant.isMigrated) {
    return client.withConfig({ useCdn: false }).fetch(
      `*[_type == "actionAlert" && ${bannerFilter} && ${municipalityFilter(municipalitySlug)}] | order(startDate desc)[0]`,
      { now, municipalitySlug },
      { next: { revalidate: 300 } }
    )
  }

  const hiddenSharedItems = await getHiddenSharedItemIds(tenant)
  const [own, shared] = await Promise.all([
    tenant.client.withConfig({ useCdn: false }).fetch<ActionAlert[]>(
      `*[_type == "actionAlert" && ${bannerFilter}] | order(startDate desc)`,
      { now },
      { next: { revalidate: 300 } }
    ),
    client.withConfig({ useCdn: false }).fetch<ActionAlert[]>(
      `*[_type == "actionAlert" && ${bannerFilter} && ${sharedFromCountyFilter()}] | order(startDate desc)`,
      { now, municipalitySlug, hiddenSharedItems },
      { next: { revalidate: 300 } }
    ),
  ])
  return mergeAndSort(own, shared, 'startDate', 'desc')[0] ?? null
}
