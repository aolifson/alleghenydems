import type { Metadata } from 'next'
import PageHero from '@/components/page-hero'
import {
  getLegislativeTrackerBySlug,
  type LegislativeAction,
  type LegislativeExternalLink,
  type LegislativeLocalEntry,
  type LegislativeOfficialRow,
} from '@/sanity/lib/queries'

export const metadata: Metadata = {
  title: 'Legislative Tracker — What They Did & What They Blocked',
  description: 'Track what Democrats accomplished and what Republicans blocked for working families in Allegheny County.',
}

const DEFAULT_DISTRICT_LOOKUP_INTRO =
  'Not sure who represents you? Use these official tools to look up your state and county districts by address:'

const DEFAULT_OFFICIAL_TABLE_INTRO =
  'Below is a quick reference for which Republican state legislators represent parts of Allegheny County. If your borough or township appears here, that Republican is one of your state-level representatives.'

const DEFAULT_ABOUT_TITLE = 'About this page'
const DEFAULT_ABOUT_BODY =
  'Every item on this page links to a public source — news articles, official press releases, legislative records, or nonpartisan reporting — so you can verify the facts yourself. We are committed to accuracy.'
const DEFAULT_LAST_UPDATED_NOTE =
  'Last updated: February 2026. Sources include official congressional and state legislative records, WESA, Spotlight PA, Keystone Newsroom, The Trace, Chalkbeat, City & State PA, and the PA Health Law Project.'

function sortByOrder<T extends { displayOrder?: number }>(items: T[] | undefined): T[] {
  return [...(items ?? [])].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
}

function uniqueCategories(actions: LegislativeAction[], configured: string[] | undefined) {
  const fromData = Array.from(new Set(actions.map((a) => a.category).filter(Boolean)))
  if (!configured || configured.length === 0) {
    return fromData.sort((a, b) => a.localeCompare(b))
  }
  const configuredSet = new Set(configured)
  const extras = fromData.filter((category) => !configuredSet.has(category)).sort((a, b) => a.localeCompare(b))
  return [...configured, ...extras]
}

function badgeColor(type: LegislativeAction['type']) {
  switch (type) {
    case 'accomplishment':
      return 'bg-green-100 text-green-800 border-green-300'
    case 'blocked':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'harmful':
      return 'bg-red-200 text-red-900 border-red-400'
  }
}

function badgeLabel(type: LegislativeAction['type']) {
  switch (type) {
    case 'accomplishment':
      return 'Delivered'
    case 'blocked':
      return 'Blocked by GOP'
    case 'harmful':
      return 'Harmful'
  }
}

