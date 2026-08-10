import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import LeadershipGrid from '@/components/leadership-grid'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug, getWhoWeAreMembers } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Who We Are' }
export const revalidate = 600

export default async function WhoWeArePage() {
  const municipalitySlug = await getMunicipalitySlug()
  const [page, leaders] = await Promise.all([
    getPageBySlug('who-we-are', municipalitySlug),
    getWhoWeAreMembers(municipalitySlug),
  ])
  const headline = page?.heroHeadline ?? page?.title ?? 'Who We Are'
  const body = stripDuplicatedHeroBlocks(page?.body, headline, page?.heroSubhead)

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <PageHero
        headline={headline}
        subhead={page?.heroSubhead}
        image={page?.heroImage}
      />

      {body ? (
        <div className="prose-content">
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
        </div>
      ) : (
        <div className="prose-content space-y-4 text-[var(--color-text)]">
          <p>
            ACDC&apos;s leadership team works with committees, members, elected officials, and volunteers across Allegheny County.
          </p>
        </div>
      )}

      {leaders.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-[var(--color-blue)] mb-4">Leadership</h2>
          <p className="text-sm text-[var(--color-text-muted)] mb-4">Click a card for bio and contact info.</p>
          <LeadershipGrid members={leaders} />
        </section>
      )}
    </div>
  )
}
