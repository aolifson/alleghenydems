'use client'
import Link from 'next/link'
import Image from 'next/image'
import { useState, useRef } from 'react'

const NAV_ITEMS = [
  {
    label: 'About',
    href: '/about',
    children: [
      { label: 'Who We Are', href: '/about/who-we-are' },
      { label: 'Elected Officials', href: '/elected-officials' },
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
      { label: 'Register to Vote', href: 'https://www.pavoterservices.pa.gov/pages/VoterRegistrationApplication.aspx', external: true },
      { label: 'Vote by Mail', href: 'https://www.vote.pa.gov/Voting-in-PA/Pages/Mail-and-Absentee-Ballot.aspx', external: true },
      { label: 'Election Calendar', href: 'https://www.vote.pa.gov/About-Elections/Pages/Election-Calendar.aspx', external: true },
    ],
  },
  { label: 'Contact', href: '/contact' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  function openDropdown(label: string) {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setActiveDropdown(label)
  }

  function scheduleClose() {
    closeTimer.current = setTimeout(() => setActiveDropdown(null), 150)
  }

  return (
    <header className="bg-[var(--color-blue)] text-[var(--color-navy)] shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <Image src="/acdc-seal.png" alt="Allegheny County Democratic Committee" width={40} height={40} className="rounded-full" />
          <span className="font-display font-bold text-lg tracking-tight hidden sm:block">Allegheny Dems</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <div
              key={item.href}
              className="relative"
              onMouseEnter={() => item.children && openDropdown(item.label)}
              onMouseLeave={scheduleClose}
            >
              <Link
                href={item.href}
                className="px-3 py-2 rounded text-sm font-medium hover:bg-[var(--color-navy)]/10 transition-colors flex items-center gap-1"
              >
                {item.label}
                {item.children && <span className="text-xs opacity-60">▾</span>}
              </Link>
              {item.children && activeDropdown === item.label && (
                <div
                  className="absolute top-full left-0 mt-1 bg-white text-[var(--color-text)] shadow-lg rounded-md py-1 min-w-[200px]"
                  onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current) }}
                  onMouseLeave={scheduleClose}
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.href}
                      href={child.href}
                      target={'external' in child && child.external ? '_blank' : undefined}
                      rel={'external' in child && child.external ? 'noopener noreferrer' : undefined}
                      className="block px-4 py-2 text-sm hover:bg-[var(--color-blue-light)] hover:text-[var(--color-blue)] transition-colors"
                      onClick={() => setActiveDropdown(null)}
                    >
                      {child.label}
                      {'external' in child && child.external && <span className="ml-1 opacity-50 text-xs">↗</span>}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
          <Link
            href="https://secure.actblue.com"
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 px-4 py-2 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-semibold rounded transition-colors"
          >
            Donate
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded hover:bg-[var(--color-navy)]/10"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <span className="block w-5 h-0.5 bg-[var(--color-navy)] mb-1" />
          <span className="block w-5 h-0.5 bg-[var(--color-navy)] mb-1" />
          <span className="block w-5 h-0.5 bg-[var(--color-navy)]" />
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden bg-[var(--color-navy)] border-t border-white/10 px-4 pb-4 text-white">
          {NAV_ITEMS.map((item) => (
            <div key={item.href}>
              <Link
                href={item.href}
                className="block py-2 text-sm font-medium border-b border-white/10 text-white"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
              {item.children?.map((child) => (
                <Link
                  key={child.href}
                  href={child.href}
                  target={'external' in child && child.external ? '_blank' : undefined}
                  rel={'external' in child && child.external ? 'noopener noreferrer' : undefined}
                  className="block py-1.5 pl-4 text-sm text-white/70 hover:text-white"
                  onClick={() => setOpen(false)}
                >
                  {child.label}
                </Link>
              ))}
            </div>
          ))}
          <Link
            href="https://secure.actblue.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block text-center px-4 py-2 bg-[var(--color-red)] text-white text-sm font-semibold rounded"
          >
            Donate
          </Link>
        </div>
      )}
    </header>
  )
}
