import type { Metadata } from 'next'
import { getExternalLinks } from '@/sanity/lib/queries'

export const metadata: Metadata = { title: 'Resources & Links' }
export const revalidate = 3600

const CATEGORY_LABELS: Record<string, string> = {
  'voter-resources': '🗳️ Voter Resources',
  'donate': '💙 Donate & Support',
  'party': '🏛️ State & Local Party',
  'officials': '⭐ Elected Officials',
  'volunteer': '🤝 Volunteer',
  'other': '🔗 Other Resources',
}

const CATEGORY_ORDER = ['voter-resources', 'volunteer', 'donate', 'party', 'officials', 'other']

export default async function LinksPage() {
  const links = await getExternalLinks()

  const byCategory = links.reduce<Record<string, typeof links>>((acc, link) => {
    if (!acc[link.category]) acc[link.category] = []
    acc[link.category].push(link)
    return acc
  }, {})

  const categories = CATEGORY_ORDER.filter((c) => byCategory[c]?.length)

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Resources & Links</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Helpful links for Democrats in Allegheny County.</p>

      {categories.map((category) => (
        <section key={category} className="mb-8">
          <h2 className="text-lg font-bold text-[var(--color-blue)] mb-3">
            {CATEGORY_LABELS[category] ?? category}
          </h2>
          <ul className="space-y-2">
            {byCategory[category].map((link) => (
              <li key={link._id}>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[var(--color-border)] hover:border-[var(--color-blue-mid)] hover:shadow-sm transition-all group"
                >
                  <div className="flex-1">
                    <span className="font-semibold text-[var(--color-blue-mid)] group-hover:underline">{link.label}</span>
                    {link.description && (
                      <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{link.description}</p>
                    )}
                  </div>
                  <span className="text-[var(--color-text-muted)] flex-shrink-0 mt-0.5">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}
