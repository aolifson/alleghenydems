import type { Metadata } from 'next'
import { getLatestNews } from '@/sanity/lib/queries'
import NewsCard from '@/components/news-card'
import { getMunicipalitySlug, getMunicipalityPrefix } from '@/lib/tenant'

export const metadata: Metadata = { title: 'News & Updates' }
export const revalidate = 3600

export default async function NewsPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const basePath = await getMunicipalityPrefix()
  const posts = await getLatestNews(50, municipalitySlug)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">News & Updates</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Latest news, announcements, and press coverage from Allegheny County Democrats.</p>

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <NewsCard key={post._id} post={post} basePath={basePath} />
          ))}
        </div>
      ) : (
        <p className="text-[var(--color-text-muted)] py-8">No news posts yet.</p>
      )}
    </div>
  )
}
