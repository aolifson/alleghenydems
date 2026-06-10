'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { CommitteeMember } from '@/sanity/lib/queries'

const LEADERSHIP_PATTERN = /chair|president|secretary|treasurer|officer/i

function isLeader(member: CommitteeMember) {
  return (member.title && LEADERSHIP_PATTERN.test(member.title)) || member.displayOrder != null
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join('')
}

function memberSearchText(member: CommitteeMember) {
  return [member.name, member.title, member.district].filter(Boolean).join(' ').toLowerCase()
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

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm4.5 2.8A4.4 4.4 0 1 1 7.6 12 4.4 4.4 0 0 1 12 7.6Zm0 1.8a2.6 2.6 0 1 0 2.6 2.6A2.6 2.6 0 0 0 12 9.4Zm4.8-2.9a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M18.9 2H22l-7.6 8.7L23 22h-6.8l-5.3-6.9L4.8 22H1.7l8.1-9.3L1 2h7l4.8 6.3L18.9 2Zm-1.2 18h1.9L7.1 3.9H5L17.7 20Z" />
    </svg>
  )
}

function BlueskyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M12 11.6C10.9 9.4 8 5.4 5.3 3.5 2.7 1.7 1.7 2 1 2.3c-.7.3-.8 1.4-.8 2.1 0 .6.4 5.3.6 6.1.8 2.6 3.5 3.5 6 3.2-3.7.6-7 1.9-2.7 6.7 4.8 5 6.6-1.1 7.9-4.1 1.3 3 2.7 9 7.8 4.1 4.4-4.8 1.1-6.1-2.6-6.7 2.5.3 5.3-.6 6-3.2.3-.8.7-5.5.7-6.1 0-.7-.2-1.8-.9-2.1-.6-.3-1.6-.6-4.3 1.2C16 5.4 13.1 9.4 12 11.6Z" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a13.5 13.5 0 0 1 0 18 13.5 13.5 0 0 1 0-18Z" />
    </svg>
  )
}

function SocialIconLink({ href, label, children }: { href: string; label: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-blue-mid)] hover:bg-[var(--color-blue-light)] hover:border-[var(--color-blue-mid)] transition-colors"
    >
      {children}
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  )
}

function MemberAvatar({ member, size }: { member: CommitteeMember; size: number }) {
  if (member.photo?.asset) {
    return (
      <Image
        src={urlFor(member.photo).width(size * 2).height(size * 2).url()}
        alt={member.name}
        width={size}
        height={size}
        className="rounded-full object-cover shrink-0"
      />
    )
  }
  return (
    <span
      aria-hidden="true"
      className="inline-flex items-center justify-center rounded-full bg-[var(--color-navy)] text-white font-display font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size / 2.6 }}
    >
      {initials(member.name)}
    </span>
  )
}

function MemberCard({
  member,
  expanded,
  onToggle,
  large = false,
}: {
  member: CommitteeMember
  expanded: boolean
  onToggle: () => void
  large?: boolean
}) {
  const hasDetails = Boolean(member.bio || member.email || member.phone)
  return (
    <div
      className={`bg-white rounded-xl border border-[var(--color-border)] shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all flex flex-col ${large ? 'p-6' : 'p-5'}`}
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        disabled={!hasDetails}
        className="flex items-start gap-4 text-left w-full disabled:cursor-default cursor-pointer"
      >
        <MemberAvatar member={member} size={large ? 72 : 56} />
        <div className="min-w-0 flex-1">
          <p className={`font-semibold text-[var(--color-navy)] leading-snug ${large ? 'text-lg' : ''}`}>{member.name}</p>
          {member.title && (
            <span className="inline-block mt-1 text-xs font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full bg-[var(--color-blue-light)] text-[var(--color-blue-mid)]">
              {member.title}
            </span>
          )}
          {member.district && (
            <p className="mt-1 text-sm text-[var(--color-text-muted)] truncate">{member.district}</p>
          )}
        </div>
        {hasDetails && (
          <span className={`text-[var(--color-text-muted)] text-xs mt-1 transition-transform ${expanded ? 'rotate-180' : ''}`} aria-hidden="true">
            ▾
          </span>
        )}
      </button>

      {expanded && (
        <div className="mt-4 pt-4 border-t border-[var(--color-border)] text-sm space-y-2">
          {member.bio && <p className="text-[var(--color-text)] leading-relaxed">{member.bio}</p>}
          {member.email && (
            <p className="text-[var(--color-text-muted)] break-all">
              <a href={`mailto:${member.email}`} className="text-[var(--color-blue-mid)] hover:underline">{member.email}</a>
            </p>
          )}
          {member.phone && (
            <p className="text-[var(--color-text-muted)]">
              <a href={`tel:${member.phone}`} className="text-[var(--color-blue-mid)] hover:underline">{member.phone}</a>
            </p>
          )}
        </div>
      )}

      <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex items-center gap-2">
        {member.email && (
          <SocialIconLink href={`mailto:${member.email}`} label={`Email ${member.name}`}>
            <MailIcon />
          </SocialIconLink>
        )}
        {member.facebookUrl && (
          <SocialIconLink href={member.facebookUrl} label={`${member.name} on Facebook`}>
            <FacebookIcon />
          </SocialIconLink>
        )}
        {member.instagramUrl && (
          <SocialIconLink href={member.instagramUrl} label={`${member.name} on Instagram`}>
            <InstagramIcon />
          </SocialIconLink>
        )}
        {member.xUrl && (
          <SocialIconLink href={member.xUrl} label={`${member.name} on X`}>
            <XIcon />
          </SocialIconLink>
        )}
        {member.blueskyUrl && (
          <SocialIconLink href={member.blueskyUrl} label={`${member.name} on Bluesky`}>
            <BlueskyIcon />
          </SocialIconLink>
        )}
        {member.websiteUrl && (
          <SocialIconLink href={member.websiteUrl} label={`${member.name}'s website`}>
            <GlobeIcon />
          </SocialIconLink>
        )}
        {!member.email && !member.facebookUrl && !member.instagramUrl && !member.xUrl && !member.blueskyUrl && !member.websiteUrl && (
          <span className="text-xs text-[var(--color-text-muted)]">No public contact info</span>
        )}
      </div>
    </div>
  )
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
