import type { NavItem } from '@/sanity/lib/queries'
import { ACDC_DONATE_URL } from '@/lib/links'

// The county's default navigation. This is the shared source of truth for:
//   1. What renders when a municipality has no navigation customization at all.
//   2. The picklist Sanity Studio shows municipality editors for "Hide Default
//      Sections" (see the municipality schema's `hiddenDefaultNavSections` field).
//
// Each top-level item has a stable `key` so a municipality can reference it
// (to hide it) independent of label text, which editors may want to tweak
// later without breaking existing hide-lists.
//
// One visitor intent per top-level item; every destination appears exactly once.
export interface DefaultNavSection extends NavItem {
  key: string
}

export const DEFAULT_NAV_ITEMS: DefaultNavSection[] = [
  {
    key: 'about',
    label: 'About',
    href: '/about',
    children: [
      { label: 'Who We Are', href: '/about/who-we-are' },
      { label: 'What We Do', href: '/about' },
      { label: 'Elected Officials', href: '/elected-officials' },
      { label: 'Legislative Tracker', href: '/legislative-tracker' },
      { label: 'News', href: '/news' },
    ],
  },
  {
    key: 'get-involved',
    label: 'Get Involved',
    href: '/get-involved',
    children: [
      { label: 'Volunteer', href: '/volunteer' },
      { label: 'Run for Office', href: '/run-for-office' },
      { label: 'Events', href: '/events' },
      { label: 'Donate', href: ACDC_DONATE_URL, external: true },
    ],
  },
  {
    key: 'vote',
    label: 'Vote',
    href: '/vote',
    children: [
      { label: 'Make a Plan to Vote', href: '/plan-to-vote' },
      { label: '2026 Voter Guide', href: '/voter-guide' },
      { label: 'Register to Vote', href: 'https://www.pavoterservices.pa.gov/pages/VoterRegistrationApplication.aspx', external: true },
      { label: 'Vote by Mail', href: 'https://www.vote.pa.gov/Voting-in-PA/Pages/Mail-and-Absentee-Ballot.aspx', external: true },
      { label: 'Find Your Polling Place', href: 'https://www.pavoterservices.pa.gov/pages/pollingplaceinfo.aspx', external: true },
      { label: 'Election Calendar', href: 'https://www.vote.pa.gov/About-Elections/Pages/Election-Calendar.aspx', external: true },
    ],
  },
  {
    // Committee content sits under one heading that opens with what a
    // committee member actually is and does. Jumping a visitor straight to a
    // bare directory assumed they already knew — and "Find Members and
    // Positions" is the wording people are used to from the old site.
    key: 'committee-members',
    label: 'Committee Members',
    href: '/become-a-committee-member',
    children: [
      { label: 'Become a Committee Member', href: '/become-a-committee-member' },
      { label: 'Find Members and Positions', href: '/committee-members' },
      { label: 'Local Committee Listing', href: '/local-committees' },
    ],
  },
  {
    key: 'contact',
    label: 'Contact',
    href: '/contact',
  },
]

// Options list for the Sanity "Hide Default Sections" field — kept next to
// DEFAULT_NAV_ITEMS so the two can't drift out of sync.
export const DEFAULT_NAV_SECTION_OPTIONS = DEFAULT_NAV_ITEMS.map((item) => ({
  title: item.label,
  value: item.key,
}))

// Computes the effective top-level nav for a municipality that is inheriting
// (rather than fully overriding) the county nav: the defaults minus any
// hidden sections, plus any additional sections the committee has defined,
// appended in order.
export function resolveInheritedNavItems(
  hiddenKeys?: string[] | null,
  additionalItems?: NavItem[] | null
): NavItem[] {
  const hidden = new Set(hiddenKeys ?? [])
  const base: NavItem[] = DEFAULT_NAV_ITEMS.filter((item) => !hidden.has(item.key)).map(
    (item): NavItem => ({
      label: item.label,
      href: item.href,
      external: item.external,
      children: item.children,
    })
  )
  return [...base, ...(additionalItems ?? [])]
}
