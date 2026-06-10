'use client'

import { useMemo, useState } from 'react'
import type { CommitteeContactEntry } from '@/sanity/lib/queries'
import ExternalLink from '@/components/external-link'

interface CommitteeContactTableProps {
  rows: CommitteeContactEntry[]
}

function rowSearchText(row: CommitteeContactEntry) {
  return [row.committee, row.chair].filter(Boolean).join(' ').toLowerCase()
}

function normalizeHref(url?: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

export default function CommitteeContactTable({ rows }: CommitteeContactTableProps) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => rowSearchText(row).includes(q))
  }, [rows, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <label className="sr-only" htmlFor="committee-contact-search">Search local committees</label>
          <input
            id="committee-contact-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by committee or chair"
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
          />
        </div>
        <span className="text-sm text-[var(--color-text-muted)]">
          {filtered.length.toLocaleString()} {filtered.length === 1 ? 'committee' : 'committees'}
        </span>
      </div>

      {filtered.length === 0 ? (
        <p className="py-10 text-center text-[var(--color-text-muted)] bg-white rounded-xl border border-[var(--color-border)]">
          No committees found.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((row) => {
            const links = [
              { label: 'Website', url: row.websiteUrl },
              { label: 'Facebook', url: row.facebookUrl },
              { label: 'Instagram', url: row.instagramUrl },
              { label: 'More', url: row.otherUrl },
            ].filter((link) => link.url)
            return (
              <div
                key={row._id}
                className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md transition-shadow p-4 flex flex-col gap-1.5"
              >
                <p className="font-semibold text-[var(--color-navy)] leading-snug">{row.committee}</p>
                {row.chair && (
                  <p className="text-sm text-[var(--color-text-muted)]">Chair: {row.chair}</p>
                )}
                {links.length > 0 && (
                  <div className="mt-auto pt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    {links.map(({ label, url }) => (
                      <ExternalLink
                        key={label}
                        href={normalizeHref(url)}
                        className="text-[var(--color-blue-mid)] hover:underline"
                        iconClassName="h-2.5 w-2.5 opacity-60"
                      >
                        {label}
                      </ExternalLink>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
