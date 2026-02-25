import type { Metadata } from 'next'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { getPageBySlug } from '@/sanity/lib/queries'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Get Involved' }
export const revalidate = 86400

export default async function GetInvolvedPage() {
  const page = await getPageBySlug('get-involved')
  const headline = page?.heroHeadline ?? 'Get Involved'
  const subhead = page?.heroSubhead ?? 'There are many ways to support Democrats in Allegheny County. Find the right fit for you.'
  const body = stripDuplicatedHeroBlocks(page?.body, headline, subhead)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <PageHero
        headline={headline}
        subhead={subhead}
        image={page?.heroImage}
      />

      {body ? (
        <div className="prose-content">
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Volunteer', description: 'Join phone banks, canvasses, and campaign activities across the county.', href: 'https://www.mobilize.us/alleghenydems/', icon: '🤝', external: true },
            { label: 'Donate', description: 'Support the Allegheny County Democratic Committee with a contribution.', href: 'https://secure.actblue.com', icon: '💙', external: true },
            { label: 'Become a Committee Person', description: 'Represent your ward or municipality as an elected committee person.', href: '/contact', icon: '⭐', external: false },
            { label: 'Young Democrats', description: 'Connect with young Democrats in Allegheny County.', href: '/contact', icon: '🌟', external: false },
          ].map(({ label, description, href, icon, external }) => (
            <a
              key={label}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="flex items-start gap-4 p-5 bg-white rounded-lg border border-[var(--color-border)] hover:border-[var(--color-blue-mid)] hover:shadow-md transition-all group"
            >
              <span className="text-3xl">{icon}</span>
              <div>
                <p className="font-semibold text-[var(--color-blue-mid)] group-hover:underline">{label}</p>
                <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
