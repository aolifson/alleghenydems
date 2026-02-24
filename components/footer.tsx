import Link from 'next/link'
import type { SiteSettings } from '@/sanity/lib/queries'

export default function Footer({ settings }: { settings: SiteSettings | null }) {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-[var(--color-navy)] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <p className="font-display font-bold text-lg mb-2 text-[var(--color-gold)]">
            Allegheny County Democratic Committee
          </p>
          <p className="text-sm text-white/70 leading-relaxed">
            {settings?.footerText ?? 'Fighting for working families in Allegheny County.'}
          </p>
          <div className="flex gap-3 mt-4">
            {settings?.facebookPageUrl && (
              <a href={settings.facebookPageUrl} target="_blank" rel="noopener noreferrer"
                className="text-white/70 hover:text-white text-sm">
                Facebook
              </a>
            )}
            {settings?.instagramHandle && (
              <a href={`https://instagram.com/${settings.instagramHandle}`} target="_blank" rel="noopener noreferrer"
                className="text-white/70 hover:text-white text-sm">
                Instagram
              </a>
            )}
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)] mb-3">Quick Links</h3>
          <ul className="space-y-1.5 text-sm text-white/70">
            {[
              { label: 'Events', href: '/events' },
              { label: 'News & Updates', href: '/news' },
              { label: 'Committee Members', href: '/committee' },
              { label: 'Voter Resources', href: '/vote' },
              { label: 'Run for Office', href: '/run-for-office' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link href={href} className="hover:text-white transition-colors">{label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)] mb-3">Contact Us</h3>
          <address className="not-italic text-sm text-white/70 space-y-1">
            {settings?.address && <p>{settings.address}</p>}
            {settings?.contactPhone && (
              <p><a href={`tel:${settings.contactPhone}`} className="hover:text-white">{settings.contactPhone}</a></p>
            )}
            {settings?.contactEmail && (
              <p><a href={`mailto:${settings.contactEmail}`} className="hover:text-white">{settings.contactEmail}</a></p>
            )}
            {settings?.officeHours && <p className="mt-2">{settings.officeHours}</p>}
          </address>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-white/40">
        © {year} Allegheny County Democratic Committee. Paid for by the Allegheny County Democratic Committee.
      </div>
    </footer>
  )
}
