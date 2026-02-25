'use client'

import { useState } from 'react'
import type { FacebookPost } from '@/lib/facebook'

interface FacebookLiveFeedProps {
  pageUrl: string
  initialPosts: FacebookPost[]
  initialCursor?: string
}

function relativeTime(isoDate: string) {
  const now = new Date().getTime()
  const then = new Date(isoDate).getTime()
  const diffSec = Math.max(1, Math.round((now - then) / 1000))
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 60 * 60 * 24 * 365],
    ['month', 60 * 60 * 24 * 30],
    ['day', 60 * 60 * 24],
    ['hour', 60 * 60],
    ['minute', 60],
  ]
  for (const [unit, seconds] of units) {
    const value = Math.floor(diffSec / seconds)
    if (value >= 1) {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(-value, unit)
    }
  }
  return 'just now'
}

function excerpt(text?: string, max = 120) {
  if (!text) return ''
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  return `${clean.slice(0, max - 1)}…`
}

export default function FacebookLiveFeed({
  pageUrl,
  initialPosts,
  initialCursor,
}: FacebookLiveFeedProps) {
  const [posts, setPosts] = useState(initialPosts)
  const [cursor, setCursor] = useState(initialCursor)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function loadMore() {
    if (!cursor || loading) return
    setLoading(true)
    setError(null)
    try {
      const url = `/api/facebook-posts?after=${encodeURIComponent(cursor)}&limit=3`
      const res = await fetch(url, { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error ?? 'Failed to load posts')
      setPosts((prev) => [...prev, ...(payload.posts ?? [])])
      setCursor(payload.nextCursor)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more posts')
    } finally {
      setLoading(false)
    }
  }

  if (posts.length === 0) {
    return (
      <div className="rounded bg-white/95 p-6 text-center">
        <p className="text-[var(--color-text)] mb-3">Facebook feed is not available yet.</p>
        <a
          href={pageUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-[var(--color-blue)] hover:opacity-90 text-white font-semibold transition-colors"
        >
          Visit on Facebook
        </a>
      </div>
    )
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {posts.map((post) => (
          <article key={post.id} className="rounded bg-white/95 p-3 shadow-sm border border-white/30">
            <div className="mb-3">
              <p className="font-semibold text-[var(--color-navy)]">Allegheny County Democratic Committee</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">{relativeTime(post.createdTime)}</p>
            </div>

            {post.message && (
              <p className="text-sm text-[var(--color-text)] mb-3 leading-relaxed">{excerpt(post.message)}</p>
            )}

            {post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={post.imageUrl}
                alt="Facebook post"
                className="w-full h-44 object-cover border border-[var(--color-border)]"
              />
            )}

            <div className="mt-3 flex items-center gap-2">
              <a
                href={post.permalinkUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-2 rounded bg-[var(--color-blue-light)] hover:bg-[var(--color-blue)] hover:text-white text-sm font-semibold text-[var(--color-navy)] transition-colors"
              >
                View on Facebook
              </a>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(post.permalinkUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-3 py-2 rounded bg-gray-100 hover:bg-gray-200 text-sm font-semibold text-[var(--color-text)] transition-colors"
              >
                Share
              </a>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-5 text-center space-y-2">
        {cursor ? (
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="inline-flex items-center justify-center px-6 py-2.5 rounded bg-white/15 hover:bg-white/25 disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        ) : (
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded bg-white/15 hover:bg-white/25 text-white font-semibold transition-colors"
          >
            More on Facebook
          </a>
        )}
        {error && <p className="text-sm text-red-200">{error}</p>}
      </div>
    </div>
  )
}
