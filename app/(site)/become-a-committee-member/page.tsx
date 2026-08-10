import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Become a Committee Member' }
export const revalidate = 3600

export default async function BecomeACommitteeMemberPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug('become-a-committee-member', municipalitySlug)

  const body = stripDuplicatedHeroBlocks(
    page?.body,
    page?.heroHeadline ?? page?.title,
    page?.heroSubhead
  )

  return (
    <>
      <PageHero
        headline={page?.heroHeadline ?? page?.title ?? 'Become a Committee Member'}
        subhead={page?.heroSubhead}
        image={page?.heroImage}
      />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {body && Array.isArray(body) && body.length > 0 ? (
          <section className="prose prose-lg max-w-none">
            <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
          </section>
        ) : (
          <p className="text-[var(--color-text-muted)]">Committee membership information is coming soon.</p>
        )}
      </div>
    </>
  )
}
