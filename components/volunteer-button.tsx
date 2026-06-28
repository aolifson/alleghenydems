import ExternalLink from '@/components/external-link'
import { ACDC_VOLUNTEER_URL } from '@/lib/links'
import type { VoterGuideCandidate } from '@/sanity/lib/queries'

/**
 * "Volunteer" CTA for a Voter Guide candidate card. Links to the candidate's own
 * sign-up page when set, otherwise falls back to the general ACDC volunteer link
 * so every card offers a way to get involved.
 */
export default function VolunteerButton({ candidate }: { candidate: VoterGuideCandidate }) {
  const href = candidate.volunteerUrl ?? ACDC_VOLUNTEER_URL
  const label = candidate.volunteerUrl
    ? `Volunteer for ${candidate.name.split(' ')[0]}`
    : 'Volunteer with ACDC'
  return (
    <ExternalLink
      href={href}
      className="inline-flex items-center mt-3 px-3 py-1.5 bg-[var(--color-gold)] text-[var(--color-navy)] text-sm font-semibold rounded hover:opacity-90 transition-opacity"
      iconClassName="h-3 w-3"
    >
      {label}
    </ExternalLink>
  )
}
