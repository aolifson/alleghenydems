'use client'

import { useMemo, useState } from 'react'
import type { CommitteeMember } from '@/sanity/lib/queries'

function rowSearchText(member: CommitteeMember) {
  return [member.name, member.title, member.district, member.email, member.phone]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function MemberRoster({ members }: { members: CommitteeMember[] }) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return members
    return members.filter((member) => rowSearchText(member).includes(q))
  }, [members, query])

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 max-w-md">
          <label className="sr-only" htmlFor="member-roster-search">Search the roster</label>
          <input
            id="member-roster-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, ward, role, email, or phone"
            className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
          />
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-[var(--color-text-muted)]">
            {filtered.length.toLocaleString()} {filtered.length === 1 ? 'member' : 'members'}
          </span>
          <a
            href="/api/members/roster"
            className="px-4 py-2 bg-[var(--color-blue)] hover:opacity-90 text-white font-semibold rounded-lg transition-opacity"
          >
            Download CSV
          </a>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[var(--color-border)] bg-white">
        <table className="min-w-full text-sm">
          <thead className="bg-[var(--color-surface)] text-left">
            <tr>
              <th className="px-3 py-2 font-semibold">Name</th>
              <th className="px-3 py-2 font-semibold">Role</th>
              <th className="px-3 py-2 font-semibold">Ward / Municipality</th>
              <th className="px-3 py-2 font-semibold">Email</th>
              <th className="px-3 py-2 font-semibold">Phone</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td className="px-3 py-6 text-center text-[var(--color-text-muted)]" colSpan={5}>
                  No members found.
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member._id} className="border-t border-[var(--color-border)]">
                  <td className="px-3 py-2 font-medium">{member.name}</td>
                  <td className="px-3 py-2">{member.title || ''}</td>
                  <td className="px-3 py-2">{member.district || ''}</td>
                  <td className="px-3 py-2">
                    {member.email ? (
                      <a href={`mailto:${member.email}`} className="text-[var(--color-blue-mid)] hover:underline">{member.email}</a>
                    ) : ''}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {member.phone ? (
                      <a href={`tel:${member.phone}`} className="text-[var(--color-blue-mid)] hover:underline">{member.phone}</a>
                    ) : ''}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
