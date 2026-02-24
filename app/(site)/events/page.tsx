import type { Metadata } from 'next'
import { getUpcomingEvents, getPastEvents, getSiteSettings } from '@/sanity/lib/queries'
import EventCard from '@/components/event-card'

export const metadata: Metadata = { title: 'Events' }
export const revalidate = 3600

export default async function EventsPage() {
  const [settings, upcoming, past] = await Promise.all([
    getSiteSettings(),
    getUpcomingEvents(20),
    getPastEvents(5),
  ])

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Events</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Meetings, canvasses, town halls, and more across Allegheny County.</p>

      {/* Google Calendar embed (if configured) */}
      {settings?.googleCalendarEmbedUrl && (
        <div className="mb-10 rounded-lg overflow-hidden shadow-sm border border-[var(--color-border)]">
          <iframe
            src={settings.googleCalendarEmbedUrl}
            style={{ border: 0 }}
            width="100%"
            height="500"
            title="Allegheny Dems Event Calendar"
          />
        </div>
      )}

      {/* Upcoming */}
      {upcoming.length > 0 ? (
        <section className="mb-12">
          <h2 className="text-xl font-bold text-[var(--color-blue)] mb-4">Upcoming Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcoming.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      ) : (
        <p className="text-[var(--color-text-muted)] py-8">No upcoming events scheduled. Check back soon!</p>
      )}

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="text-xl font-bold text-[var(--color-text-muted)] mb-4">Past Events</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
            {past.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
