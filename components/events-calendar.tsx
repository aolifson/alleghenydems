'use client'

import { useState, useMemo, useCallback } from 'react'
import type { Event } from '@/sanity/lib/queries'

type View = 'month' | 'list' | 'day'

// Display times as stored (UTC = treat as America/New_York since import stored local times with Z)
const TZ = 'UTC'

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: TZ,
  })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric', timeZone: TZ,
  })
}

function isoDate(iso: string) {
  // Returns "YYYY-MM-DD" in the stored timezone
  const d = new Date(iso)
  const y = d.getUTCFullYear()
  const m = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function calKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildCalendarGrid(year: number, month: number) {
  const firstDow = new Date(year, month, 1).getDay()
  const lastDate = new Date(year, month + 1, 0).getDate()
  const cells: { date: Date; isCurrentMonth: boolean }[] = []

  for (let i = firstDow - 1; i >= 0; i--) {
    cells.push({ date: new Date(year, month, -i), isCurrentMonth: false })
  }
  for (let d = 1; d <= lastDate; d++) {
    cells.push({ date: new Date(year, month, d), isCurrentMonth: true })
  }
  while (cells.length % 7 !== 0) {
    cells.push({ date: new Date(year, month + 1, cells.length - lastDate - firstDow + 1), isCurrentMonth: false })
  }
  return cells
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']

export default function EventsCalendar({ events }: { events: Event[] }) {
  const today = new Date()
  const [view, setView] = useState<View>('month')
  const [year, setYear] = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')

  // Apply search filter
  const filtered = useMemo(() => {
    if (!query.trim()) return events
    const q = query.toLowerCase()
    return events.filter(e =>
      e.title.toLowerCase().includes(q) ||
      (e.locationName ?? '').toLowerCase().includes(q)
    )
  }, [events, query])

  // Group events by their ISO date string
  const byDay = useMemo(() => {
    const map: Record<string, Event[]> = {}
    for (const ev of filtered) {
      const key = isoDate(ev.date)
      ;(map[key] ??= []).push(ev)
    }
    return map
  }, [filtered])

  const prevMonth = useCallback(() => {
    if (month === 0) { setYear(y => y - 1); setMonth(11) }
    else setMonth(m => m - 1)
  }, [month])

  const nextMonth = useCallback(() => {
    if (month === 11) { setYear(y => y + 1); setMonth(0) }
    else setMonth(m => m + 1)
  }, [month])

  const goToday = () => {
    setYear(today.getFullYear())
    setMonth(today.getMonth())
    setSelectedDay(calKey(today.getFullYear(), today.getMonth(), today.getDate()))
  }

  const todayKey = calKey(today.getFullYear(), today.getMonth(), today.getDate())

  // Events in current month for list view
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthEvents = filtered.filter(e => isoDate(e.date).startsWith(monthPrefix))

  // Events for selected day (day view)
  const dayEvents = selectedDay ? (byDay[selectedDay] ?? []) : []

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    setQuery(search)
    if (search && filtered.length > 0) {
      // Jump to the month of the first result
      const first = filtered.find(ev => {
        const q = search.toLowerCase()
        return ev.title.toLowerCase().includes(q) || (ev.locationName ?? '').toLowerCase().includes(q)
      })
      if (first) {
        const d = new Date(first.date)
        setYear(d.getUTCFullYear())
        setMonth(d.getUTCMonth())
      }
    }
  }

  return (
    <div className="bg-white rounded-lg border border-[var(--color-border)] shadow-sm overflow-hidden">

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-3 items-center px-4 py-3 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <form onSubmit={handleSearch} className="flex flex-1 min-w-[200px] gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={e => {
                setSearch(e.target.value)
                if (!e.target.value) setQuery('')
              }}
              placeholder="Search for events"
              className="w-full pl-9 pr-3 py-2 text-sm border border-[var(--color-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-mid)] focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-[var(--color-blue-mid)] hover:opacity-90 text-white text-sm font-semibold rounded transition-opacity"
          >
            Find Events
          </button>
        </form>

        {/* View tabs */}
        <div className="flex border border-[var(--color-border)] rounded overflow-hidden text-sm">
          {(['list', 'month', 'day'] as View[]).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-4 py-2 font-medium capitalize transition-colors ${
                view === v
                  ? 'bg-[var(--color-blue-mid)] text-white'
                  : 'bg-white text-[var(--color-text)] hover:bg-[var(--color-blue-light)]'
              }`}
            >
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Month / Day navigation header ── */}
      {view !== 'list' && (
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
          <button onClick={prevMonth} className="p-1.5 rounded hover:bg-[var(--color-blue-light)] transition-colors" aria-label="Previous month">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded hover:bg-[var(--color-blue-light)] transition-colors" aria-label="Next month">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <button
            onClick={goToday}
            className="px-3 py-1 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-blue-light)] transition-colors"
          >
            This Month
          </button>
          <h2 className="text-lg font-bold text-[var(--color-text)] ml-1">
            {MONTH_NAMES[month]} {year}
            {view === 'day' && selectedDay && (
              <span className="font-normal text-base ml-2 text-[var(--color-text-muted)]">
                — {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </span>
            )}
          </h2>
        </div>
      )}

      {/* ── Month view ── */}
      {view === 'month' && (
        <div>
          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
            {DOW.map(d => (
              <div key={d} className="py-2 text-center text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 divide-x divide-y divide-[var(--color-border)]">
            {buildCalendarGrid(year, month).map(({ date, isCurrentMonth }, i) => {
              const key = calKey(date.getFullYear(), date.getMonth(), date.getDate())
              const dayEvs = byDay[key] ?? []
              const isToday = key === todayKey
              const isSelected = key === selectedDay

              return (
                <div
                  key={i}
                  onClick={() => { setSelectedDay(key); setView('day') }}
                  className={`min-h-[90px] p-1.5 cursor-pointer transition-colors hover:bg-[var(--color-blue-light)] ${
                    !isCurrentMonth ? 'bg-gray-50/50' : ''
                  } ${isSelected ? 'ring-2 ring-inset ring-[var(--color-blue-mid)]' : ''}`}
                >
                  <span className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full mb-1 font-medium ${
                    isToday
                      ? 'bg-[var(--color-red)] text-white'
                      : isCurrentMonth
                        ? 'text-[var(--color-text)]'
                        : 'text-[var(--color-text-muted)]'
                  }`}>
                    {date.getDate()}
                  </span>

                  <div className="space-y-0.5">
                    {dayEvs.slice(0, 3).map(ev => (
                      <div
                        key={ev._id}
                        className="text-xs leading-tight px-1 py-0.5 rounded bg-[var(--color-blue-mid)]/10 text-[var(--color-blue)] truncate"
                        title={ev.title}
                      >
                        <span className="text-[10px] text-[var(--color-text-muted)] mr-1">{fmtTime(ev.date)}</span>
                        {ev.title}
                      </div>
                    ))}
                    {dayEvs.length > 3 && (
                      <div className="text-[10px] text-[var(--color-text-muted)] px-1">
                        +{dayEvs.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div>
          {/* List nav header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-[var(--color-border)]">
            <button onClick={prevMonth} className="p-1.5 rounded hover:bg-[var(--color-blue-light)] transition-colors" aria-label="Previous month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button onClick={nextMonth} className="p-1.5 rounded hover:bg-[var(--color-blue-light)] transition-colors" aria-label="Next month">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button onClick={goToday} className="px-3 py-1 text-sm border border-[var(--color-border)] rounded hover:bg-[var(--color-blue-light)] transition-colors">
              This Month
            </button>
            <h2 className="text-lg font-bold text-[var(--color-text)] ml-1">
              {MONTH_NAMES[month]} {year}
            </h2>
          </div>

          {monthEvents.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm px-6 py-10 text-center">
              {query ? `No events matching "${query}" this month.` : 'No events this month.'}
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {Object.entries(
                monthEvents.reduce<Record<string, Event[]>>((acc, ev) => {
                  const k = isoDate(ev.date)
                  ;(acc[k] ??= []).push(ev)
                  return acc
                }, {})
              ).map(([day, dayEvs]) => (
                <div key={day} className="flex">
                  {/* Date column */}
                  <div className="w-28 shrink-0 px-4 py-4 border-r border-[var(--color-border)]">
                    <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase">
                      {new Date(day + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short' })}
                    </p>
                    <p className="text-2xl font-bold text-[var(--color-text)]">
                      {new Date(day + 'T12:00:00').getDate()}
                    </p>
                  </div>

                  {/* Events column */}
                  <div className="flex-1 divide-y divide-[var(--color-border)]">
                    {dayEvs.map(ev => (
                      <div key={ev._id} className="px-4 py-3">
                        <p className="text-xs text-[var(--color-text-muted)] mb-1">
                          {fmtTime(ev.date)}
                          {ev.endDate && ` – ${fmtTime(ev.endDate)}`}
                        </p>
                        <p className="font-semibold text-[var(--color-text)] text-sm leading-snug">{ev.title}</p>
                        {ev.locationName && (
                          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">📍 {ev.locationName}</p>
                        )}
                        {ev.rsvpUrl && (
                          <a href={ev.rsvpUrl} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-[var(--color-blue-mid)] hover:underline mt-1 inline-block">
                            RSVP →
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Day view ── */}
      {view === 'day' && (
        <div>
          {/* Day picker strip */}
          <DayStrip year={year} month={month} byDay={byDay} selectedDay={selectedDay} onSelect={setSelectedDay} />

          {dayEvents.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-sm px-6 py-10 text-center">
              {selectedDay
                ? 'No events on this day.'
                : 'Select a day above to see events.'}
            </p>
          ) : (
            <div className="divide-y divide-[var(--color-border)]">
              {dayEvents.map(ev => (
                <div key={ev._id} className="px-6 py-4">
                  <p className="text-sm font-semibold text-[var(--color-blue-mid)] mb-1">
                    {fmtTime(ev.date)}
                    {ev.endDate && ` – ${fmtTime(ev.endDate)}`}
                  </p>
                  <p className="font-bold text-[var(--color-text)] mb-1">{ev.title}</p>
                  {ev.locationName && (
                    <p className="text-sm text-[var(--color-text-muted)]">
                      📍 {ev.locationName}
                      {ev.locationAddress && `, ${ev.locationAddress}`}
                    </p>
                  )}
                  {ev.rsvpUrl && (
                    <a href={ev.rsvpUrl} target="_blank" rel="noopener noreferrer"
                      className="mt-2 inline-block text-sm font-semibold text-white bg-[var(--color-blue-mid)] hover:opacity-90 px-3 py-1.5 rounded transition-opacity">
                      RSVP / Register →
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Day strip sub-component ───────────────────────────────────────────────────
function DayStrip({
  year, month, byDay, selectedDay, onSelect,
}: {
  year: number
  month: number
  byDay: Record<string, Event[]>
  selectedDay: string | null
  onSelect: (key: string) => void
}) {
  const lastDate = new Date(year, month + 1, 0).getDate()
  const days = Array.from({ length: lastDate }, (_, i) => i + 1)

  return (
    <div className="flex overflow-x-auto border-b border-[var(--color-border)] bg-[var(--color-bg)]">
      {days.map(d => {
        const key = calKey(year, month, d)
        const hasEvents = !!(byDay[key]?.length)
        const isSelected = key === selectedDay
        return (
          <button
            key={d}
            onClick={() => onSelect(key)}
            className={`flex flex-col items-center shrink-0 w-12 py-2 text-xs border-r border-[var(--color-border)] transition-colors ${
              isSelected
                ? 'bg-[var(--color-blue-mid)] text-white'
                : 'hover:bg-[var(--color-blue-light)]'
            }`}
          >
            <span className="font-medium">{new Date(year, month, d).toLocaleDateString('en-US', { weekday: 'short' })}</span>
            <span className="font-bold text-sm">{d}</span>
            {hasEvents && (
              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[var(--color-blue-mid)]'}`} />
            )}
          </button>
        )
      })}
    </div>
  )
}
