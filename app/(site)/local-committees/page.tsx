import type { Metadata } from 'next'
import Link from 'next/link'
import PageHero from '@/components/page-hero'
import LocalCommitteeList from '@/components/local-committee-list'
import { getLocalCommittees } from '@/sanity/lib/queries'

export const metadata: Metadata = { title: 'Local Committees' }
export const revalidate = 3600

export default async function LocalCommitteesPage() {
  const committees = await getLocalCommittees()

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <PageHero
        headline="Local Committees"
        subhead="Democratic committees across Allegheny County — find yours and get connected."
      />

      {committees.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">
          Local committee listings are coming soon. In the meantime, find committee contacts in the{' '}
          <Link href="/committee-members#local-committees" className="text-[var(--color-blue-mid)] hover:underline">
            committee directory
          </Link>.
        </p>
      ) : (
        <LocalCommitteeList committees={committees} />
      )}

      <p className="mt-10 text-sm text-[var(--color-text-muted)]">
        Looking for committee chairs and individual members?{' '}
        <Link href="/committee-members" className="font-medium text-[var(--color-blue-mid)] hover:underline">
          Browse the committee directory →
        </Link>
      </p>
    </div>
  )
}
