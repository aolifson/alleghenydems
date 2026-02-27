import { client } from './client'
import type { SanityDocument } from 'next-sanity'

// ─── Types ──────────────────────────────────────────────────────────

export interface SanityImage {
  asset: { _ref: string }
  hotspot?: { x: number; y: number }
  alt?: string
  caption?: string
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
  displayOrder?: number
}

export interface VoterGuideRace {
  _key?: string
  officeTitle: string
  term?: string
  annualSalary?: string
  powersAndDuties?: string[]
  districts: VoterGuideDistrict[]
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

export async function getFeaturedEvents(limit = 3): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && isFeatured == true && date >= $now] | order(date asc) [0...$limit]`,
    { now: new Date().toISOString(), limit }
  )
}

export async function getUpcomingEvents(limit = 20): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && date >= $now] | order(date asc) [0...$limit]`,
    { now: new Date().toISOString(), limit }
  )
}

export async function getPastEvents(limit = 10): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event" && date < $now] | order(date desc) [0...$limit]`,
    { now: new Date().toISOString(), limit }
  )
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  return client.fetch(
    `*[_type == "event" && slug.current == $slug][0]`,
    { slug }
  )
}

export async function getLatestNews(limit = 6): Promise<NewsPost[]> {
  return client.fetch(
    `*[_type == "news"] | order(publishedAt desc) [0...$limit]`,
    { limit }
  )
}

export async function getNewsPost(slug: string): Promise<NewsPost | null> {
  return client.fetch(
    `*[_type == "news" && slug.current == $slug][0]`,
    { slug }
  )
}

export async function getCommitteeMembers(): Promise<CommitteeMember[]> {
  const members = await client.fetch<CommitteeMember[]>(
    `*[
      _type == "committeeMember" &&
      isActive != false &&
      !(
        defined(district) &&
        lower(district) in ["elected-official", "elected officials", "who-we-are"]
      )
    ] | order(district asc, displayOrder asc, name asc)`
  )
  return dedupeMembersByName(members)
}

export async function getCommitteeDirectoryEntries(): Promise<CommitteeDirectoryEntry[]> {
  return client.fetch(
    `*[
      _type == "committeeDirectoryEntry" &&
      isActive != false
    ] | order(committee asc, ward asc, district asc, displayOrder asc, firstName asc, lastName asc)`
  )
}

export async function getCommitteeContactEntries(): Promise<CommitteeContactEntry[]> {
  return client.fetch(
    `*[
      _type == "committeeContactEntry" &&
      isActive != false
    ] | order(committee asc, displayOrder asc)`
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

export async function getAllEventsForCalendar(): Promise<Event[]> {
  return client.fetch(
    `*[_type == "event"] | order(date asc) {
      _id, _type, title, slug, date, endDate, locationName, locationAddress, description, rsvpUrl, isFeatured
    }`
  )
}

export async function getPageBySlug(slug: string): Promise<PageDocument | null> {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug][0]`,
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
