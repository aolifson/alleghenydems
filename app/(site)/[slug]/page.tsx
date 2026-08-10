import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { portableTextComponents } from '@/components/portable-text-components'
import { getPageBySlug } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

// Renders any published Page document at its own slug, so a content editor can
// create a page in the Studio and have a working URL without a code change.
// Purpose-built routes (/about, /contact, /voter-guide, …) are static and take
// precedence over this dynamic segment automatically, so they are unaffected —
// this only ever handles slugs nothing else claims.
export const revalidate = 3600

// Page documents whose content is served by a purpose-built route at a
// different path. Without these, this catch-all would expose a second,
// duplicate URL for the same content.
const CANONICAL_PATHS: Record<string, string> = {
  'who-we-are': '/about/who-we-are',
}

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug(slug, municipalitySlug)
  if (!page) return {}
  return { title: page.title }
}

export default async function SanityPage({ params }: Props) {
  const { slug } = await params

  const canonicalPath = CANONICAL_PATHS[slug]
  if (canonicalPath) redirect(canonicalPath)

  const municipalitySlug = await getMunicipalitySlug()
  const page = await getPageBySlug(slug, municipalitySlug)
  if (!page) notFound()

  const headline = page.heroHeadline ?? page.title
  const body = stripDuplicatedHeroBlocks(page.body, headline, page.heroSubhead)

  return (
    <>
      <PageHero headline={headline} subhead={page.heroSubhead} image={page.heroImage} />

      <div className="max-w-3xl mx-auto px-4 py-10">
        {body && Array.isArray(body) && body.length > 0 ? (
          <div className="prose-content">
            <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
          </div>
        ) : (
          <p className="text-[var(--color-text-muted)]">This page doesn&apos;t have any content yet.</p>
        )}
      </div>
    </>
  )
}
