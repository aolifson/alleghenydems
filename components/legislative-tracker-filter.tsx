'use client'

import { useMemo, useState } from 'react'
import type { LegislativeAction, LegislativeLocalEntry } from '@/sanity/lib/queries'

interface Props {
  accomplishments: LegislativeAction[]
  blockedOrHarmful: LegislativeAction[]
  localEntries: LegislativeLocalEntry[]
  categories: string[]
  initialQuery?: string
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, ' ').trim()
}

function matchesQuery(query: string, values: string[]): boolean {
  const q = normalize(query)
  if (!q) return true
  return values.some((v) => normalize(v).includes(q))
}

function badgeColor(type: LegislativeAction['type']) {
  switch (type) {
    case 'accomplishment': return 'bg-green-100 text-green-800 border-green-300'
    case 'blocked': return 'bg-red-100 text-red-800 border-red-300'
    case 'harmful': return 'bg-red-200 text-red-900 border-red-400'
  }
}

function badgeLabel(type: LegislativeAction['type']) {
  switch (type) {
    case 'accomplishment': return 'Delivered'
    case 'blocked': return 'Blocked by GOP'
    case 'harmful': return 'Harmful'
  }
}

function ActionCard({ item }: { item: LegislativeAction }) {
  return (
    <article className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${badgeColor(item.type)}`}>
          {badgeLabel(item.type)}
        </span>
        <span className="text-xs text-[var(--color-text-muted)]">{item.date}</span>
        <span className="text-xs font-medium text-[var(--color-blue)]">{item.category}</span>
      </div>
      <p className="font-semibold text-[var(--color-text)] mb-1">{item.official}</p>
      <p className="text-xs text-[var(--color-text-muted)] mb-2">{item.office}</p>
      <p className="text-sm text-[var(--color-text)] mb-3">{item.description}</p>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--color-blue)] hover:underline"
        >
          Source: {item.sourceLabel} ↗
        </a>
      </div>
      {item.municipalities && item.municipalities.length > 0 && (
        <details className="mt-2">
          <summary className="text-xs text-[var(--color-text-muted)] cursor-pointer hover:text-[var(--color-blue)]">
            Communities affected
          </summary>
          <p className="text-xs text-[var(--color-text-muted)] mt-1 pl-2 border-l-2 border-gray-200">
            {item.municipalities.join(' · ')}
          </p>
        </details>
      )}
    </article>
  )
}

function LocalCard({ entry }: { entry: LegislativeLocalEntry }) {
  const outcomeStyles = {
    helped: { badge: 'bg-green-100 text-green-800 border-green-300', label: 'Helped community', bar: 'bg-green-500' },
    hurt: { badge: 'bg-red-100 text-red-800 border-red-300', label: 'Hurt community', bar: 'bg-red-500' },
    ongoing: { badge: 'bg-yellow-100 text-yellow-800 border-yellow-300', label: 'Ongoing issue', bar: 'bg-yellow-400' },
  }
  const style = outcomeStyles[entry.outcome]
  return (
    <article className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
      <div className={`h-1 ${style.bar}`} />
      <div className="p-4">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span className="font-bold text-sm text-[var(--color-blue)]">{entry.community}</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${style.badge}`}>{style.label}</span>
          <span className="text-xs text-[var(--color-text-muted)]">{entry.date}</span>
        </div>
        <p className="font-semibold text-sm text-[var(--color-text)] mb-2">{entry.summary}</p>
        <p className="text-sm text-[var(--color-text)] mb-3">{entry.detail}</p>
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--color-blue)] hover:underline"
        >
          Source: {entry.sourceLabel} ↗
        </a>
      </div>
    </article>
  )
}

