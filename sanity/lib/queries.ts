import { client } from './client'
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
  email?: string
  phone?: string
  facebookUrl?: string
  instagramUrl?: string
  xUrl?: string
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
  return client.fetch(
    `*[_type == "municipality" && slug.current == $municipalitySlug && isActive == true][0]`,
    { municipalitySlug }
  )
}

export interface MunicipalityListItem {
  _id: string
  name: string
  slug: { current: string }
  logo?: SanityImage
  customDomain?: string
  subdomain?: string
}

export async function getActiveMunicipalities(): Promise<MunicipalityListItem[]> {
  return client.fetch(
    `*[_type == "municipality" && isActive == true] | order(name asc) {
      _id, name, slug, logo, customDomain, subdomain
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

export async function getFeaturedEvents(limit = 3, municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && isFeatured == true && date >= $now && ${municipalityFilter(municipalitySlug)}] | order(date asc) [0...$limit]`,
    { now: new Date().toISOString(), limit, municipalitySlug }
  )
}

export async function getUpcomingEvents(limit = 20, municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && date >= $now && ${municipalityFilter(municipalitySlug)}] | order(date asc) [0...$limit]`,
    { now: new Date().toISOString(), limit, municipalitySlug }
  )
}

export async function getPastEvents(limit = 10, municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && date < $now && ${municipalityFilter(municipalitySlug)}] | order(date desc) [0...$limit]`,
    { now: new Date().toISOString(), limit, municipalitySlug }
  )
}

export async function getEventBySlug(slug: string, municipalitySlug = 'allegheny-county'): Promise<Event | null> {
  return client.fetch(
    `*[_type == "event" && slug.current == $slug && ${municipalityFilter(municipalitySlug)}][0]`,
    { slug, municipalitySlug }
  )
}

export async function getLatestNews(limit = 6, municipalitySlug = 'allegheny-county'): Promise<NewsPost[]> {
  return client.fetch(
    `*[_type == "news" && ${municipalityFilter(municipalitySlug)}] | order(publishedAt desc) [0...$limit]`,
    { limit, municipalitySlug }
  )
}

export async function getFeaturedNews(limit = 3, municipalitySlug = 'allegheny-county'): Promise<NewsPost[]> {
  return client.fetch(
    `*[_type == "news" && isFeatured == true && ${municipalityFilter(municipalitySlug)}] | order(publishedAt desc) [0...$limit]`,
    { limit, municipalitySlug }
  )
}

export async function getNewsPost(slug: string, municipalitySlug = 'allegheny-county'): Promise<NewsPost | null> {
  return client.fetch(
    `*[_type == "news" && slug.current == $slug && ${municipalityFilter(municipalitySlug)}][0]`,
    { slug, municipalitySlug }
  )
}

export async function getCommitteeMembers(municipalitySlug = 'allegheny-county'): Promise<CommitteeMember[]> {
  const members = await client.fetch<CommitteeMember[]>(
    `*[
      _type == "committeeMember" &&
      isActive != false &&
      !(
        defined(district) &&
        lower(district) in ["elected-official", "elected officials", "who-we-are"]
      ) &&
      ${municipalityFilter(municipalitySlug)}
    ] | order(district asc, displayOrder asc, name asc)`,
    { municipalitySlug }
  )
  return dedupeMembersByName(members)
}

export async function getCommitteeDirectoryEntries(municipalitySlug = 'allegheny-county'): Promise<CommitteeDirectoryEntry[]> {
  return client.fetch(
    `*[
      _type == "committeeDirectoryEntry" &&
      isActive != false &&
      ${municipalityFilter(municipalitySlug)}
    ] | order(committee asc, ward asc, district asc, displayOrder asc, firstName asc, lastName asc)`,
    { municipalitySlug }
  )
}

export async function getCommitteeContactEntries(municipalitySlug = 'allegheny-county'): Promise<CommitteeContactEntry[]> {
  return client.fetch(
    `*[
      _type == "committeeContactEntry" &&
      isActive != false &&
      ${municipalityFilter(municipalitySlug)}
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

export async function getWhoWeAreMembers(): Promise<CommitteeMember[]> {
  const members = await client.fetch<CommitteeMember[]>(
    `*[
      _type == "committeeMember" &&
      isActive != false &&
      (!defined(district) || district == "" || lower(district) == "who-we-are")
    ] | order(displayOrder asc, name asc)`
  )
  return dedupeMembersByName(members)
}

export async function getExternalLinks(): Promise<ExternalLink[]> {
  return client.fetch(
    `*[_type == "externalLink" && isActive != false] | order(category asc, displayOrder asc)`
  )
}

export async function getAllEventsForCalendar(municipalitySlug = 'allegheny-county'): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && ${municipalityFilter(municipalitySlug)}] | order(date asc) {
      _id, _type, title, slug, date, endDate, locationName, locationAddress, description, rsvpUrl, isFeatured
    }`,
    { municipalitySlug }
  )
}

export async function getPageBySlug(slug: string, municipalitySlug = 'allegheny-county'): Promise<PageDocument | null> {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug && ${municipalityFilter(municipalitySlug)}][0]`,
    { slug, municipalitySlug }
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

export async function getActiveActionAlerts(municipalitySlug = 'allegheny-county'): Promise<ActionAlert[]> {
  return client.withConfig({ useCdn: false }).fetch(
    `*[_type == "actionAlert" && isActive == true && startDate <= $now && (endDate == null || endDate >= $now) && ${municipalityFilter(municipalitySlug)}] | order(startDate desc)`,
    { now: new Date().toISOString(), municipalitySlug },
    { next: { revalidate: 300 } }
  )
}

export async function getBannerAlert(municipalitySlug = 'allegheny-county'): Promise<ActionAlert | null> {
  return client.withConfig({ useCdn: false }).fetch(
    `*[_type == "actionAlert" && isActive == true && showInBanner == true && startDate <= $now && (endDate == null || endDate >= $now) && ${municipalityFilter(municipalitySlug)}] | order(startDate desc)[0]`,
    { now: new Date().toISOString(), municipalitySlug },
    { next: { revalidate: 300 } }
  )
}
