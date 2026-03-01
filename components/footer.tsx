import Link from 'next/link'
import Image from 'next/image'
import type { SiteSettings, MunicipalitySettings } from '@/sanity/lib/queries'
import { prefixHref } from '@/lib/prefix-href'

const DEFAULT_FACEBOOK_URL = 'https://www.facebook.com/AlleghenyDems'
const DEFAULT_INSTAGRAM_HANDLE = 'allegheny.dems'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M13.5 8.5V6.8c0-.6.4-1 1-1H16V3h-2c-2.5 0-3.5 1.3-3.5 3.7v1.8H8V12h2.5v9h3V12H16l.5-3.5h-3Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-4 w-4" fill="currentColor">
      <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm4.5 2.8A4.4 4.4 0 1 1 7.6 12 4.4 4.4 0 0 1 12 7.6Zm0 1.8a2.6 2.6 0 1 0 2.6 2.6A2.6 2.6 0 0 0 12 9.4Zm4.8-2.9a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z" />
    </svg>
  )
}

export default function Footer({
  settings,
  basePath = '',
}: {
  settings: SiteSettings | MunicipalitySettings | null
  basePath?: string
}) {
  const year = new Date().getFullYear()
  const facebookUrl = settings?.facebookPageUrl ?? DEFAULT_FACEBOOK_URL
  const instagramHandle = settings?.instagramHandle ?? DEFAULT_INSTAGRAM_HANDLE
  const instagramUrl = `https://www.instagram.com/${instagramHandle}`
  const orgName = ('name' in (settings ?? {})) ? (settings as MunicipalitySettings).name : 'Allegheny County Democratic Committee'

  return (
    <footer className="bg-[var(--color-navy)] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-3 mb-3">
            <Image src="/acdc-seal.png" alt="Logo" width={48} height={48} className="rounded-full" />
            <p className="font-display font-bold text-lg text-[var(--color-gold)]">
              {orgName}
            </p>
          </div>
          <p className="text-sm text-white/70 leading-relaxed">
            {settings?.footerText ?? 'Fighting for working families in Allegheny County.'}
          </p>
          <div className="flex gap-2 mt-4">
            <a
              href={facebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <FacebookIcon />
            </a>
            <a
              href={instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/35 text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            >
              <InstagramIcon />
            </a>
          </div>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-gold)] mb-3">Quick Links</h3>
          <ul className="space-y-1.5 text-sm text-white/70">
            {[
              { label: 'Events', href: '/events' },
              { label: 'News & Updates', href: '/news' },
              { label: 'Committee Members', href: '/committee-members' },
              { label: 'Voter Resources', href: '/vote' },
              { label: 'Run for Office', href: '/run-for-office' },
              { label: 'Contact', href: '/contact' },
            ].map(({ label, href }) => (
              <li key={href}>
                <Link href={prefixHref(href, basePath)} className="hover:text-white transition-colors">{label}</Link>
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
        © {year} {orgName}. Paid for by {orgName}.
      </div>
    </footer>
  )
}
