import type { Metadata } from 'next'
import Link from 'next/link'
import ExternalLink from '@/components/external-link'
import ElectionCountdown from '@/components/election-countdown'
import VoteReminderForm from '@/components/vote-reminder-form'
import { ELECTION, VOTE_LINKS } from '@/lib/election'
import { getPlanToVoteSettings } from '@/sanity/lib/queries'
import { getMunicipalityPrefix } from '@/lib/tenant'
import { prefixHref } from '@/lib/prefix-href'

export const metadata: Metadata = {
  title: 'Make a Plan to Vote',
  description:
    'A simple, step-by-step plan to make sure your vote counts in the 2026 election — register, choose how to vote, know your ballot, and make it happen.',
}
export const revalidate = 3600

function StepCard({
  step,
  title,
  children,
}: {
  step: number
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 bg-[var(--color-navy)] px-5 py-3">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)] text-[var(--color-navy)] font-bold text-sm">
          {step}
        </span>
        <h2 className="font-display text-lg md:text-xl font-bold text-white">{title}</h2>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </section>
  )
}

function ActionButton({ href, children, primary = false }: { href: string; children: React.ReactNode; primary?: boolean }) {
  const className = primary
    ? 'inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-blue)] hover:opacity-90 text-white text-sm font-semibold rounded-lg transition-opacity'
    : 'inline-flex items-center gap-1.5 px-4 py-2 border border-[var(--color-blue-mid)] text-[var(--color-blue-mid)] hover:bg-[var(--color-blue-light)] text-sm font-semibold rounded-lg transition-colors'
  return (
    <ExternalLink href={href} className={className} iconClassName="h-3 w-3">
      {children}
    </ExternalLink>
  )
}

function Deadline({ label, value }: { label: string; value: string }) {
  return (
    <p className="text-sm">
      <span className="font-semibold text-[var(--color-navy)]">{label}:</span>{' '}
      <span className="text-[var(--color-text)]">{value}</span>
    </p>
  )
}

