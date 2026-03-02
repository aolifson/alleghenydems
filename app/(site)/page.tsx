import Link from 'next/link'
import Image from 'next/image'
import { getFeaturedEvents, getLatestNews, getFeaturedNews, getSiteSettings, getMunicipalitySettings, getActiveActionAlerts } from '@/sanity/lib/queries'
import type { MunicipalitySettings } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'
import { fetchFacebookPosts } from '@/lib/facebook'
import FacebookLiveFeed from '@/components/facebook-live-feed'
import EventCard from '@/components/event-card'
import NewsCard from '@/components/news-card'
import { getMunicipalitySlug, getMunicipalityPrefix } from '@/lib/tenant'
import { prefixHref } from '@/lib/prefix-href'

export const revalidate = 300 // ISR: refresh every 5 minutes (for action alerts)

export default async function HomePage() {
  const municipalitySlug = await getMunicipalitySlug()
  const basePath = await getMunicipalityPrefix()
  const isCounty = municipalitySlug === 'allegheny-county'

  const facebookPromise = isCounty
    ? fetchFacebookPosts({ limit: 3 }).catch((error) => {
        console.error('Facebook feed fetch failed:', error)
        return null
      })
    : Promise.resolve(null)

  const [settings, featuredEvents, featuredNews, latestNews, facebook, activeAlerts] = await Promise.all([
    isCounty ? getSiteSettings() : getMunicipalitySettings(municipalitySlug),
    getFeaturedEvents(3, municipalitySlug),
    getFeaturedNews(3, municipalitySlug),
    getLatestNews(3, municipalitySlug),
    facebookPromise,
    getActiveActionAlerts(municipalitySlug),
  ])
  const displayNews = featuredNews.length > 0 ? featuredNews : latestNews
  const facebookPageUrl = settings?.facebookPageUrl ?? 'https://www.facebook.com/AlleghenyDems/'
  const heroLogoUrl = !isCounty && (settings as MunicipalitySettings)?.logo
    ? urlFor((settings as MunicipalitySettings).logo!).width(320).height(320).url()
    : null

  return (
    <>
      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative bg-[var(--color-navy)] text-white overflow-hidden">
        {settings?.heroImage && (
          <Image
            src={urlFor(settings.heroImage).width(1400).height(500).url()}
            alt="Allegheny County Democrats"
            fill
            className="object-cover opacity-20"
            priority
          />
        )}
        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-10 grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6 md:gap-8 items-center">
          <div className="text-center lg:text-left">
            <h1 className="font-display text-3xl md:text-5xl font-bold mb-3 leading-tight">
              {settings?.heroHeadline ?? 'Allegheny County Democratic Committee'}
            </h1>
            <p className="text-base md:text-xl text-white/80 mb-6 max-w-2xl mx-auto lg:mx-0">
              {settings?.heroSubtext ?? 'Fighting for working families across Allegheny County. Join us.'}
            </p>
            <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
              <Link href={prefixHref('/get-involved', basePath)}
                className="px-5 py-2.5 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white font-semibold rounded transition-colors">
                Get Involved
              </Link>
              <Link href="https://secure.actblue.com" target="_blank" rel="noopener noreferrer"
                className="px-5 py-2.5 border-2 border-white hover:bg-white hover:text-[var(--color-navy)] text-white font-semibold rounded transition-colors">
                Donate
              </Link>
              <Link href={prefixHref('/vote', basePath)}
                className="px-5 py-2.5 bg-[var(--color-gold)] hover:opacity-90 text-[var(--color-navy)] font-semibold rounded transition-colors">
                Voter Resources
              </Link>
            </div>
          </div>

          <div className="hidden lg:flex justify-end">
            <Image
              src={heroLogoUrl ?? '/acdc-seal.png'}
              alt={heroLogoUrl ? ((settings as MunicipalitySettings)?.name ?? 'Municipality Logo') : 'Allegheny County Democratic Committee Seal'}
              width={320}
              height={320}
              className="drop-shadow-2xl"
              priority
            />
          </div>
        </div>
      </section>

      {/* ── Facebook Feed ────────────────────────────────────── */}
      <section className="bg-[var(--color-navy)] border-t border-white/10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-10 flex justify-center">
          <div className="w-full max-w-6xl">
            <h2 className="font-display text-3xl font-bold text-white mb-5 text-center">Follow Us on Facebook</h2>
            <FacebookLiveFeed
              pageUrl={facebookPageUrl}
              initialPosts={facebook?.posts ?? []}
              initialCursor={facebook?.nextCursor}
            />
          </div>
        </div>
      </section>

      {/* ── Quick Action Boxes ──────────────────────────────────── */}
      <section className="bg-[var(--color-navy)] border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Register to Vote', href: 'https://www.pavoterservices.pa.gov/pages/VoterRegistrationApplication.aspx', icon: '🗳️', external: true },
            { label: 'Find Your Polling Place', href: 'https://www.pavoterservices.pa.gov/pages/pollingplaceinfo.aspx', icon: '📍', external: true },
            { label: 'Upcoming Events', href: prefixHref('/events', basePath), icon: '📅', external: false },
            { label: 'Volunteer', href: prefixHref('/get-involved#volunteer', basePath), icon: '🤝', external: false },
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

      {/* ── Take Action ──────────────────────────────────────────── */}
      {activeAlerts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <h2 className="font-display text-2xl font-bold text-[var(--color-blue)] mb-6">Take Action</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeAlerts.map((alert) => {
              const borderColor =
                alert.urgency === 'urgent'
                  ? 'border-[var(--color-red)]'
                  : alert.urgency === 'action'
                  ? 'border-[var(--color-gold)]'
                  : 'border-[var(--color-blue)]'
              const badgeColor =
                alert.urgency === 'urgent'
                  ? 'bg-[var(--color-red)] text-white'
                  : alert.urgency === 'action'
                  ? 'bg-[var(--color-gold)] text-[var(--color-navy)]'
                  : 'bg-[var(--color-blue)] text-white'
              const badgeLabel =
                alert.urgency === 'urgent' ? 'Urgent' : alert.urgency === 'action' ? 'Take Action' : 'Announcement'
              const ctaColor =
                alert.urgency === 'urgent'
                  ? 'bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white'
                  : alert.urgency === 'action'
                  ? 'bg-[var(--color-gold)] hover:opacity-90 text-[var(--color-navy)]'
                  : 'bg-[var(--color-blue)] hover:opacity-90 text-white'

              return (
                <div
                  key={alert._id}
                  className={`bg-white rounded-lg shadow-sm border-l-4 ${borderColor} p-5 flex flex-col gap-3`}
                >
                  <span className={`self-start text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded ${badgeColor}`}>
                    {badgeLabel}
                  </span>
                  <p className="font-semibold text-[var(--color-blue)] leading-snug">{alert.headline}</p>
                  {alert.ctaLabel && alert.ctaUrl && (
                    <a
                      href={alert.ctaUrl}
                      target={alert.ctaUrl.startsWith('/') ? undefined : '_blank'}
                      rel={alert.ctaUrl.startsWith('/') ? undefined : 'noopener noreferrer'}
                      className={`mt-auto self-start px-4 py-2 text-sm font-semibold rounded transition-colors ${ctaColor}`}
                    >
                      {alert.ctaLabel}
                    </a>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* ── Featured Events ──────────────────────────────────────── */}
      {featuredEvents.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-2xl font-bold text-[var(--color-blue)]">Upcoming Events</h2>
            <Link href={prefixHref('/events', basePath)} className="text-sm text-[var(--color-blue-mid)] hover:underline">View all →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredEvents.map((event) => (
              <EventCard key={event._id} event={event} />
            ))}
          </div>
        </section>
      )}

      {/* ── Latest News ──────────────────────────────────────────── */}
      {displayNews.length > 0 && (
        <section className="bg-[var(--color-surface)] border-y border-[var(--color-border)]">
          <div className="max-w-7xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-2xl font-bold text-[var(--color-blue)]">News & Updates</h2>
              <Link href={prefixHref('/news', basePath)} className="text-sm text-[var(--color-blue-mid)] hover:underline">View all →</Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {displayNews.map((post) => (
                <NewsCard key={post._id} post={post} basePath={basePath} />
              ))}
            </div>
          </div>
        </section>
      )}

    </>
  )
}