export default async function LegislativeTrackerPage() {
  const tracker = await getLegislativeTrackerBySlug('legislative-tracker')

  if (!tracker) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-bold text-[var(--color-blue)] mb-2">Legislative Tracker</h1>
        <p className="text-[var(--color-text-muted)]">
          The legislative tracker has not been imported into Sanity yet.
        </p>
      </main>
    )
  }

  const actions = sortByOrder(tracker.actions)
  const localEntries = sortByOrder(tracker.localEntries)
  const links = sortByOrder(tracker.districtLookupLinks)
  const republicanOfficials = sortByOrder(tracker.republicanOfficials)

  const accomplishments = actions.filter((a) => a.type === 'accomplishment')
  const blockedOrHarmful = actions.filter((a) => a.type !== 'accomplishment')
  const categories = uniqueCategories(actions, tracker.categories)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <PageHero
        headline={tracker.heroHeadline ?? tracker.title}
        subhead={tracker.heroSubhead}
        image={tracker.heroImage}
      />

      <nav className="flex flex-wrap gap-2 mb-10">
        <a
          href="#accomplishments"
          className="px-4 py-2 text-sm font-semibold rounded bg-green-100 text-green-800 hover:bg-green-200 transition-colors"
        >
          Democratic Accomplishments ({accomplishments.length})
        </a>
        <a
          href="#blocked"
          className="px-4 py-2 text-sm font-semibold rounded bg-red-100 text-red-800 hover:bg-red-200 transition-colors"
        >
          Blocked or Harmful ({blockedOrHarmful.length})
        </a>
        <a
          href="#hyperlocal"
          className="px-4 py-2 text-sm font-semibold rounded bg-yellow-100 text-yellow-800 hover:bg-yellow-200 transition-colors"
        >
          Your Borough, Your Story ({localEntries.length})
        </a>
        <a
          href="#find-your-district"
          className="px-4 py-2 text-sm font-semibold rounded bg-[var(--color-blue-light)] text-[var(--color-blue)] hover:opacity-80 transition-colors"
        >
          Find Your District
        </a>
      </nav>

      <section id="accomplishments" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-green-800 border-b-2 border-green-300 pb-2 mb-6">
          What Democrats Delivered
        </h2>

        {categories.map((category) => {
          const items = accomplishments.filter((action) => action.category === category)
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
      </section>

      <section id="blocked" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-red-800 border-b-2 border-red-300 pb-2 mb-6">
          What Republicans Blocked or Pushed Through Against Working Families
        </h2>

        {categories.map((category) => {
          const items = blockedOrHarmful.filter((action) => action.category === category)
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
      </section>

      <section id="hyperlocal" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-yellow-800 border-b-2 border-yellow-300 pb-2 mb-2">
          Your Borough, Your Story
        </h2>
        <p className="text-sm text-[var(--color-text-muted)] mb-6">
          How state and federal policy decisions have played out in specific Allegheny County communities — the things
          that affect your street, your school, your water.
        </p>
        <div className="space-y-4">
          {localEntries.map((entry) => (
            <LocalCard key={entry._key ?? `${entry.community}-${entry.sourceUrl}`} entry={entry} />
          ))}
        </div>
      </section>

      <section id="find-your-district" className="mb-16">
        <h2 className="text-2xl font-display font-bold text-[var(--color-blue)] border-b-2 border-[var(--color-blue-light)] pb-2 mb-6">
          Find Your District &amp; Representatives
        </h2>
        <p className="text-[var(--color-text)] mb-6">
          {tracker.districtLookupIntro ?? DEFAULT_DISTRICT_LOOKUP_INTRO}
        </p>
        <div className="grid sm:grid-cols-2 gap-4 mb-8">
          {links.map((link) => (
            <ExternalLink
              key={link._key ?? link.url}
              href={link.url}
              label={link.label}
              description={link.description ?? ''}
            />
          ))}
        </div>

        <h3 className="text-lg font-bold text-[var(--color-blue)] mb-3">Who Represents My Municipality?</h3>
        <p className="text-sm text-[var(--color-text-muted)] mb-4">
          {tracker.officialTableIntro ?? DEFAULT_OFFICIAL_TABLE_INTRO}
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-200 rounded">
            <thead className="bg-red-50">
              <tr>
                <th className="text-left px-4 py-2 font-semibold text-red-800">Republican Official</th>
                <th className="text-left px-4 py-2 font-semibold text-red-800">Office</th>
                <th className="text-left px-4 py-2 font-semibold text-red-800">Allegheny County Municipalities</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {republicanOfficials.map((row) => (
                <tr key={row._key ?? `${row.official}-${row.office}`}>
                  <td className="px-4 py-2 font-medium">{row.official}</td>
                  <td className="px-4 py-2">{row.office}</td>
                  <td className="px-4 py-2">{row.municipalities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-[var(--color-blue-light)] rounded-lg p-6 text-sm text-[var(--color-text)]">
        <p className="font-semibold mb-2">{tracker.aboutTitle ?? DEFAULT_ABOUT_TITLE}</p>
        <p className="whitespace-pre-line">
          {tracker.aboutBody ?? DEFAULT_ABOUT_BODY}{' '}
          <a href="/contact" className="text-[var(--color-blue)] underline hover:no-underline">Contact us</a>.
        </p>
        <p className="mt-2 text-[var(--color-text-muted)] whitespace-pre-line">
          {tracker.lastUpdatedNote ?? DEFAULT_LAST_UPDATED_NOTE}
        </p>
      </section>
    </div>
  )
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
            Municipalities affected
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

function ExternalLink({ href, label, description }: { href: string; label: string; description: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-4 border border-gray-200 rounded-lg hover:shadow-md hover:border-[var(--color-blue)] transition-all bg-white"
    >
      <p className="font-semibold text-[var(--color-blue)] text-sm mb-1">{label} ↗</p>
      <p className="text-xs text-[var(--color-text-muted)]">{description}</p>
    </a>
  )
}
