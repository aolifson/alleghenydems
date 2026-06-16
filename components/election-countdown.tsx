'use client'

import { useEffect, useState } from 'react'
import { ELECTION, daysUntilElection } from '@/lib/election'

// Computed on the client so the day count reflects the visitor's "today"
// rather than the build time / server timezone.
export default function ElectionCountdown() {
  const [days, setDays] = useState<number | null>(null)

  useEffect(() => {
    setDays(daysUntilElection())
  }, [])

  let message: string
  if (days === null) {
    message = `${ELECTION.dateLabel}`
  } else if (days > 1) {
    message = `${days} days until the ${ELECTION.name}`
  } else if (days === 1) {
    message = 'Election Day is tomorrow'
  } else if (days === 0) {
    message = `Today is Election Day — polls are open ${ELECTION.pollHours}`
  } else {
    message = `The ${ELECTION.name} has passed`
  }

  return (
    <div className="inline-flex flex-col items-center gap-1 rounded-xl bg-white/10 px-6 py-4 backdrop-blur-sm">
      {days !== null && days >= 0 && (
        <span className="font-display text-4xl md:text-5xl font-bold leading-none text-[var(--color-gold)]">
          {days}
        </span>
      )}
      <span className="text-sm md:text-base font-semibold text-white/90 text-center">{message}</span>
      <span className="text-xs text-white/60">{ELECTION.dateLabel} · Polls {ELECTION.pollHours}</span>
    </div>
  )
}
