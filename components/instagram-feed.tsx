'use client'

// Behold widget — https://behold.so (free tier)
// Set NEXT_PUBLIC_BEHOLD_FEED_ID in .env.local after creating a feed at behold.so

import { useEffect } from 'react'

const feedId = process.env.NEXT_PUBLIC_BEHOLD_FEED_ID

export default function InstagramFeed() {
  useEffect(() => {
    import('@behold/widget').then((mod) => {
      mod.widget.register()
    })
  }, [])

  if (!feedId) return null

  return (
    <div className="min-h-[200px]">
      {/* @ts-expect-error Behold custom element registered dynamically */}
      <behold-widget feed-id={feedId} />
    </div>
  )
}
