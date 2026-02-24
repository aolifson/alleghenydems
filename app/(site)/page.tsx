import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedEvents, getLatestNews, getSiteSettings } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import FacebookFeed from '@/components/facebook-feed'
import InstagramFeed from '@/components/instagram-feed'
import EventCard from '@/components/event-card'
import NewsCard from '@/components/news-card'

export const revalidate = 3600 // ISR: refresh every hour

export default async function HomePage() {
  const [settings, featuredEvents, latestNews] = await Promise.all([
    getSiteSettings(),
    getFeaturedEvents(3),
    getLatestNews(3),
  ])

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[var(--color-navy)] text-white overflow-hidden">
        {settings?.heroImage && (
          <Image
            src={urlFor(settings.heroImage).width(1400).height(500).url()}
            alt="Allegheny County Democrats"
            fill
            className="object-cover opacity-30"
            priority
          />
        )}
        <div className="relative max-w-4xl mx-auto px-4 py-20 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            {settings?.heroHeadline ?? 'Allegheny County Democratic Committee'}
          </h1>
          <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
            {settings?.heroSubtext ?? 'Fighting for working families across Allegheny County. Join us.'}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link href="/get-involved"
              className="px-6 py-3 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white font-semibold rounded transition-colors">
              Get Involved
            </Link>
            <Link href="https://secure.actblue.com" target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 border-2 border-white hover:bg-white hover:text-[var(--color-navy)] text-white font-semibold rounded transition-colors">
              Donate
            </Link>
            <Link href="/vote"
              className="px-6 py-3 bg-[var(--color-gold)] hover:opacity-90 text-[var(--color-navy)] font-semibold rounded transition-colors">
              Voter Resources
            </Link>
          </div>
        </div>
      </section>

      {/* ── Quick Action Boxes ──────────────────────────────────── */}
      <section className="bg-[var(--color-blue-light)] border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Register to Vote', href: 'https://www.pavoterservices.pa.gov/pages/VoterRegistrationApplication.aspx', icon: '🗳️', external: true },
            { label: 'Find Your Polling Place', href: 'https://www.pavoterservices.pa.gov/pages/pollingplaceinfo.aspx', icon: '📍', external: true },
            { label: 'Upcoming Events', href: '/events', icon: '📅', external: false },
            { label: 'Volunteer', href: '/get-involved#volunteer', icon: '🤝', external: false },
          ].map(({ label, href, icon, external }) => (
            <a
              key={href}
              href={href}
              target={external ? '_blank' : undefined}
              rel={external ? 'noopener noreferrer' : undefined}
              className="flex flex-col items-center gap-2 p-4 bg-white rounded-lg shadow-sm hover:shadow-md hover:bg-[var(--color-blue)] hover:text-white transition-all text-center"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-sm font-semibold">{label}</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── Featured Events ──────────────────────────────────────── */}
      {featuredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-[var(--color-blue)]">Upcoming Events</h2>
            <Link href="/events" className="text-sm text-[var(--color-blue-mid)] hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* ── Latest News ──────────────────────────────────────────── */}
      {latestNews.length > 0 && (
        <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-[var(--color-blue)]">News & Updates</h2>
              <Link href="/news" className="text-sm text-[var(--color-blue-mid)] hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestNews.map((post) => (
                <NewsCard key={post._id} post={post} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Social Feeds ─────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="font-display text-2xl font-bold text-[var(--color-blue)] mb-8 text-center">Follow Along</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start justify-items-center">
          {settings?.facebookPageUrl && (
            <div className="w-full max-w-md">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Facebook</h3>
              <FacebookFeed pageUrl={settings.facebookPageUrl} width={400} height={500} />
            </div>
          )}
          <div className="w-full max-w-md">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] mb-3">Instagram</h3>
            <InstagramFeed />
          </div>
        </div>
      </section>
    </>
  )
}
