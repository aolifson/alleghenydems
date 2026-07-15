import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import LegislativeReviewQueue from '@/components/legislative-review-queue'
import { getActiveMemberEmail } from '@/lib/members-session'
import { fetchTrackerDocs, extractReviewItems, getReviewCategories } from '@/lib/legislative-review'

export const metadata: Metadata = { title: 'Vote Review Queue' }
export const dynamic = 'force-dynamic'

export default async function VoteReviewPage() {
  // Middleware already checked the cookie; re-check isActive because this page
  // can edit tracker content.
  const email = await getActiveMemberEmail()
  if (!email) redirect('/members/login')

  const { draft, published } = await fetchTrackerDocs()
  const doc = draft ?? published

  return (
    <div className="max-w-4xl">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Vote Review Queue</h1>
      <p className="text-[var(--color-text-muted)] mb-4">
        Votes pulled automatically from official roll-call records, waiting for a human check before they can
        appear on the public{' '}
        <a href="/legislative-tracker" className="text-[var(--color-blue-mid)] hover:underline">
          Legislative Tracker
        </a>
        . For each vote: follow the source link if you need more context, then either{' '}
        <strong>categorize &amp; approve</strong> it, or <strong>reject</strong> it if it isn&rsquo;t worth
        showing voters. Use the checkboxes to reject several unimportant votes at once.
      </p>
      <p className="text-sm text-[var(--color-text-muted)] mb-6 rounded-lg bg-[var(--color-blue-light)] border border-[var(--color-blue)]/30 px-4 py-3">
        ℹ️ Approvals edit the tracker <em>draft</em> — nothing appears publicly until an editor publishes the
        Legislative Tracker in Sanity Studio. Rejecting removes the vote from the draft for good.
      </p>

      {doc ? (
        <LegislativeReviewQueue initialItems={extractReviewItems(doc)} categories={getReviewCategories(doc)} />
      ) : (
        <p className="text-[var(--color-text-muted)]">
          The legislative tracker document hasn&rsquo;t been created in Sanity yet, so there is nothing to review.
        </p>
      )}
    </div>
  )
}
