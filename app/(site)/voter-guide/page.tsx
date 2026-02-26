import type { Metadata } from 'next'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import VoterGuideDistrictLookup from '@/components/voter-guide-district-lookup'
import {
  getLatestVoterGuide,
  getVoterGuideBySlug,
} from '@/sanity/lib/queries'

export const metadata: Metadata = { title: '2026 Voter Guide' }
export const revalidate = 3600

export default async function VoterGuidePage() {
  const guide = (await getVoterGuideBySlug('voter-guide-2026')) ?? (await getLatestVoterGuide())

  if (!guide) {
    return (
      <main className="max-w-4xl mx-auto px-4 py-10">
        <h1 className="font-display text-4xl font-bold text-[var(--color-blue)] mb-2">Voter Guide</h1>
        <p className="text-[var(--color-text-muted)]">
          The voter guide has not been imported yet.
        </p>
      </main>
    )
  }

  const races = [...(guide.races ?? [])].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))

  return (
    <main className="bg-[var(--color-blue-mid)] py-10">
      <div className="max-w-6xl mx-auto px-4 space-y-8">
        <section className="bg-white/95 border border-white/50 rounded-lg p-6 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 items-center">
          <div>
            <p className="text-sm font-semibold text-[var(--color-blue-mid)] tracking-wide uppercase">Allegheny County Democratic Committee</p>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-[var(--color-navy)] mt-2">
              {guide.heroHeadline ?? guide.title}
            </h1>
            {guide.heroSubhead && (
              <p className="text-lg text-[var(--color-text-muted)] mt-4 max-w-3xl">{guide.heroSubhead}</p>
            )}
            {guide.electionDate && (
              <p className="text-sm text-[var(--color-text-muted)] mt-3">
                Election date: {guide.electionDate}
              </p>
            )}
          </div>
          <Image
            src="/acdc-seal.png"
            alt="Allegheny County Democratic Committee Seal"
            width={160}
            height={160}
            className="mx-auto md:mx-0"
            priority
          />
        </section>

        {guide.intro && guide.intro.length > 0 && (
          <section className="bg-white/95 border border-white/50 rounded-lg p-6 md:p-8 prose-content">
            <PortableText value={guide.intro as Parameters<typeof PortableText>[0]['value']} />
          </section>
        )}

        <VoterGuideDistrictLookup races={races} />
      </div>
    </main>
  )
}
