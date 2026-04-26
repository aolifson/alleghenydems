'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'
import { usePathname } from 'next/navigation'
import type { NavItem, MunicipalityListItem } from '@/sanity/lib/queries'
import { useMunicipalityPrefix, prefixHref } from '@/lib/municipality-prefix-context'

function getMunicipalityUrl(m: MunicipalityListItem): string {
  if (m.customDomain) return `https://${m.customDomain}`
  if (m.subdomain) return `https://${m.subdomain}.alleghenydems.com`
  return `/municipalities/${m.slug.current}`
}

const DEFAULT_NAV_ITEMS: NavItem[] = [
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Who We Are', href: '/about/who-we-are' },
      { label: 'Elected Officials', href: '/elected-officials' },
      { label: 'Legislative Tracker', href: '/legislative-tracker' },
      { label: 'Democratic Organizations', href: '/links#party' },
    ],
  },
  {
    label: 'Get Involved',
    href: '/get-involved',
    children: [
      { label: 'Volunteer', href: '/get-involved#volunteer' },
      { label: 'Donate', href: 'https://secure.actblue.com', external: true },
    ],
  },
  {
    label: 'Committee Members',
    href: '/committee-members',
    children: [
      { label: 'Become a Committee Member', href: '/become-a-committee-member' },
      { label: 'Find Members & Positions', href: '/find-committee-members-and-positions' },
    ],
  },
  { label: 'Events', href: '/events' },
  { label: 'News', href: '/news' },
  {
    label: 'Vote',
    href: '/vote',
    children: [
      { label: '2026 Voter Guide', href: '/voter-guide' },
      { label: 'Register to Vote', href: 'https://www.pavoterservices.pa.gov/pages/VoterRegistrationApplication.aspx', external: true },
      { label: 'Vote by Mail', href: 'https://www.vote.pa.gov/Voting-in-PA/Pages/Mail-and-Absentee-Ballot.aspx', external: true },
      { label: 'Election Calendar', href: 'https://www.vote.pa.gov/About-Elections/Pages/Election-Calendar.aspx', external: true },
    ],
  },
  { label: 'Contact', href: '/contact' },
]

const FACEBOOK_URL = 'https://www.facebook.com/AlleghenyDems'
const INSTAGRAM_URL = 'https://www.instagram.com/allegheny.dems'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M13.5 8.5V6.8c0-.6.4-1 1-1H16V3h-2c-2.5 0-3.5 1.3-3.5 3.7v1.8H8V12h2.5v9h3V12H16l.5-3.5h-3Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm4.5 2.8A4.4 4.4 0 1 1 7.6 12 4.4 4.4 0 0 1 12 7.6Zm0 1.8a2.6 2.6 0 1 0 2.6 2.6A2.6 2.6 0 0 0 12 9.4Zm4.8-2.9a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z" />
    </svg>
  )
}

