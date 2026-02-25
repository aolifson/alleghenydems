import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import CommitteeDirectoryTable from '@/components/committee-directory-table'
import CommitteeContactTable from '@/components/committee-contact-table'
import {
  getCommitteeContactEntries,
  getCommitteeDirectoryEntries,
  getPageBySlug,
} from '@/sanity/lib/queries'
import { stripDuplicatedHeroBlocks, stripShortcodeBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Find Committee Members and Positions' }
export const revalidate = 3600

export default async function FindCommitteeMembersPage() {
  const [page, directoryRows, contactRows] = await Promise.all([
    getPageBySlug('find-committee-members-and-positions'),
    getCommitteeDirectoryEntries(),
    getCommitteeContactEntries(),
  ])

  const deDupedBody = stripDuplicatedHeroBlocks(
    page?.body,
    page?.heroHeadline ?? page?.title,
    page?.heroSubhead
  )
  const body = stripShortcodeBlocks(deDupedBody, ['ninja_tables'])

  return (
    <>
      <PageHero
        headline={page?.heroHeadline ?? page?.title ?? 'Find Committee Members and Positions'}
        subhead={page?.heroSubhead}
        image={page?.heroImage}
      />

      <div className="max-w-7xl mx-auto px-4 py-10 space-y-10">
        {body && Array.isArray(body) && body.length > 0 && (
          <section className="prose prose-lg max-w-none">
            <PortableText value={body as Parameters<typeof PortableText>[0]['value']} />
          </section>
        )}

        <section>
          <h2 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">
            Find Committee Members and Positions
          </h2>
          <p className="text-[var(--color-text-muted)] mb-4">
            Search by committee, ward, district, name, or committee office.
          </p>
          {directoryRows.length > 0 ? (
            <CommitteeDirectoryTable rows={directoryRows} />
          ) : (
            <p className="text-[var(--color-text-muted)]">
              Committee directory data has not been imported yet.
            </p>
          )}
        </section>

        <section>
          <h2 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">
            Committee Contact Information
          </h2>
          <p className="text-[var(--color-text-muted)] mb-4">
            Chairs and social links for local committees.
          </p>
          {contactRows.length > 0 ? (
            <CommitteeContactTable rows={contactRows} />
          ) : (
            <p className="text-[var(--color-text-muted)]">
              Committee contact data has not been imported yet.
            </p>
          )}
        </section>
      </div>
    </>
  )
}
