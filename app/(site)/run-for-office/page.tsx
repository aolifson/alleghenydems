import type { Metadata } from 'next'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug } from '@/sanity/lib/queries'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Run for Office' }
export const revalidate = 86400

const RESOURCES = [
  {
    label: '2026 ACDC Endorsement Process',
    description: 'Learn how to seek the endorsement of the Allegheny County Democratic Committee.',
    href: '#endorsement',
    icon: '⭐',
  },
  {
    label: 'Board of Elections Requirements',
    description: 'Candidate filing requirements, deadlines, and petition signature requirements.',
    href: 'https://www.alleghenycounty.us/elections/candidates.aspx',
    icon: '📋',
    external: true,
  },
  {
    label: 'ACDC Support & Resources',
    description: 'Find out how the Democratic Committee can support your campaign.',
    href: '/contact',
    icon: '🤝',
  },
]

export default async function RunForOfficePage() {
  const page = await getPageBySlug('run-for-office')
  const headline = page?.heroHeadline ?? 'Run for Office'
  const subhead = page?.heroSubhead ?? 'Interested in running as a Democrat in Allegheny County? We\'re here to help.'
  const body = stripDuplicatedHeroBlocks(page?.body, headline, subhead)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <PageHero
        headline={headline}
        subhead={subhead}
        image={page?.heroImage}
      />

      {body ? (
        <div className="prose-content mb-10">
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
        </div>
      ) : (
        <div className="space-y-4 mb-10">
          {RESOURCES.map(({ label, description, href, icon, external }) => (
            <a
              key={href}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="flex items-start gap-4 p-4 bg-white rounded-lg border border-[var(--color-border)] hover:border-[var(--color-blue-mid)] hover:shadow-md transition-all group"
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-[var(--color-blue-mid)] group-hover:underline">
                  {label} {external && <span className="text-xs opacity-60">↗</span>}
                </p>
                <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{description}</p>
              </div>
            </a>
          ))}
        </div>
      )}

      <div className="bg-[var(--color-blue)] text-white rounded-lg p-6">
        <h2 className="font-bold text-lg mb-2">Ready to take the next step?</h2>
        <p className="text-sm text-white/80 mb-4">
          Contact us to learn more about running as a Democrat, getting ACDC support, or finding out what offices are up for election.
        </p>
        <Link href="/contact" className="inline-block px-5 py-2 bg-[var(--color-gold)] text-[var(--color-navy)] font-semibold rounded hover:opacity-90 transition-opacity">
          Contact ACDC
        </Link>
      </div>
    </div>
  )
}