export default function LegislativeTrackerFilter({
  accomplishments,
  blockedOrHarmful,
  localEntries,
  categories,
  initialQuery = '',
}: Props) {
  const [query, setQuery] = useState(initialQuery)
  const hasQuery = query.trim().length > 0

  const filteredAccomplishments = useMemo(() => {
    if (!hasQuery) return accomplishments
    return accomplishments.filter((a) => matchesQuery(query, a.municipalities ?? []))
  }, [accomplishments, query, hasQuery])

  const filteredBlockedOrHarmful = useMemo(() => {
    if (!hasQuery) return blockedOrHarmful
    return blockedOrHarmful.filter((a) => matchesQuery(query, a.municipalities ?? []))
  }, [blockedOrHarmful, query, hasQuery])

  const filteredLocalEntries = useMemo(() => {
    if (!hasQuery) return localEntries
    return localEntries.filter((e) => matchesQuery(query, [e.community]))
  }, [localEntries, query, hasQuery])

  const totalFiltered = filteredAccomplishments.length + filteredBlockedOrHarmful.length + filteredLocalEntries.length
  const noResults = hasQuery && totalFiltered === 0

  return (
    <div>
      {/* Search bar */}
      <div className="mb-8 bg-[var(--color-blue-light)] rounded-lg p-4 md:p-5">
        <p className="text-sm font-semibold text-[var(--color-navy)] mb-2">
          Filter by community or borough
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Fox Chapel, Mt Lebanon, Squirrel Hill…"
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-mid)]"
            aria-label="Filter by community"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-navy)] hover:bg-white whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
        {hasQuery && !noResults && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            Showing {totalFiltered} {totalFiltered === 1 ? 'entry' : 'entries'} matching &ldquo;{query.trim()}&rdquo;
          </p>
        )}
        {noResults && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            No entries tagged for &ldquo;{query.trim()}&rdquo; — showing all results below.
          </p>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-wrap gap-2 mb-10">
        <a
          href="#accomplishments"
          className="px-4 py-2 text-sm font-semibold rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
        >
          Democratic Accomplishments ({noResults ? accomplishments.length : filteredAccomplishments.length})
        </a>
        <a
          href="#blocked"
          className="px-4 py-2 text-sm font-semibold rounded bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
        >
          Blocked or Harmful ({noResults ? blockedOrHarmful.length : filteredBlockedOrHarmful.length})
        </a>
        <a
          href="#hyperlocal"
          className="px-4 py-2 text-sm font-semibold rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
        >
          Your Borough, Your Story ({noResults ? localEntries.length : filteredLocalEntries.length})
        </a>
        <a
          href="#find-your-district"
          className="px-4 py-2 text-sm font-semibold rounded bg-[var(--color-blue-light)] text-[var(--color-blue)] hover:opacity-80 transition-colors"
        >
          Find Your District
        </a>
      </nav>

      {/* Accomplishments */}
      <section id="accomplishments" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-green-800 border-b-2 border-green-300 pb-2 mb-6">
          What Democrats Delivered
        </h2>
        {categories.map((category) => {
          const items = (noResults ? accomplishments : filteredAccomplishments).filter(
            (a) => a.category === category
          )
          if (!items.length) return null
          return (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-bold text-[var(--color-blue)] mb-3">{category}</h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <ActionCard key={item._key ?? `${item.official}-${item.sourceUrl}`} item={item} />
                ))}
              </div>
            </div>
          )
        })}
        {!noResults && filteredAccomplishments.length === 0 && hasQuery && (
          <p className="text-sm text-[var(--color-text-muted)] italic">
            No accomplishments tagged for &ldquo;{query.trim()}&rdquo;.
          </p>
        )}
      </section>

      {/* Blocked or Harmful */}
      <section id="blocked" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-red-800 border-b-2 border-red-300 pb-2 mb-6">
          What Republicans Blocked or Pushed Through Against Working Families
        </h2>
        {categories.map((category) => {
          const items = (noResults ? blockedOrHarmful : filteredBlockedOrHarmful).filter(
            (a) => a.category === category
          )
          if (!items.length) return null
          return (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-bold text-red-700 mb-3">{category}</h3>
              <div className="space-y-4">
                {items.map((item) => (
                  <ActionCard key={item._key ?? `${item.official}-${item.sourceUrl}`} item={item} />
                ))}
              </div>
            </div>
          )
        })}
        {!noResults && filteredBlockedOrHarmful.length === 0 && hasQuery && (
          <p className="text-sm text-[var(--color-text-muted)] italic">
            No blocked/harmful entries tagged for &ldquo;{query.trim()}&rdquo;.
          </p>
        )}
      </section>

      {/* Hyper-local */}
      <section id="hyperlocal" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-yellow-800 border-b-2 border-yellow-300 pb-2 mb-2">
          Your Borough, Your Story
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          How state and federal policy decisions have played out in specific Allegheny County communities — the things
          that affect your street, your school, your water.
        </p>
        <div className="space-y-4">
          {(noResults ? localEntries : filteredLocalEntries).map((entry) => (
            <LocalCard key={entry._key ?? `${entry.community}-${entry.sourceUrl}`} entry={entry} />
          ))}
        </div>
        {!noResults && filteredLocalEntries.length === 0 && hasQuery && (
          <p className="text-sm text-[var(--color-text-muted)] italic">
            No local stories tagged for &ldquo;{query.trim()}&rdquo;.
          </p>
        )}
      </section>
    </div>
  )
}
