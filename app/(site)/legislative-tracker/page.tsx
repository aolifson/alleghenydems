import type { Metadata } from 'next'
import PageHero from '@/components/page-hero'
import LegislativeTrackerFilter from '@/components/legislative-tracker-filter'
import {
  getLegislativeTrackerBySlug,
  getMunicipalitySettings,
  type LegislativeAction,
  type LegislativeExternalLink,
  type LegislativeOfficialRow,
} from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'

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

export default async function LegislativeTrackerPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const isCounty = municipalitySlug === 'allegheny-county'
  const [tracker, municipalitySettings] = await Promise.all([
    getLegislativeTrackerBySlug('legislative-tracker'),
    isCounty ? Promise.resolve(null) : getMunicipalitySettings(municipalitySlug),
  ])
  const initialQuery = municipalitySettings?.voterGuideSearchTerms?.[0] ?? ''

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

      <LegislativeTrackerFilter
        accomplishments={accomplishments}
        blockedOrHarmful={blockedOrHarmful}
        localEntries={localEntries}
        categories={categories}
        initialQuery={initialQuery}
      />

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
