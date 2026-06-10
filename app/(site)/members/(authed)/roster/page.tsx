import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import MemberRoster from '@/components/member-roster'
import { getMemberRoster } from '@/sanity/lib/queries'
import { getActiveMemberEmail } from '@/lib/members-session'

export const metadata: Metadata = { title: 'Member Roster' }

export default async function MemberRosterPage() {
  // Middleware already checked the cookie; re-check isActive here because
  // this page exposes the full contact roster.
  const email = await getActiveMemberEmail()
  if (!email) redirect('/members/login')

  const members = await getMemberRoster()

  return (
    <div>
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Member Roster</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Full contact information for active committee members. For committee business only — please don&rsquo;t share outside the committee.
      </p>
      <MemberRoster members={members} />
    </div>
  )
}
