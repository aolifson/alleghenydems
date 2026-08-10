'use client'

import { useEffect, useMemo, useState } from 'react'
import MemberCard from './member-card'
import type { CommitteeMember } from '@/sanity/lib/queries'

const LEADERSHIP_PATTERN = /chair|president|secretary|treasurer|officer/i

function isLeader(member: CommitteeMember) {
  return (member.title && LEADERSHIP_PATTERN.test(member.title)) || member.displayOrder != null
}

function memberSearchText(member: CommitteeMember) {
  return [member.name, member.title, member.district].filter(Boolean).join(' ').toLowerCase()
}

export default function MemberDirectory({ members }: { members: CommitteeMember[] }) {
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [district, setDistrict] = useState('')
  const [role, setRole] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 200)
    return () => clearTimeout(timer)
  }, [query])

  const districts = useMemo(
    () => Array.from(new Set(members.map((m) => m.district).filter((d): d is string => Boolean(d)))).sort(),
    [members]
  )
  const roles = useMemo(
    () => Array.from(new Set(members.map((m) => m.title).filter((t): t is string => Boolean(t)))).sort(),
    [members]
  )

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    return members.filter((member) => {
      if (q && !memberSearchText(member).includes(q)) return false
      if (district && member.district !== district) return false
      if (role && member.title !== role) return false
      return true
    })
  }, [members, debouncedQuery, district, role])

  const leaders = filtered.filter(isLeader)
  const rest = filtered.filter((m) => !isLeader(m))

  return (
    <div>
      {/* Sticky filter bar — sits just below the sticky site nav (h-16) */}
      <div className="sticky top-16 z-30 -mx-4 px-4 py-3 bg-white/95 backdrop-blur border-b border-[var(--color-border)]">
        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex-1 max-w-md">
            <label className="sr-only" htmlFor="member-directory-search">Search committee members</label>
            <input
              id="member-directory-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, ward, municipality, or role"
              className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <label className="sr-only" htmlFor="member-directory-district">Filter by ward or municipality</label>
            <select
              id="member-directory-district"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm bg-white"
            >
              <option value="">All wards & municipalities</option>
              {districts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="member-directory-role">Filter by role</label>
            <select
              id="member-directory-role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="rounded-lg border border-[var(--color-border)] px-2 py-2 text-sm bg-white"
            >
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <span className="text-sm text-[var(--color-text-muted)] whitespace-nowrap" aria-live="polite">
              {filtered.length.toLocaleString()} {filtered.length === 1 ? 'member' : 'members'}
            </span>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-[var(--color-text-muted)]">
          No members match your search. Try clearing a filter.
        </p>
      ) : (
        <div className="py-8 space-y-10">
          {leaders.length > 0 && (
            <section>
              <h2 className="font-display text-xl font-bold text-[var(--color-blue)] mb-4">Leadership</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaders.map((member) => (
                  <MemberCard
                    key={member._id}
                    member={member}
                    large
                    expanded={expandedId === member._id}
                    onToggle={() => setExpandedId(expandedId === member._id ? null : member._id)}
                  />
                ))}
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section>
              {leaders.length > 0 && (
                <h2 className="font-display text-xl font-bold text-[var(--color-blue)] mb-4">Committee Members</h2>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {rest.map((member) => (
                  <MemberCard
                    key={member._id}
                    member={member}
                    expanded={expandedId === member._id}
                    onToggle={() => setExpandedId(expandedId === member._id ? null : member._id)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
