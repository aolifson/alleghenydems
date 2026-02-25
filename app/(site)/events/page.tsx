import type { Metadata } from 'next'
import { getAllEventsForCalendar } from '@/sanity/lib/queries'
import EventsCalendar from '@/components/events-calendar'

export const metadata: Metadata = { title: 'Events' }
export const revalidate = 3600

export default async function EventsPage() {
  const events = await getAllEventsForCalendar()

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Events</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Meetings, canvasses, town halls, and more across Allegheny County.
      </p>
      <EventsCalendar events={events} />
    </div>
  )
}
