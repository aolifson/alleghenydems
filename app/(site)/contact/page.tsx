import type { Metadata } from 'next'
import { PortableText } from '@portabletext/react'
import PageHero from '@/components/page-hero'
import { portableTextComponents } from '@/components/portable-text-components'
import { stripDuplicatedHeroBlocks } from '@/sanity/lib/pageBody'
import { getPageBySlug, getSiteSettings, getMunicipalitySettings } from '@/sanity/lib/queries'
import { getMunicipalitySlug } from '@/lib/tenant'

export const metadata: Metadata = { title: 'Contact' }
export const revalidate = 86400

export default async function ContactPage() {
  const municipalitySlug = await getMunicipalitySlug()
  const isCounty = municipalitySlug === 'allegheny-county'
  const [settings, municipalitySettings, page] = await Promise.all([
    getSiteSettings(),
    isCounty ? Promise.resolve(null) : getMunicipalitySettings(municipalitySlug),
    getPageBySlug('contact', municipalitySlug),
  ])
  // Committee sites show their own contact info where set, falling back to
  // the county's — office hours aren't tracked per-municipality, so that
  // always comes from county settings.
  const contactInfo = {
    address: municipalitySettings?.address ?? settings?.address,
    contactPhone: municipalitySettings?.contactPhone ?? settings?.contactPhone,
    contactEmail: municipalitySettings?.contactEmail ?? settings?.contactEmail,
    officeHours: settings?.officeHours,
  }
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
          <PortableText value={body as Parameters<typeof PortableText>[0]['value']} components={portableTextComponents} />
        </div>
      )}

      <div className="max-w-3xl">
        {/* Contact Info */}
        <div>
          <h2 className="font-semibold text-[var(--color-blue)] mb-4">Office Information</h2>
          <div className="space-y-3 text-sm">
            {contactInfo.address && (
              <div className="flex gap-2">
                <span>📍</span>
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-[var(--color-text-muted)] whitespace-pre-line">{contactInfo.address}</p>
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(contactInfo.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[var(--color-blue-mid)] hover:underline"
                  >
                    Get directions ↗
                  </a>
                </div>
              </div>
            )}
            {contactInfo.contactPhone && (
              <div className="flex gap-2">
                <span>📞</span>
                <div>
                  <p className="font-medium">Phone</p>
                  <a href={`tel:${contactInfo.contactPhone}`} className="text-[var(--color-blue-mid)] hover:underline">
                    {contactInfo.contactPhone}
                  </a>
                </div>
              </div>
            )}
            {contactInfo.contactEmail && (
              <div className="flex gap-2">
                <span>✉️</span>
                <div>
                  <p className="font-medium">Email</p>
                  <a href={`mailto:${contactInfo.contactEmail}`} className="text-[var(--color-blue-mid)] hover:underline">
                    {contactInfo.contactEmail}
                  </a>
                </div>
              </div>
            )}
            {contactInfo.officeHours && (
              <div className="flex gap-2">
                <span>🕐</span>
                <div>
                  <p className="font-medium">Office Hours</p>
                  <p className="text-[var(--color-text-muted)]">{contactInfo.officeHours}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