export default async function PlanToVotePage() {
  const [basePath, cms] = await Promise.all([getMunicipalityPrefix(), getPlanToVoteSettings()])
  // Every string and link below falls back to the value it had when this page
  // was hard-coded, so an empty (or missing) Studio document renders exactly
  // as before. Dates stay in lib/election.ts — see the note in the schema.
  const links = {
    register: cms?.registerUrl ?? VOTE_LINKS.register,
    checkRegistration: cms?.checkRegistrationUrl ?? VOTE_LINKS.checkRegistration,
    applyMailBallot: cms?.applyMailBallotUrl ?? VOTE_LINKS.applyMailBallot,
    trackBallot: cms?.trackBallotUrl ?? VOTE_LINKS.trackBallot,
    pollingPlace: cms?.pollingPlaceUrl ?? VOTE_LINKS.pollingPlace,
    earlyVoting: cms?.earlyVotingUrl ?? VOTE_LINKS.earlyVoting,
    electionCalendar: cms?.electionCalendarUrl ?? VOTE_LINKS.electionCalendar,
  }

  return (
    <>
      {/* Hero with live countdown */}
      <section className="relative bg-[var(--color-navy)] text-white">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-12 text-center">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">{cms?.heroHeadline ?? 'Make Your Plan to Vote'}</h1>
          <p className="text-base md:text-lg text-white/80 max-w-2xl mx-auto mb-6">
            {cms?.heroIntro ??
              'Voters who make a plan are far more likely to follow through. Here\u2019s everything you need, in four quick steps.'}
          </p>
          <ElectionCountdown />
        </div>
      </section>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <StepCard step={1} title={cms?.step1Title ?? "Check that you're registered"}>
          <p className="text-sm text-[var(--color-text)]">
            {cms?.step1Body ?? 'You must be registered at your current address to vote. It only takes a minute to check \u2014 or to register if you\u2019ve moved or never have.'}
          </p>
          <Deadline label="Register by" value={ELECTION.registrationDeadlineLabel} />
          <div className="flex flex-wrap gap-3">
            <ActionButton href={links.checkRegistration} primary>Check my registration</ActionButton>
            <ActionButton href={links.register}>Register to vote</ActionButton>
          </div>
        </StepCard>

        <StepCard step={2} title={cms?.step2Title ?? "Choose how you'll vote"}>
          <p className="text-sm text-[var(--color-text)]">
            {cms?.step2Body ?? 'Pennsylvania lets any voter vote by mail \u2014 no excuse needed \u2014 or vote in person. Pick whichever fits your life.'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
              <h3 className="font-semibold text-[var(--color-navy)]">{cms?.mailCardHeading ?? '✉️ Vote by mail'}</h3>
              <Deadline label="Apply by" value={ELECTION.mailBallotApplicationDeadlineLabel} />
              <Deadline label="Return it" value={ELECTION.mailBallotReturnLabel} />
              <div className="flex flex-wrap gap-2">
                <ActionButton href={links.applyMailBallot} primary>Apply for a mail ballot</ActionButton>
                <ActionButton href={links.trackBallot}>Track my ballot</ActionButton>
              </div>
            </div>
            <div className="rounded-lg border border-[var(--color-border)] p-4 space-y-3">
              <h3 className="font-semibold text-[var(--color-navy)]">{cms?.inPersonCardHeading ?? '🏛️ Vote in person'}</h3>
              <Deadline label="Election Day" value={`${ELECTION.dateLabel}, ${ELECTION.pollHours}`} />
              <p className="text-xs text-[var(--color-text-muted)]">Early in-person voting may also be available.</p>
              <div className="flex flex-wrap gap-2">
                <ActionButton href={links.pollingPlace} primary>Find my polling place</ActionButton>
                <ActionButton href={links.earlyVoting}>Early voting</ActionButton>
              </div>
            </div>
          </div>
        </StepCard>

        <StepCard step={3} title={cms?.step3Title ?? "Know what's on your ballot"}>
          <p className="text-sm text-[var(--color-text)]">
            {cms?.step3Body ?? 'See the Democratic candidates and endorsed races for your exact address, so you walk in ready.'}
          </p>
          <Link
            href={prefixHref('/voter-guide', basePath)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-gold)] hover:opacity-90 text-[var(--color-navy)] text-sm font-semibold rounded-lg transition-opacity"
          >
            Open the 2026 Voter Guide →
          </Link>
        </StepCard>

        <StepCard step={4} title={cms?.step4Title ?? "Lock in your plan"}>
          <p className="text-sm text-[var(--color-text)]">
            {cms?.step4Body ?? 'Decide when you\u2019ll vote and how you\u2019ll get there, then put these dates somewhere you\u2019ll see them.'}
          </p>
          <ul className="text-sm space-y-1.5">
            <li><Deadline label="Register by" value={ELECTION.registrationDeadlineLabel} /></li>
            <li><Deadline label="Mail ballot application by" value={ELECTION.mailBallotApplicationDeadlineLabel} /></li>
            <li><Deadline label="Election Day" value={`${ELECTION.dateLabel}, polls open ${ELECTION.pollHours}`} /></li>
          </ul>
          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href={prefixHref('/get-involved', basePath)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-semibold rounded-lg transition-colors"
            >
              Help get out the vote →
            </Link>
            <ActionButton href={links.electionCalendar}>Full election calendar</ActionButton>
          </div>
        </StepCard>

        {/* Email-capture: get reminded before each key deadline */}
        <section className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 bg-[var(--color-navy)] px-5 py-3">
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-gold)] text-[var(--color-navy)] font-bold text-sm">
              🔔
            </span>
            <h2 className="font-display text-lg md:text-xl font-bold text-white">Remind me to vote</h2>
          </div>
          <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text)]">
                Life gets busy. Sign up and we&rsquo;ll send you a quick heads-up before each key deadline so
                you never miss your chance to vote.
              </p>
              <ul className="text-sm space-y-1.5">
                <li><Deadline label="Register by" value={ELECTION.registrationDeadlineLabel} /></li>
                <li><Deadline label="Mail ballot application by" value={ELECTION.mailBallotApplicationDeadlineLabel} /></li>
                <li><Deadline label="Election Day" value={ELECTION.dateLabel} /></li>
              </ul>
            </div>
            <div className="md:border-l md:border-[var(--color-border)] md:pl-6">
              <VoteReminderForm source="plan-to-vote" />
            </div>
          </div>
        </section>

        <div className="bg-[var(--color-blue-light)] rounded-xl p-5 border border-[var(--color-border)]">
          <h2 className="font-bold text-[var(--color-blue)] mb-1">{cms?.helpHeading ?? 'Questions about voting?'}</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            Contact the Allegheny County Elections Division at{' '}
            <ExternalLink
              href="https://www.alleghenycounty.us/elections"
              className="text-[var(--color-blue-mid)] hover:underline"
              iconClassName="h-2.5 w-2.5"
            >
              alleghenycounty.us/elections
            </ExternalLink>{' '}
            or reach out to the ACDC office.
          </p>
        </div>
      </div>
    </>
  )
}
