import Link from 'next/link'
import Image from 'next/image'
import type { Event } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export default function EventCard({ event }: { event: Event }) {
  const date = new Date(event.date)
  const dateStr = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <article className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {event.image && (
        <div className="relative h-40 bg-[var(--color-blue-light)]">
          <Image
            src={urlFor(event.image).width(600).height(300).url()}
            alt={event.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        {/* Date badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold bg-[var(--color-blue-light)] text-[var(--color-blue)] px-2 py-0.5 rounded">
            {dateStr}
          </span>
          <span className="text-xs text-[var(--color-text-muted)]">{timeStr}</span>
        </div>

        <h3 className="font-semibold text-[var(--color-text)] mb-1 leading-snug">{event.title}</h3>

        {event.locationName && (
          <p className="text-sm text-[var(--color-text-muted)] mb-3">📍 {event.locationName}</p>
        )}

        {event.rsvpUrl && (
          <a
            href={event.rsvpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-auto inline-block text-sm font-semibold text-[var(--color-blue-mid)] hover:underline"
          >
            RSVP / Register →
          </a>
        )}
      </div>
    </article>
  )
}
