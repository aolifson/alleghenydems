import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PortableText } from '@portabletext/react'
import { getEventBySlug } from '@/sanity/lib/queries'
import { getMunicipalitySlug, getMunicipalityPrefix } from '@/lib/tenant'

const TZ = 'UTC'

function formatDateTime(iso: string) {
  const date = new Date(iso)
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: TZ,
  })
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: TZ,
  })
  return { datePart, timePart }
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const municipalitySlug = await getMunicipalitySlug()
  const event = await getEventBySlug(slug, municipalitySlug)
  if (!event) return { title: 'Event Not Found' }
  return {
    title: event.title,
    description: event.locationName ? `${event.title} — ${event.locationName}` : event.title,
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { slug } = await params
  const municipalitySlug = await getMunicipalitySlug()
  const basePath = await getMunicipalityPrefix()
  const event = await getEventBySlug(slug, municipalitySlug)
  if (!event) notFound()

  const start = formatDateTime(event.date)
  const end = event.endDate ? formatDateTime(event.endDate) : null

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <Link href={`${basePath}/events`} className="inline-flex items-center text-sm text-[var(--color-blue-mid)] hover:underline mb-6">
        ← Back to Events Calendar
      </Link>

      <article className="bg-white border border-[var(--color-border)] rounded-lg shadow-sm p-6 md:p-8">
        <p className="text-sm font-semibold text-[var(--color-blue-mid)] mb-2">
          {start.datePart}
        </p>
        <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-text)] mb-4">
          {event.title}
        </h1>

        <div className="space-y-1 text-sm text-[var(--color-text-muted)] mb-6">
          <p>
            🕒 {start.timePart}
            {end && ` – ${end.timePart}`}
          </p>
          {event.locationName && (
            <p>
              📍 {event.locationName}
              {event.locationAddress && `, ${event.locationAddress}`}
            </p>
          )}
        </div>

        {event.description && Array.isArray(event.description) && event.description.length > 0 && (
          <div className="prose prose-slate max-w-none">
            <PortableText value={event.description as Parameters<typeof PortableText>[0]['value']} />
          </div>
        )}

        {!event.description || (Array.isArray(event.description) && event.description.length === 0) ? (
          <p className="text-[var(--color-text-muted)]">No additional event details provided.</p>
        ) : null}

        {event.rsvpUrl && (
          <a
            href={event.rsvpUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-sm font-semibold text-white bg-[var(--color-blue-mid)] hover:opacity-90 px-4 py-2 rounded transition-opacity"
          >
            RSVP / Register →
          </a>
        )}
      </article>
    </div>
  )
}
