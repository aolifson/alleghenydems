import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Unsubscribed from vote reminders',
  robots: { index: false },
}

type Status = 'ok' | 'invalid' | 'error'

const COPY: Record<Status, { emoji: string; heading: string; body: string }> = {
  ok: {
    emoji: '✅',
    heading: "You've been unsubscribed",
    body: "You won't receive any more vote reminders from us. We're sorry to see you go — your vote still matters!",
  },
  invalid: {
    emoji: '🔗',
    heading: "We couldn't find that subscription",
    body: 'This unsubscribe link is invalid or has already been used. If you keep getting reminders, contact the ACDC office and we’ll remove you.',
  },
  error: {
    emoji: '⚠️',
    heading: 'Something went wrong',
    body: 'We hit a snag updating your subscription. Please try the link again in a moment, or contact the ACDC office.',
  },
}

export default async function UnsubscribedPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>
}) {
  const { status } = await searchParams
  const key: Status = status === 'invalid' ? 'invalid' : status === 'error' ? 'error' : 'ok'
  const { emoji, heading, body } = COPY[key]

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <div className="bg-white rounded-xl border border-[var(--color-border)] shadow-sm p-8 text-center">
        <div className="text-4xl mb-4" aria-hidden="true">
          {emoji}
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-navy)] mb-3">
          {heading}
        </h1>
        <p className="text-[var(--color-text)] mb-6">{body}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[var(--color-blue)] hover:bg-[var(--color-navy)] text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Back to home
        </Link>
      </div>
    </div>
  )
}
