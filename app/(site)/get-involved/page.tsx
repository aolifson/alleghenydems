import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import ExternalLink from '@/components/external-link'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'
import { ACDC_DONATE_URL, ACDC_VOLUNTEER_URL } from '@/lib/links'

export const metadata: Metadata = { title: 'Get Involved' }
export const revalidate = 86400

export default async function GetInvolvedPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug('get-involved', municipalitySlug)
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
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: 'Volunteer', description: 'Join phone banks, canvasses, and campaign activities across the county.', href: ACDC_VOLUNTEER_URL, icon: '🤝', external: true },
            { label: 'Donate', description: 'Support the Allegheny County Democratic Committee with a contribution.', href: ACDC_DONATE_URL, icon: '💙', external: true },
            { label: 'Become a Committee Person', description: 'Represent your ward or municipality as an elected committee person.', href: '/become-a-committee-member', icon: '⭐', external: false },
            { label: 'Young Democrats', description: 'Connect with the Young Democrats of Allegheny County.', href: 'https://linktr.ee/youngdems_agh', icon: '🌟', external: true },
          ].map(({ label, description, href, icon, external }) => {
            const cardClassName = "flex items-start gap-4 p-5 bg-white rounded-lg border border-[var(--color-border)] hover:border-[var(--color-blue-mid)] hover:shadow-md transition-all group"
            const cardBody = (
              <>
                <span className="text-3xl">{icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-blue-mid)] group-hover:underline">{label}</p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{description}</p>
                </div>
              </>
            )
            return external ? (
              <ExternalLink key={label} href={href} className={cardClassName} iconClassName="h-3 w-3 mt-1.5 text-[var(--color-text-muted)]">
                {cardBody}
              </ExternalLink>
            ) : (
              <a key={label} href={href} className={cardClassName}>
                {cardBody}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
}
