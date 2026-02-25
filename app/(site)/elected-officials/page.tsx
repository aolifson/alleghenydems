import type { Metadata } from 'next'
import Image from 'next/image'
import SocialLinks from '@/components/social-links'
import { getElectedOfficials } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export const metadata: Metadata = { title: 'Elected Officials' }
export const revalidate = 86400

const CATEGORY_ORDER = [
  'U.S. Congress & Senate',
  'Governor & Lt. Governor',
  'Pennsylvania State Senate',
  'Pennsylvania State House',
  'City of Pittsburgh',
  'Allegheny County Officials',
  'Allegheny County Council',
  'Other Officials',
]

function categorize(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('congress') || t.includes('u.s. sen')) return 'U.S. Congress & Senate'
  if (t.includes('governor')) return 'Governor & Lt. Governor'
  if (t.includes('state senator') || t.includes('state senate')) return 'Pennsylvania State Senate'
  if (t.includes('state rep')) return 'Pennsylvania State House'
  if (t.includes('mayor')) return 'City of Pittsburgh'
  if (t.includes('county executive') || t.includes('district attorney') || t.includes('sheriff')) return 'Allegheny County Officials'
  if (t.includes('county council')) return 'Allegheny County Council'
  return 'Other Officials'
}

export default async function ElectedOfficialsPage() {
  const officials = await getElectedOfficials()

  const byCategory = officials.reduce<Record<string, typeof officials>>((acc, o) => {
    const cat = categorize(o.title ?? '')
    ;(acc[cat] ??= []).push(o)
    return acc
  }, {})

  const categories = CATEGORY_ORDER.filter(c => byCategory[c]?.length)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Elected Officials</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Democratic elected officials serving Allegheny County.
      </p>

      {categories.map(cat => (
        <section key={cat} className="mb-10">
          <h2 className="text-lg font-bold text-[var(--color-blue)] border-b-2 border-[var(--color-blue-light)] pb-2 mb-5">
            {cat}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
            {byCategory[cat].map(official => (
              <div key={official._id} className="flex flex-col items-center text-center gap-2">
                {official.photo ? (
                  <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[var(--color-blue-light)] flex-shrink-0 shadow-sm">
                    <Image
                      src={urlFor(official.photo).width(192).height(192).url()}
                      alt={official.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-24 h-24 rounded-full bg-[var(--color-blue-light)] flex items-center justify-center flex-shrink-0 text-[var(--color-blue)] font-bold text-2xl shadow-sm">
                    {official.name.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-[var(--color-text)] leading-tight">{official.name}</p>
                  {official.title && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-tight">{official.title}</p>
                  )}
                </div>
                <SocialLinks
                  facebookUrl={official.facebookUrl}
                  instagramUrl={official.instagramUrl}
                  xUrl={official.xUrl}
                />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
