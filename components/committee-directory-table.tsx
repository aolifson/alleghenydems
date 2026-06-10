'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import type { CommitteeDirectoryEntry } from '@/sanity/lib/queries'
import { useMunicipalityPrefix, prefixHref } from '@/lib/municipality-prefix-context'

interface CommitteeDirectoryTableProps {
  rows: CommitteeDirectoryEntry[]
}

function rowSearchText(row: CommitteeDirectoryEntry) {
  return [
    row.committee,
    row.ward,
    row.district,
    row.firstName,
    row.lastName,
    row.committeeOffice,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function isVacant(row: CommitteeDirectoryEntry) {
  return !`${row.firstName ?? ''}${row.lastName ?? ''}`.trim()
}

function seatLabel(row: CommitteeDirectoryEntry) {
  return [row.ward && `Ward ${row.ward}`, row.district && `District ${row.district}`]
    .filter(Boolean)
    .join(' · ')
}

export default function CommitteeDirectoryTable({ rows }: CommitteeDirectoryTableProps) {
  const basePath = useMunicipalityPrefix()
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) => rowSearchText(row).includes(q))
  }, [rows, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))

  useEffect(() => {
    setPage(1)
  }, [query, pageSize])

  useEffect(() => {
    if (page > totalPages) setPage(totalPages)
  }, [page, totalPages])

  const start = (page - 1) * pageSize
  const pagedRows = filtered.slice(start, start + pageSize)

  // Group the current page's rows by committee for scannable list headers.
  const groups = useMemo(() => {
    const map = new Map<string, CommitteeDirectoryEntry[]>()
    for (const row of pagedRows) {
      const key = row.committee || 'Other'
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(row)
    }
    return Array.from(map.entries())
  }, [pagedRows])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <label className="sr-only" htmlFor="committee-directory-search">Search committee seats</label>
          <input
            id="committee-directory-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search committee, ward, district, name, office"
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span>{filtered.length.toLocaleString()} seats</span>
          <label className="flex items-center gap-2">
            <span>Per page</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded-lg border border-[var(--color-border)] px-2 py-1 bg-white"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="py-10 text-center text-[var(--color-text-muted)] bg-white rounded-xl border border-[var(--color-border)]">
          No seats found.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map(([committee, committeeRows]) => (
            <section key={committee} className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
              <h3 className="px-4 py-2.5 bg-[var(--color-surface)] border-b border-[var(--color-border)] font-semibold text-sm text-[var(--color-navy)] uppercase tracking-wide">
                {committee}
              </h3>
              <ul className="divide-y divide-[var(--color-border)]">
                {committeeRows.map((row) => {
                  const vacant = isVacant(row)
                  const seat = seatLabel(row)
                  return (
                    <li key={row._id} className="px-4 py-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                      {seat && (
                        <span className="w-44 shrink-0 text-[var(--color-text-muted)]">{seat}</span>
                      )}
                      {vacant ? (
                        <Link
                          href={prefixHref('/become-a-committee-member', basePath)}
                          className="font-semibold text-[var(--color-gold)] hover:underline"
                        >
                          Seat open — become a committee member →
                        </Link>
                      ) : (
                        <span className="font-medium text-[var(--color-text)]">
                          {[row.firstName, row.lastName].filter(Boolean).join(' ')}
                        </span>
                      )}
                      {row.committeeOffice && !vacant && (
                        <span className="text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-blue-light)] text-[var(--color-blue-mid)]">
                          {row.committeeOffice}
                        </span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between text-sm text-[var(--color-text-muted)]">
        <span>
          {filtered.length === 0
            ? '0 to 0 of 0'
            : `${start + 1} to ${Math.min(start + pageSize, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-50 hover:bg-[var(--color-surface)] transition-colors"
          >
            Previous
          </button>
          <span>
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-50 hover:bg-[var(--color-surface)] transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
