import type { Metadata } from 'next'
import Link from 'next/link'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'About' }
export const revalidate = 86400

export default async function AboutPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug('about', municipalitySlug)
  const headline = page?.heroHeadline ?? page?.title ?? 'About'
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
            The Allegheny County Democratic Committee (ACDC) is the local governing body of the Democratic Party in Allegheny County, Pennsylvania. We work to elect Democrats up and down the ballot — from school board to U.S. Senate.
          </p>
          <p>
            Our committee is made up of elected committee people from every ward and municipality across Allegheny County. These local leaders are the backbone of the Democratic Party, connecting neighbors with candidates, issues, and opportunities to get involved.
          </p>
          <h2>Our Mission</h2>
          <p>
            To build and sustain a strong, inclusive Democratic Party that reflects the diversity of Allegheny County — and to elect candidates who fight for working families, quality education, affordable healthcare, and a clean environment.
          </p>
          <p>
            Ready to participate?{' '}
            <Link href="/get-involved" className="font-semibold text-[var(--color-blue-mid)] hover:underline">
              Get Involved →
            </Link>
          </p>
        </div>
      )}
    </div>
  )
}
