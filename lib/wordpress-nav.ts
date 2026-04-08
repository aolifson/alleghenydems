// WordPress-mirrored nav config for hybrid pages (e.g. Voter Guide).
//
// Items with `local: true` are served from this Next.js site — they link locally
// and show active-state highlighting via usePathname(). All other items link to
// the WordPress site (alleghenydems.com) when a wordpressBaseUrl is provided.
//
// GRADUATION PATH: To bring a new page live on this site, add `local: true` to
// its nav item. To revert it to WordPress, remove the flag.
//
// REINSTATEMENT PATH: In app/(wordpress-nav)/layout.tsx, set WORDPRESS_BASE = ''
// to make all links local and restore fully self-contained behaviour.

export interface WordPressNavChild {
  label: string
  href: string
  external?: boolean // true = always open in new tab regardless of mode
  local?: boolean    // true = always link to this Next.js site, never prefixed
}

export interface WordPressNavItem {
  label: string
  href: string
  local?: boolean
  children?: WordPressNavChild[]
}

export const WORDPRESS_NAV_ITEMS: WordPressNavItem[] = [
  {
    label: 'About',
    href: '/about/',
    children: [
      { label: 'Who We Are', href: '/who-we-are/' },
      { label: 'What We Do', href: '/what-we-do/' },
      { label: 'Elected Officials', href: '/elected-officials/' },
      { label: 'Democratic Organizations', href: '/democratic-organizations/' },
    ],
  },
  {
    label: 'Get Involved',
    href: '/get-involved-in-acdc/',
    children: [
      { label: 'Volunteer', href: '/volunteer/' },
      { label: 'Contribute', href: 'https://secure.actblue.com/donate/alleghenydems', external: true },
      { label: 'Committee Members', href: '/committee-members/' },
      { label: 'Young Democrats of Allegheny County', href: '/ydac/' },
    ],
  },
  {
    label: 'Committee Members',
    href: '/committee-members/',
    children: [
      { label: 'Become a Committee Member', href: '/become-a-committee-member/' },
      { label: 'Find Committee Members and Positions', href: '/find-committee-members-and-positions/' },
    ],
  },
  {
    label: 'Vote',
    href: '/vote/',
    children: [
      { label: 'Register to Vote', href: 'https://www.pavoterservices.pa.gov/Pages/VoterRegistrationApplication.aspx', external: true },
      { label: 'Ballot by Mail FAQ', href: '/casting-a-ballot-by-mail-faq/' },
      { label: 'Vote By Mail', href: 'https://www.pavoterservices.pa.gov/OnlineAbsenteeApplication/#/OnlineAbsenteeBegin', external: true },
      { label: 'Absentee Ballot', href: 'https://www.pavoterservices.pa.gov/OnlineAbsenteeApplication/#/OnlineAbsenteeBegin', external: true },
      { label: 'Election Calendar', href: 'https://www.pa.gov/agencies/vote/elections/upcoming-elections', external: true },
      // Voter Guide is hosted on this Next.js site — local: true keeps it local
      { label: 'Voter Guide', href: '/voter-guide', local: true },
    ],
  },
  {
    label: 'Run for Office',
    href: '/run-for-office/',
    children: [
      { label: '2026 ACDC Endorsement', href: '/2026-acdc-endorsement/' },
      { label: 'Board of Elections Requirements', href: '/board-of-elections-requirements/' },
      { label: 'ACDC and BOE Support', href: '/acdc-and-boe-support/' },
    ],
  },
  { label: 'Events', href: '/calendar/' },
  { label: 'News & Updates', href: '/news/' },
  { label: 'Contact', href: '/contact/' },
]

export const WORDPRESS_MERCH_URL = 'https://store.alleghenydems.com/'
export const WORDPRESS_DONATE_URL = 'https://secure.actblue.com/donate/alleghenydems'
export const WORDPRESS_BASE_URL = 'https://alleghenydems.com'
export const WORDPRESS_LOGO_URL = 'https://alleghenydems.com/wp-content/uploads/2023/04/ACDC_SEAL_RGB.png'
