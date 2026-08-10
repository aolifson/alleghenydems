import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Volunteer' }
export const revalidate = 3600

export default async function VolunteerPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug('volunteer', municipalitySlug)

  const body = stripDuplicatedHeroBlocks(
    page?.body,
    page?.heroHeadline ?? page?.title,
    page?.heroSubhead
  )

  return (
    <>
      <PageHero
        headline={page?.heroHeadline ?? page?.title ?? 'Volunteer'}
        subhead={page?.heroSubhead}
        image={page?.heroImage}
      />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {body && Array.isArray(body) && body.length > 0 ? (
          <div className="prose-content">
            <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)]">Volunteer information is coming soon.</p>
        )}
      </div>
    </>
  )
}
