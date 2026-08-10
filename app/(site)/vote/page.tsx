import type { Metadata } from 'next'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug } from '@/sanity/lib/queries'
import { getMunicipalityPrefix, getMunicipalitySlug } from '@/lib/tenant'
import { prefixHref } from '@/lib/prefix-href'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Voter Resources' }

const VOTER_LINKS = [
  {
    label: '2026 Voter Guide',
    description: 'Review endorsed races, districts, and candidate profiles.',
    href: '/voter-guide',
    icon: '📘',
  },
  {
    label: 'Register to Vote',
    description: 'Register online through PA Voter Services.',
    href: 'https://www.pavoterservices.pa.gov/pages/VoterRegistrationApplication.aspx',
    icon: '✅',
  },
  {
    label: 'Check Your Registration',
    description: 'Verify your voter registration status.',
    href: 'https://www.pavoterservices.pa.gov/pages/voterregistrationstatus.aspx',
    icon: '🔍',
  },
  {
    label: 'Find Your Polling Place',
    description: 'Look up your polling location for Election Day.',
    href: 'https://www.pavoterservices.pa.gov/pages/pollingplaceinfo.aspx',
    icon: '📍',
  },
  {
    label: 'Apply for a Mail-In Ballot',
    description: 'Request a ballot by mail — no excuse needed in Pennsylvania.',
    href: 'https://www.vote.pa.gov/Voting-in-PA/Pages/Mail-and-Absentee-Ballot.aspx',
    icon: '✉️',
  },
  {
    label: 'Track Your Ballot',
    description: 'Check the status of your mail-in or absentee ballot.',
    href: 'https://www.pavoterservices.pa.gov/pages/ballottracking.aspx',
    icon: '📬',
  },
  {
    label: 'Early Voting Locations',
    description: 'Find satellite voting offices for early in-person voting.',
    href: 'https://www.alleghenycounty.us/elections/early-voting.aspx',
    icon: '🏛️',
  },
  {
    label: 'Election Calendar',
    description: 'Key dates: registration deadlines, primary, general election.',
    href: 'https://www.vote.pa.gov/About-Elections/Pages/Election-Calendar.aspx',
    icon: '📅',
  },
]

export default async function VotePage() {
  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug('vote', municipalitySlug)
  const basePath = await getMunicipalityPrefix()
  const headline = page?.heroHeadline ?? 'Voter Resources'
  const subhead = page?.heroSubhead ?? 'Everything you need to register and vote in Allegheny County, Pennsylvania.'
  const body = stripDuplicatedHeroBlocks(page?.body, headline, subhead)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <PageHero
        headline={headline}
        subhead={subhead}
        image={page?.heroImage}
        rounded={false}
        framedText
        minHeightClassName="min-h-[340px]"
      />

      <Link
        href={prefixHref('/plan-to-vote', basePath)}
        className="flex items-center justify-between gap-4 mb-8 rounded-xl bg-[var(--color-navy)] text-white px-6 py-5 hover:opacity-95 transition-opacity"
      >
        <div>
          <p className="font-display text-xl font-bold">New: Make a Plan to Vote</p>
          <p className="text-sm text-white/80">Four quick steps to make sure your vote counts this November.</p>
        </div>
        <span className="shrink-0 text-[var(--color-gold)] font-semibold">Start →</span>
      </Link>

      {body ? (
        <div className="prose-content max-w-4xl">
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {VOTER_LINKS.map(({ label, description, href, icon }) => (
              <a
                key={href}
                href={href}
                target={href.startsWith('http') ? '_blank' : undefined}
                rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="flex items-start gap-4 p-4 bg-white rounded-lg border border-[var(--color-border)] hover:border-[var(--color-blue-mid)] hover:shadow-md transition-all group"
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <p className="font-semibold text-[var(--color-blue-mid)] group-hover:underline">{label}</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{description}</p>
                </div>
              </a>
            ))}
          </div>

          <div className="bg-[var(--color-blue-light)] rounded-lg p-6 border border-[var(--color-border)]">
            <h2 className="font-bold text-[var(--color-blue)] mb-2">Need Help?</h2>
            <p className="text-sm text-[var(--color-text-muted)]">
              Contact the Allegheny County Elections Division at{' '}
              <a href="https://www.alleghenycounty.us/elections" target="_blank" rel="noopener noreferrer"
                className="text-[var(--color-blue-mid)] hover:underline">
                alleghenycounty.us/elections
              </a>{' '}
              or call the ACDC office for assistance.
            </p>
          </div>
        </>
      )}
    </div>
  )
}
