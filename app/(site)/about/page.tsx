import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import { getPageBySlug } from '@/sanity/lib/queries'

export const metadata: Metadata = { title: 'About' }
export const revalidate = 86400

export default async function AboutPage() {
  const page = await getPageBySlug('about')

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-6">
        {page?.title ?? 'About the Allegheny County Democratic Committee'}
      </h1>
      {page?.body ? (
        <div className="prose-content">
          <PortableText value={page.body as Parameters<typeof PortableText>[0]['value']} />
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
          <h2>Get Involved</h2>
          <p>
            There are many ways to participate — volunteer for campaigns, become a committee person in your ward, attend party events, or donate to support our work.
          </p>
        </div>
      )}
    </div>
  )
}
