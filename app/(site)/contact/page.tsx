import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'
import { getPageBySlug, getSiteSettings } from '@/sanity/lib/queries'
import ContactForm from '@/components/contact-form'

export const metadata: Metadata = { title: 'Contact' }
export const revalidate = 86400

export default async function ContactPage() {
  const [settings, page] = await Promise.all([
    getSiteSettings(),
    getPageBySlug('contact'),
  ])
  const headline = page?.heroHeadline ?? page?.title ?? 'Contact Us'
  const subhead = page?.heroImage
    ? (page?.heroSubhead ?? 'Get in touch with the Allegheny County Democratic Committee.')
    : undefined
  const body = stripDuplicatedHeroBlocks(page?.body, headline, subhead)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <PageHero headline={headline} subhead={subhead} image={page?.heroImage} />

      {body && (
        <div className="prose-content mb-8 max-w-3xl">
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl">
        {/* Contact Info */}
        <div>
          <h2 className="font-semibold text-[var(--color-blue)] mb-4">Office Information</h2>
          <div className="space-y-3 text-sm">
            {settings?.address && (
              <div className="flex gap-2">
                <span>📍</span>
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-[var(--color-text-muted)] whitespace-pre-line">{settings.address}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(settings.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-blue-mid)] hover:underline"
                  >
                    Get directions ↗
                  </a>
                </div>
              </div>
            )}
            {settings?.contactPhone && (
              <div className="flex gap-2">
                <span>📞</span>
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${settings.contactPhone}`} className="text-[var(--color-blue-mid)] hover:underline">
                    {settings.contactPhone}
                  </a>
                </div>
              </div>
            )}
            {settings?.contactEmail && (
              <div className="flex gap-2">
                <span>✉️</span>
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${settings.contactEmail}`} className="text-[var(--color-blue-mid)] hover:underline">
                    {settings.contactEmail}
                  </a>
                </div>
              </div>
            )}
            {settings?.officeHours && (
              <div className="flex gap-2">
                <span>🕐</span>
                <div>
                  <p className="font-medium">Office Hours</p>
                  <p className="text-[var(--color-text-muted)]">{settings.officeHours}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="font-semibold text-[var(--color-blue)] mb-4">Send a Message</h2>
          <ContactForm />
        </div>
      </div>
    </div>
  )
}
