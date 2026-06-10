import type { Metadata } from 'next'
import PageHero from '@/components/page-hero'
import MemberDirectory from '@/components/member-directory'
import CommitteeDirectoryTable from '@/components/committee-directory-table'
import CommitteeContactTable from '@/components/committee-contact-table'
import {
  getCommitteeMembers,
  getCommitteeDirectoryEntries,
  getCommitteeContactEntries,
} from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'

export const metadata: Metadata = { title: 'Committee Directory' }
export const revalidate = 3600

export default async function CommitteeDirectoryPage() {
  const municipalitySlug = await getMunicipalitySlug()

  const [members, directoryRows, contactRows] = await Promise.all([
    getCommitteeMembers(municipalitySlug),
    getCommitteeDirectoryEntries(municipalitySlug),
    getCommitteeContactEntries(municipalitySlug),
  ])

  return (
    <>
      <div className="max-w-7xl mx-auto px-4 pt-10">
        <PageHero
          headline="Committee Directory"
          subhead="Find the Democratic committee members representing your neighborhood."
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-10">
        {members.length > 0 ? (
          <MemberDirectory members={members} />
        ) : (
          <p className="py-8 text-[var(--color-text-muted)]">
            Member profiles are coming soon. The full list of committee seats is below.
          </p>
        )}

        <div className="space-y-12 mt-4">
          {directoryRows.length > 0 && (
            <section>
              <h2 className="font-display text-2xl font-bold text-[var(--color-blue)] mb-2">
                Seats & Vacancies
              </h2>
              <p className="text-[var(--color-text-muted)] mb-4">
                Every committee seat across the county — open seats are waiting for you.
              </p>
              <CommitteeDirectoryTable rows={directoryRows} />
            </section>
          )}

          {contactRows.length > 0 && (
            <section id="local-committees" className="scroll-mt-20">
              <h2 className="font-display text-2xl font-bold text-[var(--color-blue)] mb-2">
                Local Committee Contacts
              </h2>
              <p className="text-[var(--color-text-muted)] mb-4">
                Chairs and links for Democratic committees across Allegheny County.
              </p>
              <CommitteeContactTable rows={contactRows} />
            </section>
          )}
        </div>
      </div>
    </>
  )
}
