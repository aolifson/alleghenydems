'use client'

import { useEffect, useMemo, useState } from 'react'
import type { CommitteeContactEntry } from '@/sanity/lib/queries'

interface CommitteeContactTableProps {
  rows: CommitteeContactEntry[]
}

function rowSearchText(row: CommitteeContactEntry) {
  return [
    row.committee,
    row.chair,
    row.websiteUrl,
    row.facebookUrl,
    row.instagramUrl,
    row.otherUrl,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

function normalizeHref(url?: string) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  return `https://${url}`
}

function HostLink({ url, label }: { url?: string; label: string }) {
  const href = normalizeHref(url)
  if (!href) return <span className="text-[var(--color-text-muted)]">-</span>
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-blue-mid)] hover:underline"
    >
      {label}
    </a>
  )
}

export default function CommitteeContactTable({ rows }: CommitteeContactTableProps) {
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <label className="sr-only" htmlFor="committee-contact-search">Search committee contact info</label>
          <input
            id="committee-contact-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search committee, chair, or social links"
            className="w-full rounded border border-[var(--color-border)] px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
          <span>{filtered.length.toLocaleString()} results</span>
          <label className="flex items-center gap-2">
            <span>Rows</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="rounded border border-[var(--color-border)] px-2 py-1"
            >
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded border border-[var(--color-border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-surface)] text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Committee</th>
              <th className="px-3 py-2 font-semibold">Chair</th>
              <th className="px-3 py-2 font-semibold">Website</th>
              <th className="px-3 py-2 font-semibold">Facebook</th>
              <th className="px-3 py-2 font-semibold">Instagram</th>
              <th className="px-3 py-2 font-semibold">Other</th>
            </tr>
          </thead>
          <tbody>
            {pagedRows.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-[var(--color-text-muted)]" colSpan={6}>
                  No rows found.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row._id} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2">{row.committee || ''}</td>
                  <td className="px-3 py-2">{row.chair || ''}</td>
                  <td className="px-3 py-2"><HostLink url={row.websiteUrl} label="Website" /></td>
                  <td className="px-3 py-2"><HostLink url={row.facebookUrl} label="Facebook" /></td>
                  <td className="px-3 py-2"><HostLink url={row.instagramUrl} label="Instagram" /></td>
                  <td className="px-3 py-2"><HostLink url={row.otherUrl} label="Open" /></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

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
            className="rounded border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-50"
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
            className="rounded border border-[var(--color-border)] px-3 py-1.5 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
