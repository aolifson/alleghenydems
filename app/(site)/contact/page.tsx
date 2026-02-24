import type { Metadata } from 'next'
import { getSiteSettings } from '@/sanity/lib/queries'
import ContactForm from '@/components/contact-form'

export const metadata: Metadata = { title: 'Contact' }
export const revalidate = 86400

export default async function ContactPage() {
  const settings = await getSiteSettings()

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Contact Us</h1>
      <p className="text-[var(--color-text-muted)] mb-8">Get in touch with the Allegheny County Democratic Committee.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
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
