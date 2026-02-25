import type { Metadata } from 'next'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import SocialLinks from '@/components/social-links'
import { urlFor } from '@/sanity/lib/image'
import {
  getLatestVoterGuide,
  getVoterGuideBySlug,
  type VoterGuideCandidate,
} from '@/sanity/lib/queries'

export const metadata: Metadata = { title: '2026 Voter Guide' }
export const revalidate = 3600

function candidateStatusLabel(status?: VoterGuideCandidate['ballotStatus']) {
  if (status === 'endorsed') return 'Endorsed'
  if (status === 'alsoAppearing') return 'Also Appearing On Ballot'
  if (status === 'appearing') return 'Appearing On Ballot'
  return null
}

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

        {races.map((race) => (
          <section key={race._key ?? race.officeTitle} className="bg-white rounded-lg overflow-hidden border border-white/40 shadow-sm">
            <div className="bg-[var(--color-navy)] text-white px-6 py-4">
              <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide">{race.officeTitle}</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
              <aside className="bg-[var(--color-blue-light)] px-6 py-5 border-b lg:border-b-0 lg:border-r border-[var(--color-border)]">
                {race.term && (
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wide font-semibold text-[var(--color-text-muted)]">Term</p>
                    <p className="font-semibold text-[var(--color-navy)]">{race.term}</p>
                  </div>
                )}
                {race.annualSalary && (
                  <div className="mb-5">
                    <p className="text-xs uppercase tracking-wide font-semibold text-[var(--color-text-muted)]">Annual Salary</p>
                    <p className="font-semibold text-[var(--color-navy)]">{race.annualSalary}</p>
                  </div>
                )}
                {race.powersAndDuties && race.powersAndDuties.length > 0 && (
                  <div>
                    <p className="text-xs uppercase tracking-wide font-semibold text-[var(--color-text-muted)] mb-2">Powers & Duties</p>
                    <ul className="space-y-1.5 text-sm text-[var(--color-text)]">
                      {race.powersAndDuties.map((duty) => (
                        <li key={duty} className="leading-relaxed">• {duty}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </aside>

              <div className="px-6 py-6 space-y-6">
                {[...(race.districts ?? [])]
                  .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
                  .map((district) => (
                    <article key={district._key ?? district.districtLabel} className="space-y-3">
                      <h3 className="text-xl font-bold text-[var(--color-blue-mid)] uppercase tracking-wide">{district.districtLabel}</h3>
                      {district.districtDescription && (
                        <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                          {district.districtDescription}
                        </p>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[...(district.candidates ?? [])]
                          .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
                          .map((candidate) => {
                            const status = candidateStatusLabel(candidate.ballotStatus)
                            return (
                              <div key={candidate._key ?? candidate.name} className="rounded-lg border border-[var(--color-border)] p-4 bg-white">
                                <div className="flex gap-3">
                                  {candidate.photo ? (
                                    <div className="relative h-20 w-20 shrink-0 rounded overflow-hidden border border-[var(--color-border)]">
                                      <Image
                                        src={urlFor(candidate.photo).width(160).height(160).url()}
                                        alt={candidate.photo.alt ?? candidate.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                  ) : (
                                    <div className="h-20 w-20 shrink-0 rounded bg-[var(--color-blue-light)] border border-[var(--color-border)] flex items-center justify-center font-bold text-[var(--color-blue-mid)]">
                                      {candidate.name.charAt(0)}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <h4 className="font-semibold text-[var(--color-navy)]">{candidate.name}</h4>
                                    {candidate.campaignWebsite && (
                                      <a
                                        href={candidate.campaignWebsite}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm text-[var(--color-blue-mid)] hover:underline break-all"
                                      >
                                        {candidate.campaignWebsite.replace(/^https?:\/\//, '')}
                                      </a>
                                    )}
                                    {status && (
                                      <p className="mt-1 text-xs font-semibold text-[var(--color-red)] uppercase tracking-wide">{status}</p>
                                    )}
                                  </div>
                                </div>

                                {candidate.description && (
                                  <p className="mt-3 text-sm text-[var(--color-text)] leading-relaxed whitespace-pre-line">
                                    {candidate.description}
                                  </p>
                                )}

                                <SocialLinks
                                  className="justify-start mt-3"
                                  facebookUrl={candidate.facebookUrl}
                                  instagramUrl={candidate.instagramUrl}
                                  xUrl={candidate.xUrl}
                                />
                              </div>
                            )
                          })}
                      </div>
                    </article>
                  ))}
              </div>
            </div>
          </section>
        ))}
      </div>
    </main>
  )
}
