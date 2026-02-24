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
  photo?: SanityImage
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
  return client.fetch(
    `*[_type == "committeeMember" && isActive != false] | order(district asc, displayOrder asc, name asc)`
  )
}

export async function getExternalLinks(): Promise<ExternalLink[]> {
  return client.fetch(
    `*[_type == "externalLink" && isActive != false] | order(category asc, displayOrder asc)`
  )
}

export async function getPageBySlug(slug: string) {
  return client.fetch(
    `*[_type == "page" && slug.current == $slug][0]`,
    { slug }
  )
}
