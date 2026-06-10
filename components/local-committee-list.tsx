'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { MunicipalityListItem } from '@/sanity/lib/queries'
import ExternalLink from '@/components/external-link'

// White-labeled committees link to their site on our platform; committees
// with externalSiteUrl set in Sanity link out with the ↗ treatment.
function committeeLink(m: MunicipalityListItem): { href: string; external: boolean } {
  if (m.externalSiteUrl) return { href: m.externalSiteUrl, external: true }
  if (m.customDomain) return { href: `https://${m.customDomain}`, external: false }
  if (m.subdomain) return { href: `https://${m.subdomain}.alleghenydems.com`, external: false }
  return { href: `/municipalities/${m.slug.current}`, external: false }
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

export default function LocalCommitteeList({ committees }: { committees: MunicipalityListItem[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return committees
    return committees.filter((m) => m.name.toLowerCase().includes(q))
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
          {filtered.map((m) => {
            const link = committeeLink(m)
            return (
              <div
                key={m._id}
                className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow p-4 flex items-start gap-3"
              >
                {m.logo?.asset ? (
                  <Image
                    src={urlFor(m.logo).width(96).height(96).url()}
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
                    {initials(m.name)}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-[var(--color-navy)] leading-snug">
                    {m.name}
                    {/* Team-facing marker: white-labeled sites we manage vs. committees with their own site */}
                    {!link.external && (
                      <span
                        title="White-labeled site managed on the ACDC platform"
                        className="inline-flex ml-1.5 align-baseline text-[var(--color-text-muted)]/60"
                      >
                        <HouseIcon />
                        <span className="sr-only"> (site managed on the ACDC platform)</span>
                      </span>
                    )}
                  </p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                    {link.external ? (
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
                    )}
                    {m.facebookPageUrl && (
                      <a
                        href={m.facebookPageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${m.name} on Facebook`}
                        title={`${m.name} on Facebook`}
                        className="text-[var(--color-blue-mid)] hover:text-[var(--color-blue)]"
                      >
                        <FacebookIcon />
                        <span className="sr-only"> (opens in new tab)</span>
                      </a>
                    )}
                    {m.contactEmail && (
                      <a
                        href={`mailto:${m.contactEmail}`}
                        aria-label={`Email ${m.name}`}
                        title={`Email ${m.name}`}
                        className="text-[var(--color-blue-mid)] hover:text-[var(--color-blue)]"
                      >
                        <MailIcon />
                      </a>
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
