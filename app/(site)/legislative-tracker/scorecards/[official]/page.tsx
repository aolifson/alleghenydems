import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getLegislativeTrackerBySlug, type LegislativeAction } from '@/sanity/lib/queries'
import { getMunicipalityPrefix } from '@/lib/tenant'
import { prefixHref } from '@/lib/prefix-href'
import { buildScorecards, findScorecard } from '@/lib/scorecards'
import ScorecardShare from '@/components/scorecard-share'

export const revalidate = 3600

type Props = { params: Promise<{ official: string }> }

export async function generateStaticParams() {
  const tracker = await getLegislativeTrackerBySlug('legislative-tracker')
  return buildScorecards(tracker?.actions).map((c) => ({ official: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { official } = await params
  const tracker = await getLegislativeTrackerBySlug('legislative-tracker')
  const card = findScorecard(tracker?.actions, official)
  if (!card) return {}
  const summary =
    card.party === 'D'
      ? `${card.delivered} thing${card.delivered === 1 ? '' : 's'} delivered for Allegheny County working families.`
      : `Record: ${card.blocked} blocked, ${card.harmful} harmful to working families.`
  return {
    title: `${card.name} — Scorecard`,
    description: `${card.office}. ${summary}`,
  }
}

function badge(type: LegislativeAction['type']) {
  switch (type) {
    case 'accomplishment':
      return { cls: 'bg-green-100 text-green-800 border-green-300', label: 'Delivered' }
    case 'blocked':
      return { cls: 'bg-red-100 text-red-800 border-red-300', label: 'Blocked by GOP' }
    case 'harmful':
      return { cls: 'bg-red-200 text-red-900 border-red-400', label: 'Harmful' }
    default:
      return { cls: 'bg-gray-100 text-gray-700 border-gray-300', label: '' }
  }
}

function RecordCard({ item }: { item: LegislativeAction }) {
  const b = badge(item.type)
  return (
    <article className="border border-gray-200 rounded-lg p-4 bg-white">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${b.cls}`}>{b.label}</span>
        <span className="text-xs text-[var(--color-text-muted)]">{item.date}</span>
        {item.billId && <span className="text-xs font-medium text-[var(--color-blue)]">{item.billId}</span>}
      </div>
      <p className="text-sm text-[var(--color-text)] mb-3 whitespace-pre-line">{item.description}</p>
      {item.sourceUrl && (
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-[var(--color-blue)] hover:underline"
        >
          Source: {item.sourceLabel} ↗
        </a>
      )}
    </article>
  )
}

function Stat({ n, label, tone }: { n: number; label: string; tone: 'green' | 'red' | 'rose' }) {
  const styles = {
    green: 'text-green-800',
    red: 'text-red-800',
    rose: 'text-red-900',
  }[tone]
  return (
    <div className="text-center">
      <div className={`text-4xl font-bold ${styles}`}>{n}</div>
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</div>
    </div>
  )
}

export default async function ScorecardDetailPage({ params }: Props) {
  const { official } = await params
  const [tracker, basePath] = await Promise.all([
    getLegislativeTrackerBySlug('legislative-tracker'),
    getMunicipalityPrefix(),
  ])
  const card = findScorecard(tracker?.actions, official)
  if (!card) notFound()

  const isDem = card.party === 'D'
  const shareText = isDem
    ? `${card.name} delivered ${card.delivered} win${card.delivered === 1 ? '' : 's'} for Allegheny County. See the record:`
    : `${card.name}'s record: ${card.blocked} blocked, ${card.harmful} harmful to working families. See for yourself:`

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <p className="mb-6">
        <Link
          href={prefixHref('/legislative-tracker/scorecards', basePath)}
          className="text-sm font-medium text-[var(--color-blue)] hover:underline"
        >
          ← All scorecards
        </Link>
      </p>

      {/* Header */}
      <header className={`rounded-lg p-6 mb-8 border-l-4 ${isDem ? 'border-l-[var(--color-blue)] bg-[var(--color-blue-light)]' : 'border-l-red-600 bg-red-50'}`}>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <h1 className="font-display text-3xl font-bold text-[var(--color-text)]">{card.name}</h1>
          <span className={`text-sm font-bold px-2 py-0.5 rounded ${isDem ? 'bg-white text-[var(--color-blue)]' : 'bg-white text-red-800'}`}>
            {isDem ? 'Democrat' : 'Republican'}
          </span>
        </div>
        <p className="text-sm text-[var(--color-text-muted)] mb-5">{card.office}</p>
        <div className="flex gap-8">
          {card.delivered > 0 && <Stat n={card.delivered} label="Delivered" tone="green" />}
          {card.blocked > 0 && <Stat n={card.blocked} label="Blocked" tone="red" />}
          {card.harmful > 0 && <Stat n={card.harmful} label="Harmful" tone="rose" />}
        </div>
      </header>

      {/* Share */}
      <ScorecardShare shareText={shareText} className="mb-8" />

      {/* Record by category */}
      {card.categories.map((category) => {
        const items = card.actions.filter((a) => a.category === category)
        if (!items.length) return null
        return (
          <section key={category} className="mb-8">
            <h2 className="text-lg font-bold text-[var(--color-blue)] border-b border-gray-200 pb-1 mb-3">{category}</h2>
            <div className="space-y-3">
              {items.map((item) => (
                <RecordCard key={item._key ?? `${item.date}-${item.sourceUrl}`} item={item} />
              ))}
            </div>
          </section>
        )
      })}

      {/* GOTV CTA */}
      <section className="mt-12 rounded-lg bg-[var(--color-navy)] text-white p-6">
        <h2 className="font-display text-xl font-bold mb-2">
          {isDem ? 'Records like this are on the ballot.' : 'You can hold them accountable in November.'}
        </h2>
        <p className="text-sm text-white/85 mb-4">
          {isDem
            ? 'Re-elect the people delivering for working families. Make your plan to vote now.'
            : 'This record is on the ballot this November. The most powerful response is your vote.'}
        </p>
        <div className="flex flex-wrap gap-3">
          <Link
            href={prefixHref('/plan-to-vote', basePath)}
            className="inline-block bg-white text-[var(--color-navy)] font-semibold text-sm px-4 py-2 rounded hover:bg-white/90 transition-colors"
          >
            Make your plan to vote →
          </Link>
          <Link
            href={prefixHref('/vote', basePath)}
            className="inline-block border border-white/60 text-white font-semibold text-sm px-4 py-2 rounded hover:bg-white/10 transition-colors"
          >
            Check your registration
          </Link>
        </div>
      </section>
    </div>
  )
}
