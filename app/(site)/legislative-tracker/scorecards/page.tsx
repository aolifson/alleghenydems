import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/page-hero'
import { getLegislativeTrackerBySlug } from '@/sanity/lib/queries'
import { getMunicipalityPrefix } from '@/lib/tenant'
import { prefixHref } from '@/lib/prefix-href'
import { buildScorecards, type OfficialScorecard } from '@/lib/scorecards'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Official Scorecards — Their Records at a Glance',
  description:
    'See what each of your representatives delivered, blocked, or pushed through — a per-official record for Allegheny County.',
}

function StatPill({ n, label, tone }: { n: number; label: string; tone: 'green' | 'red' | 'rose' }) {
  const styles = {
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    rose: 'bg-red-200 text-red-900',
  }[tone]
  if (!n) return null
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded ${styles}`}>
      {n} {label}
    </span>
  )
}

function ScorecardTile({ card, basePath }: { card: OfficialScorecard; basePath: string }) {
  const isDem = card.party === 'D'
  const accent = isDem ? 'border-l-[var(--color-blue)]' : 'border-l-red-600'
  // Headline the record, not the party: if an official (of either party) has more
  // blocked/harmful votes than wins, lead with that instead of burying it.
  const negatives = card.blocked + card.harmful
  const leadNegative = negatives > card.delivered
  const headline = leadNegative ? negatives : card.delivered
  const headlineLabel = leadNegative ? 'blocked / harmful' : 'delivered'
  return (
    <Link
      href={prefixHref(`/legislative-tracker/scorecards/${card.slug}`, basePath)}
      className={`block bg-white border border-gray-200 border-l-4 ${accent} rounded-lg p-5 hover:shadow-md transition-shadow`}
    >
      <div className="flex items-baseline justify-between gap-3 mb-1">
        <p className="font-display font-bold text-lg text-[var(--color-text)]">{card.name}</p>
        <span
          className={`text-xs font-bold px-2 py-0.5 rounded ${
            isDem ? 'bg-[var(--color-blue-light)] text-[var(--color-blue)]' : 'bg-red-100 text-red-800'
          }`}
        >
          {card.party}
        </span>
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mb-3">{card.office}</p>
      <div className="flex items-end gap-2 mb-3">
        <span className="text-3xl font-bold text-[var(--color-text)] leading-none">{headline}</span>
        <span className="text-xs text-[var(--color-text-muted)] mb-0.5">{headlineLabel}</span>
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        <StatPill n={card.delivered} label="delivered" tone="green" />
        <StatPill n={card.blocked} label="blocked" tone="red" />
        <StatPill n={card.harmful} label="harmful" tone="rose" />
      </div>
      <p className="text-xs font-medium text-[var(--color-blue)]">View full record →</p>
    </Link>
  )
}

export default async function ScorecardsIndexPage() {
  const [tracker, basePath] = await Promise.all([
    getLegislativeTrackerBySlug('legislative-tracker'),
    getMunicipalityPrefix(),
  ])

  const cards = buildScorecards(tracker?.actions)
  const democrats = cards.filter((c) => c.party === 'D')
  const republicans = cards.filter((c) => c.party === 'R')

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <PageHero
        headline="Official Scorecards"
        subhead="Every representative's record in one place — what they delivered for working families, and what they blocked or pushed through against them. Every item links to a public source."
      />

      <p className="mb-8">
        <Link
          href={prefixHref('/legislative-tracker', basePath)}
          className="text-sm font-medium text-[var(--color-blue)] hover:underline"
        >
          ← Back to the full Legislative Tracker
        </Link>
      </p>

      {cards.length === 0 && (
        <p className="text-[var(--color-text-muted)]">No scorecards yet — add records to the Legislative Tracker.</p>
      )}

      {democrats.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-green-800 border-b-2 border-green-300 pb-2 mb-6">
            What Democrats Delivered
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {democrats.map((card) => (
              <ScorecardTile key={card.slug} card={card} basePath={basePath} />
            ))}
          </div>
        </section>
      )}

      {republicans.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-display font-bold text-red-800 border-b-2 border-red-300 pb-2 mb-6">
            What Republicans Blocked or Pushed Through
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {republicans.map((card) => (
              <ScorecardTile key={card.slug} card={card} basePath={basePath} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