export default function Nav({
  navItems,
  logoUrl,
  municipalityName,
  municipalities = [],
  wordpressBaseUrl,
  localActivePath,
}: {
  navItems?: NavItem[] | null
  logoUrl?: string | null
  municipalityName?: string | null
  municipalities?: MunicipalityListItem[]
  // When set, all non-local, non-external links are prefixed with this URL
  // and rendered as <a> tags pointing to the WordPress site.
  wordpressBaseUrl?: string
  // The local path that should show as active when wordpressBaseUrl is set
  // (since all wp-prefixed links won't match usePathname()).
  localActivePath?: string
}) {
  const basePath = useMunicipalityPrefix()
  const resolvedLogoUrl = logoUrl ?? '/acdc-seal.png'
  const resolvedLogoAlt = municipalityName ?? 'Allegheny County Democratic Committee'
  const pathname = usePathname()

  const wpMode = !!wordpressBaseUrl

  // Prefix all internal nav hrefs with the municipality basePath so navigation
  // stays within the demo path (e.g. /municipalities/northside/events).
  // When basePath is '' (county or subdomain), hrefs are returned unchanged.
  // In WordPress mode, non-local hrefs are prefixed with the WordPress base URL instead.
  const rawItems = (navItems && navItems.length > 0) ? navItems : DEFAULT_NAV_ITEMS

  function resolveHref(href: string, isLocal?: boolean): string {
    if (href.startsWith('http')) return href
    if (wpMode && !isLocal) return wordpressBaseUrl + href
    return prefixHref(href, basePath)
  }

  const items = rawItems.map((item) => ({
    ...item,
    href: resolveHref(item.href, (item as { local?: boolean }).local),
    children: item.children?.map((child) => ({
      ...child,
      href: resolveHref(child.href, (child as { local?: boolean }).local),
    })),
  }))
  const [open, setOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function isActive(href: string) {
    // In WordPress mode, only match against the designated local active path
    if (wpMode) {
      if (!localActivePath) return false
      return href === localActivePath || href.startsWith(localActivePath + '/')
    }
    if (href === '/') return pathname === '/'
    if (href.startsWith('http')) return false
    return pathname === href || pathname.startsWith(href + '/')
  }

  function isChildActive(href: string) {
    if (!href) return false
    // In WordPress mode, match the local active path against the original local href
    if (wpMode) {
      if (!localActivePath) return false
      const hrefPath = href.split('#')[0]
      return hrefPath === localActivePath || hrefPath.startsWith(localActivePath + '/')
    }
    if (href.startsWith('http')) return false
    const hrefPath = href.split('#')[0]
    return pathname === hrefPath || pathname.startsWith(hrefPath + '/')
  }

  function itemHasActiveChild(item: { children?: Array<{ href: string }> }) {
    return item.children?.some((child) => isChildActive(child.href)) ?? false
  }

  const activeParentItem = items.find((item) => itemHasActiveChild(item)) ?? null
  const activeChildItem = activeParentItem?.children?.find((child) => isChildActive(child.href)) ?? null

  function openDropdown(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveDropdown(label)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  return (
    <header className="bg-[var(--color-blue)] text-[var(--color-navy)] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center h-16">
        {/* Logo only */}
        {wpMode ? (
          <a href={wordpressBaseUrl + '/'} className="shrink-0 hover:opacity-90 transition-opacity">
            <Image src={resolvedLogoUrl} alt={resolvedLogoAlt} width={40} height={40} className="rounded-full" />
          </a>
        ) : (
          <Link href={prefixHref('/', basePath)} className="shrink-0 hover:opacity-90 transition-opacity">
            <Image src={resolvedLogoUrl} alt={resolvedLogoAlt} width={40} height={40} className="rounded-full" />
          </Link>
        )}

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1 ml-5 flex-1">
          {items.map((item) => {
            const itemIsExternal = item.href.startsWith('http')
            const NavLinkTag = itemIsExternal ? 'a' : Link
            const parentIsActive = isActive(item.href) || itemHasActiveChild(item)
            return (
              <div
                key={item.href}
                className="relative"
                onMouseEnter={() => item.children && openDropdown(item.label)}
                onMouseLeave={scheduleClose}
              >
                <NavLinkTag
                  href={item.href}
                  className={
                    parentIsActive
                      ? "px-3 py-2 rounded text-sm font-semibold bg-[var(--color-navy)]/15 border-b-2 border-white/80 transition-colors flex items-center gap-1"
                      : "px-3 py-2 rounded text-sm font-medium hover:bg-[var(--color-navy)]/10 transition-colors flex items-center gap-1"
                  }
                >
                  {item.label}
                  {item.children && <span className="text-xs opacity-60">▾</span>}
                </NavLinkTag>
                {item.children && activeDropdown === item.label && (
                  <div
                    className="absolute top-full left-0 mt-1 bg-white text-[var(--color-text)] shadow-lg rounded-md py-1 min-w-[200px]"
                    onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current) }}
                    onMouseLeave={scheduleClose}
                  >
                    {item.children.map((child) => {
                      const childIsExternal = child.href.startsWith('http')
                      const isChildExt = 'external' in child && child.external
                      const ChildTag = childIsExternal ? 'a' : Link
                      return (
                        <ChildTag
                          key={child.href}
                          href={child.href}
                          target={isChildExt ? '_blank' : undefined}
                          rel={isChildExt ? 'noopener noreferrer' : undefined}
                          className={
                            isChildActive(child.href)
                              ? "block px-4 py-2 pl-3 text-sm font-semibold text-[var(--color-blue)] bg-[var(--color-blue-light)] border-l-2 border-[var(--color-blue)] transition-colors"
                              : "block px-4 py-2 text-sm hover:bg-[var(--color-blue-light)] hover:text-[var(--color-blue)] transition-colors"
                          }
                          onClick={() => setActiveDropdown(null)}
                        >
                          {child.label}
                          {isChildExt && <span className="ml-1 opacity-50 text-xs">↗</span>}
                        </ChildTag>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}

          {/* Local Committees dropdown — county site only, hidden when empty */}
          {municipalities.length > 0 && (
            <div
              className="relative"
              onMouseEnter={() => openDropdown('__local_committees__')}
              onMouseLeave={scheduleClose}
            >
              <button
                className="px-3 py-2 rounded text-sm font-medium hover:bg-[var(--color-navy)]/10 transition-colors flex items-center gap-1"
              >
                Local Committees <span className="text-xs opacity-60">▾</span>
              </button>
              {activeDropdown === '__local_committees__' && (
                <div
                  className="absolute top-full right-0 mt-1 bg-white text-[var(--color-text)] shadow-lg rounded-md py-1 min-w-[220px]"
                  onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current) }}
                  onMouseLeave={scheduleClose}
                >
                  {municipalities.map((m) => (
                    <a
                      key={m._id}
                      href={getMunicipalityUrl(m)}
                      className="block px-4 py-2 text-sm hover:bg-[var(--color-blue-light)] hover:text-[var(--color-blue)] transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {m.name}
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Desktop right controls */}
        <div className="hidden md:flex items-center gap-2 ml-4">
          <Link
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 text-white hover:bg-white/15 transition-colors"
          >
            <FacebookIcon />
          </Link>
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 text-white hover:bg-white/15 transition-colors"
          >
            <InstagramIcon />
          </Link>
          <Link
            href="https://store.alleghenydems.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-1 px-4 py-2 bg-white/15 hover:bg-white/25 text-white text-sm font-semibold rounded transition-colors"
          >
            Merch Store
          </Link>
          <Link
            href="https://secure.actblue.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-semibold rounded transition-colors"
          >
            Donate
          </Link>
        </div>

        {/* Mobile hamburger */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          <Link
            href={FACEBOOK_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Facebook"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 text-white hover:bg-white/15 transition-colors"
          >
            <FacebookIcon />
          </Link>
          <Link
            href={INSTAGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 text-white hover:bg-white/15 transition-colors"
          >
            <InstagramIcon />
          </Link>
          <button
            className="p-2 rounded hover:bg-[var(--color-navy)]/10"
            onClick={() => setOpen(!open)}
            aria-label="Toggle menu"
          >
            <span className="block w-5 h-0.5 bg-[var(--color-navy)] mb-1" />
            <span className="block w-5 h-0.5 bg-[var(--color-navy)] mb-1" />
            <span className="block w-5 h-0.5 bg-[var(--color-navy)]" />
          </button>
        </div>
      </div>

      {activeParentItem && activeChildItem && (
        <div className="border-t border-[var(--color-navy)]/10 bg-white/20 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 py-2">
            <p className="text-sm font-medium text-[var(--color-navy)]">
              {activeParentItem.label}
              <span className="mx-2 text-[var(--color-navy)]/45">/</span>
              <span className="font-semibold text-white drop-shadow-sm">{activeChildItem.label}</span>
            </p>
          </div>
        </div>
      )}

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[var(--color-navy)] border-t border-white/10 px-4 pb-4 text-white">
          {items.map((item) => {
            const itemIsExternal = item.href.startsWith('http')
            const MobileNavTag = itemIsExternal ? 'a' : Link
            const parentIsActive = isActive(item.href) || itemHasActiveChild(item)
            return (
              <div key={item.href}>
                <MobileNavTag
                  href={item.href}
                  className={
                    parentIsActive
                      ? "block py-2 pl-2 text-sm font-semibold border-b border-white/10 text-white border-l-2 border-l-white"
                      : "block py-2 text-sm font-medium border-b border-white/10 text-white"
                  }
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </MobileNavTag>
                {item.children?.map((child) => {
                  const childIsExternal = child.href.startsWith('http')
                  const isChildExt = 'external' in child && child.external
                  const MobileChildTag = childIsExternal ? 'a' : Link
                  return (
                    <MobileChildTag
                      key={child.href}
                      href={child.href}
                      target={isChildExt ? '_blank' : undefined}
                      rel={isChildExt ? 'noopener noreferrer' : undefined}
                      className={
                        isChildActive(child.href)
                          ? "block py-1.5 pl-5 text-sm font-semibold text-white"
                          : "block py-1.5 pl-4 text-sm text-white/70 hover:text-white"
                      }
                      onClick={() => setOpen(false)}
                    >
                      {child.label}
                    </MobileChildTag>
                  )
                })}
              </div>
            )
          })}
          {municipalities.length > 0 && (
            <div className="border-b border-white/10 pb-2 mb-2">
              <p className="py-2 text-xs font-semibold text-white/50 uppercase tracking-wide">Local Committees</p>
              {municipalities.map((m) => (
                <a
                  key={m._id}
                  href={getMunicipalityUrl(m)}
                  className="block py-1.5 pl-4 text-sm text-white/70 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {m.name}
                </a>
              ))}
            </div>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="https://store.alleghenydems.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center px-4 py-2 bg-white/15 text-white text-sm font-semibold rounded"
            >
              Merch Store
            </Link>
            <Link
              href="https://secure.actblue.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-center px-4 py-2 bg-[var(--color-red)] text-white text-sm font-semibold rounded"
            >
              Donate
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
