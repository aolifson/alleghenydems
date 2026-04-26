'use client'

import Image from 'next/image'
import SocialLinks from '@/components/social-links'
import { urlFor } from '@/sanity/lib/image'
import type { VoterGuideCandidate, VoterGuideDistrict, VoterGuideRace } from '@/sanity/lib/queries'

interface Props {
  race: VoterGuideRace
  districts?: VoterGuideDistrict[]
}

const GENDER_PARITY_NOTE =
  'Number of seats varies by district size. And, members are elected with gender balance in mind: e.g. 3 women and 3 men if there are 6 members.'

function candidateStatusLabel(status?: VoterGuideCandidate['ballotStatus']) {
  if (status === 'alsoAppearing') return 'Also Appearing On Ballot'
  if (status === 'appearing') return 'Appearing On Ballot'
  return null
}

function sortCandidates(candidates: VoterGuideCandidate[]) {
  return [...candidates].sort((a, b) => {
    const aOrder = a.displayOrder ?? 999
    const bOrder = b.displayOrder ?? 999
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })
}

function sortDistricts(districts: VoterGuideDistrict[]) {
  return [...districts].sort((a, b) => {
    const aOrder = a.displayOrder ?? 999
    const bOrder = b.displayOrder ?? 999
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.districtLabel.localeCompare(b.districtLabel)
  })
}

export default function VoterGuideStateCommittee({ race, districts }: Props) {
  const orderedDistricts = sortDistricts(districts ?? race.districts ?? [])

  if (orderedDistricts.length === 0) return null

  return (
    <div>
      <section className="bg-white rounded-lg overflow-visible border border-white/40 shadow-sm">
        <div className="sticky top-0 z-20 bg-[var(--color-navy)] text-white px-6 py-4 rounded-t-lg shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Viewing Race</p>
          <h3 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide">
            {race.officeTitle}
          </h3>
          <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-white/80">
            State Senate Districts
          </p>
        </div>

        <div className="border-b border-[var(--color-border)] bg-white px-6 py-4">
          <p className="text-sm md:text-base text-[var(--color-text)] leading-relaxed max-w-4xl">
            {GENDER_PARITY_NOTE}
          </p>
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

          <div className="px-6 py-6 space-y-8">
            {orderedDistricts.map((district) => (
              <article key={district._key ?? district.districtLabel} className="space-y-3">
                <h4 className="text-xl font-bold text-[var(--color-blue-mid)] uppercase tracking-wide">
                  {district.districtLabel}
                </h4>
                {district.districtDescription && (
                  <p className="text-base text-[var(--color-text)] leading-relaxed">
                    {district.districtDescription}
                  </p>
                )}

                <div
                  className={
                    sortCandidates(district.candidates ?? []).length <= 1
                      ? 'grid grid-cols-1 gap-4'
                      : 'grid grid-cols-1 md:grid-cols-2 gap-4'
                  }
                >
                  {sortCandidates(district.candidates ?? []).map((candidate) => {
                    const status = candidateStatusLabel(candidate.ballotStatus)
                    return (
                      <div
                        key={candidate._key ?? candidate.name}
                        className="rounded-lg border border-[var(--color-border)] p-4 md:p-5 bg-white"
                      >
                        {candidate.endorsedByAcdc && (
                          <div className="mb-3 inline-flex items-center rounded-r-sm bg-[var(--color-navy)] text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
                            Endorsed by ACDC
                          </div>
                        )}
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
                            <h5 className="font-semibold text-[var(--color-navy)]">{candidate.name}</h5>
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
    </div>
  )
}
