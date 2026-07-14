import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { getPageBySlug } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'YDAC' }
export const revalidate = 3600

export default async function YdacPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug('ydac', municipalitySlug)

  const body = stripDuplicatedHeroBlocks(
    page?.body,
    page?.heroHeadline ?? page?.title,
    page?.heroSubhead
  )

  return (
    <>
      <PageHero
        headline={page?.heroHeadline ?? page?.title ?? 'YDAC'}
        subhead={page?.heroSubhead}
        image={page?.heroImage}
      />

      <div className="max-w-7xl mx-auto px-4 py-10">
        {body && Array.isArray(body) && body.length > 0 ? (
          <section className="prose prose-lg max-w-none">
            <PortableText value={body as Parameters<typeof PortableText>[0]['value']} />
          </section>
        ) : (
          <p className="text-[var(--color-text-muted)]">YDAC page content is coming soon.</p>
        )}
      </div>
    </>
  )
}
