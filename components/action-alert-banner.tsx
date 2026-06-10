'use client'

import { useEffect, useState } from 'react'
import type { ActionAlert } from '@/sanity/lib/queries'
import { ExternalLinkIcon, isExternalHref } from '@/components/external-link'

const URGENCY_STYLES: Record<ActionAlert['urgency'], string> = {
  urgent: 'bg-[var(--color-red)] text-white',
  action: 'bg-[var(--color-gold)] text-[var(--color-navy)]',
  announcement: 'bg-[var(--color-blue)] text-white',
}

const CTA_STYLES: Record<ActionAlert['urgency'], string> = {
  urgent: 'border-white text-white hover:bg-white hover:text-[var(--color-red)]',
  action: 'border-[var(--color-navy)] text-[var(--color-navy)] hover:bg-[var(--color-navy)] hover:text-white',
  announcement: 'border-white text-white hover:bg-white hover:text-[var(--color-blue)]',
}

const CLOSE_STYLES: Record<ActionAlert['urgency'], string> = {
  urgent: 'hover:bg-white/20',
  action: 'hover:bg-black/10',
  announcement: 'hover:bg-white/20',
}

export default function ActionAlertBanner({ alert }: { alert: ActionAlert }) {
  const [dismissed, setDismissed] = useState(true) // start hidden to avoid flash

  useEffect(() => {
    const key = `dismissed-alert-${alert._id}`
    if (!localStorage.getItem(key)) {
      setDismissed(false)
    }
  }, [alert._id])

  if (dismissed) return null

  function dismiss() {
    localStorage.setItem(`dismissed-alert-${alert._id}`, '1')
    setDismissed(true)
  }

  const bg = URGENCY_STYLES[alert.urgency] ?? URGENCY_STYLES.announcement
  const ctaStyle = CTA_STYLES[alert.urgency] ?? CTA_STYLES.announcement
  const closeStyle = CLOSE_STYLES[alert.urgency] ?? CLOSE_STYLES.announcement

  return (
    <div className={`${bg} w-full`} role="alert">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <p className="flex-1 text-sm font-semibold text-center sm:text-left">
          {alert.headline}
        </p>
        <div className="flex items-center gap-2 shrink-0">
          {alert.ctaLabel && alert.ctaUrl && (
            <a
              href={alert.ctaUrl}
              target={isExternalHref(alert.ctaUrl) ? '_blank' : undefined}
              rel={isExternalHref(alert.ctaUrl) ? 'noopener noreferrer' : undefined}
              className={`px-3 py-1 text-xs font-semibold border rounded transition-colors whitespace-nowrap inline-flex items-center gap-1 ${ctaStyle}`}
            >
              {alert.ctaLabel}
              {isExternalHref(alert.ctaUrl) && (
                <>
                  <ExternalLinkIcon className="h-2.5 w-2.5 opacity-80" />
                  <span className="sr-only"> (opens in new tab)</span>
                </>
              )}
            </a>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss alert"
            className={`p-1 rounded transition-colors ${closeStyle}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
