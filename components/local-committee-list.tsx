'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { LocalCommittee } from '@/sanity/lib/queries'
import ExternalLink from '@/components/external-link'

// Committees onboarded onto our platform link to their own site; the rest
// link to whatever website they gave us, with the ↗ external treatment.
function committeeLink(c: LocalCommittee): { href: string; external: boolean } | null {
  const m = c.municipality
  if (m) {
    if (m.externalSiteUrl) return { href: m.externalSiteUrl, external: true }
    if (m.customDomain) return { href: `https://${m.customDomain}`, external: false }
    if (m.subdomain) return { href: `https://${m.subdomain}.alleghenydems.com`, external: false }
    return { href: `/municipalities/${m.slug.current}`, external: false }
  }
  if (c.websiteUrl) return { href: c.websiteUrl, external: true }
  return null
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

function MailIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3 7 9 6 9-6" />
    </svg>
  )
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M13.5 8.5V6.8c0-.6.4-1 1-1H16V3h-2c-2.5 0-3.5 1.3-3.5 3.7v1.8H8V12h2.5v9h3V12H16l.5-3.5h-3Z" />
    </svg>
  )
}

function HouseIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 11 9-7.5L21 11" />
      <path d="M5.5 9.5V20h13V9.5" />
    </svg>
  )
}

export default function LocalCommitteeList({ committees }: { committees: LocalCommittee[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return committees
    return committees.filter((c) =>
      [c.name, c.chair].filter(Boolean).join(' ').toLowerCase().includes(q)
    )
  }, [committees, query])

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <label className="sr-only" htmlFor="local-committee-search">Search local committees</label>
          <input
            id="local-committee-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by committee or municipality name"
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
          />
        </div>
        <span className="text-sm text-[var(--color-text-muted)]">
          {filtered.length.toLocaleString()} {filtered.length === 1 ? 'committee' : 'committees'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[var(--color-text-muted)] bg-white rounded-xl border border-[var(--color-border)]">
          No committees match your search.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const link = committeeLink(c)
            const onPlatform = Boolean(c.municipality) && !c.municipality?.externalSiteUrl
            return (
              <div
                key={c._id}
                className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow p-4 flex items-start gap-3"
              >
                {c.logo?.asset ? (
                  <Image
                    src={urlFor(c.logo).width(96).height(96).url()}
                    alt=""
                    width={44}
                    height={44}
                    className="rounded-full object-cover shrink-0"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-[var(--color-navy)] text-white text-sm font-display font-bold shrink-0"
                  >
                    {initials(c.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-navy)] leading-snug">
                    {c.name}
                    {/* Team-facing marker: white-labeled sites we manage vs. committees with their own site */}
                    {onPlatform && (
                      <span
                        title="White-labeled site managed on the ACDC platform"
                        className="inline-flex ml-1.5 align-baseline text-[var(--color-text-muted)]/60"
                      >
                        <HouseIcon />
                        <span className="sr-only"> (site managed on the ACDC platform)</span>
                      </span>
                    )}
                  </p>
                  {c.chair && (
                    <p className="mt-0.5 text-sm text-[var(--color-text-muted)] truncate">Chair: {c.chair}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {link && (link.external ? (
                      <ExternalLink
                        href={link.href}
                        className="text-[var(--color-blue-mid)] hover:underline font-medium"
                        iconClassName="h-2.5 w-2.5 opacity-60"
                      >
                        Visit website
                      </ExternalLink>
                    ) : (
                      <a href={link.href} className="text-[var(--color-blue-mid)] hover:underline font-medium">
                        Visit site
                      </a>
                    ))}
                    {c.facebookUrl && (
                      <a
                        href={c.facebookUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${c.name} on Facebook`}
                        title={`${c.name} on Facebook`}
                        className="text-[var(--color-blue-mid)] hover:text-[var(--color-blue)]"
                      >
                        <FacebookIcon />
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    )}
                    {c.contactEmail && (
                      <a
                        href={`mailto:${c.contactEmail}`}
                        aria-label={`Email ${c.name}`}
                        title={`Email ${c.name}`}
                        className="text-[var(--color-blue-mid)] hover:text-[var(--color-blue)]"
                      >
                        <MailIcon />
                      </a>
                    )}
                    {!link && !c.facebookUrl && !c.contactEmail && (
                      <span className="text-xs text-[var(--color-text-muted)]">No public contact info</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
