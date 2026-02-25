import type { Metadata } from 'next'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import SocialLinks from '@/components/social-links'
import { urlFor } from '@/sanity/lib/image'
import { getPageBySlug, getWhoWeAreMembers } from '@/sanity/lib/queries'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'

export const metadata: Metadata = { title: 'Who We Are' }
export const revalidate = 86400

export default async function WhoWeArePage() {
  const [page, leaders] = await Promise.all([
    getPageBySlug('who-we-are'),
    getWhoWeAreMembers(),
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
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {leaders.map((leader) => (
              <article key={leader._id} className="bg-white rounded-lg border border-[var(--color-border)] p-4 text-center">
                {leader.photo ? (
                  <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden bg-[var(--color-blue-light)] mb-3">
                    <Image
                      src={urlFor(leader.photo).width(160).height(160).url()}
                      alt={leader.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 mx-auto rounded-full bg-[var(--color-blue-light)] flex items-center justify-center text-[var(--color-blue)] font-bold text-xl mb-3">
                    {leader.name.charAt(0)}
                  </div>
                )}
                <h3 className="font-semibold text-[var(--color-text)]">{leader.name}</h3>
                {leader.title && <p className="text-sm text-[var(--color-text-muted)] mb-2">{leader.title}</p>}
                <SocialLinks
                  facebookUrl={leader.facebookUrl}
                  instagramUrl={leader.instagramUrl}
                  xUrl={leader.xUrl}
                />
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
