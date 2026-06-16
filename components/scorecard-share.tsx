'use client'

import { useState } from 'react'

/**
 * Share buttons for an official scorecard. Uses the live page URL at click time,
 * so it works on the county site and any municipality path/subdomain without config.
 */
export default function ScorecardShare({
  shareText,
  className = '',
}: {
  shareText: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)

  function currentUrl(): string {
    return typeof window !== 'undefined' ? window.location.href : ''
  }

  function openShare(url: string) {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500')
  }

  function shareFacebook() {
    const u = encodeURIComponent(currentUrl())
    openShare(`https://www.facebook.com/sharer/sharer.php?u=${u}`)
  }

  function shareX() {
    const u = encodeURIComponent(currentUrl())
    const t = encodeURIComponent(shareText)
    openShare(`https://twitter.com/intent/tweet?url=${u}&text=${t}`)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${shareText} ${currentUrl()}`)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked — no-op; the FB/X buttons still work.
    }
  }

  const btn =
    'inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded transition-colors'

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="text-sm font-medium text-[var(--color-text-muted)] mr-1">Share this record:</span>
      <button type="button" onClick={shareFacebook} className={`${btn} bg-[#1877F2] text-white hover:opacity-90`}>
        Facebook
      </button>
      <button type="button" onClick={shareX} className={`${btn} bg-black text-white hover:opacity-90`}>
        X / Twitter
      </button>
      <button
        type="button"
        onClick={copyLink}
        className={`${btn} border border-[var(--color-border)] text-[var(--color-navy)] hover:bg-gray-50`}
      >
        {copied ? 'Copied ✓' : 'Copy link'}
      </button>
    </div>
  )
}
