'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import SocialLinks from '@/components/social-links'
import { urlFor } from '@/sanity/lib/image'
import type { VoterGuideCandidate, VoterGuideDistrict, VoterGuideRace } from '@/sanity/lib/queries'

interface LookupResult {
  district: VoterGuideDistrict
  score: number
}

interface Props {
  races: VoterGuideRace[]
}

const TARGET_RACE_TITLES = [
  'Representative in Congress',
  'Senator in the General Assembly',
  'Representative in the General Assembly',
]

function candidateStatusLabel(status?: VoterGuideCandidate['ballotStatus']) {
  if (status === 'alsoAppearing') return 'Also Appearing On Ballot'
  if (status === 'appearing') return 'Appearing On Ballot'
  return null
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function deriveSearchTerms(district: VoterGuideDistrict): string[] {
  const terms = new Set<string>()
  const add = (value?: string) => {
    if (!value) return
    const cleaned = value.trim()
    if (cleaned.length >= 2) terms.add(cleaned)
  }

  add(district.districtLabel)
  for (const term of district.searchTerms ?? []) add(term)

  const description = district.districtDescription ?? ''
  if (description) {
    const normalizedDescription = description
      .replace(/\(Allegheny County Portion\)/gi, '')
      .replace(/Pittsburgh neighborhoods of/gi, '')
      .replace(/ and Pittsburgh neighborhoods of/gi, ',')
      .replace(/\b(and|a)\s+part(s)?\s+of\b/gi, ',')
      .replace(/\bportion(s)?\s+of\b/gi, ',')

    for (const part of normalizedDescription.split(/,| and /gi)) {
      const cleaned = part.replace(/\s+/g, ' ').trim().replace(/\.$/, '')
      if (!cleaned) continue
      add(cleaned)
      add(cleaned.replace(/\b(Township|Borough|Neighborhoods?)\b/gi, '').replace(/\s+/g, ' ').trim())
    }
  }

  return Array.from(terms)
}

function scoreDistrictByText(query: string, district: VoterGuideDistrict) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return 0

  const terms = deriveSearchTerms(district)
  let best = 0

  for (const term of terms) {
    const normalizedTerm = normalize(term)
    if (!normalizedTerm) continue

    if (normalizedTerm === normalizedQuery) {
      best = Math.max(best, 120)
      continue
    }
    if (normalizedTerm.startsWith(normalizedQuery)) {
      best = Math.max(best, 95)
    } else if (normalizedTerm.includes(normalizedQuery)) {
      best = Math.max(best, 80)
    } else if (normalizedQuery.includes(normalizedTerm) && normalizedTerm.length >= 4) {
      best = Math.max(best, 60)
    }
  }

  const label = normalize(district.districtLabel)
  if (label === normalizedQuery) best = Math.max(best, 110)
  if (label.includes(normalizedQuery)) best = Math.max(best, 70)

  const description = normalize(district.districtDescription ?? '')
  if (description.includes(normalizedQuery)) best = Math.max(best, 50)

  const districtNumber = (district.districtLabel.match(/\d+/)?.[0] ?? '').trim()
  if (districtNumber && normalizedQuery === districtNumber) best = Math.max(best, 110)
  if (districtNumber && normalizedQuery === `district ${districtNumber}`) best = Math.max(best, 120)

  return best
}

function matchRace(query: string, race: VoterGuideRace): LookupResult[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const zip = trimmed.match(/^\d{5}$/)?.[0]
  if (zip) {
    return (race.districts ?? [])
      .map((district) => {
        const zipMatches = (district.zipCodes ?? []).map((code) => code.trim()).includes(zip)
        return { district, score: zipMatches ? 200 : 0 }
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score || (a.district.displayOrder ?? 999) - (b.district.displayOrder ?? 999))
  }

  const ranked = (race.districts ?? [])
    .map((district) => ({ district, score: scoreDistrictByText(trimmed, district) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.district.displayOrder ?? 999) - (b.district.displayOrder ?? 999))

  const topScore = ranked[0]?.score ?? 0
  const threshold = Math.max(60, topScore - 20)
  return ranked.filter((item) => item.score >= threshold).slice(0, 4)
}

function sortCandidates(candidates: VoterGuideCandidate[]) {
  return [...candidates].sort((a, b) => {
    const aOrder = a.displayOrder ?? 999
    const bOrder = b.displayOrder ?? 999
    if (aOrder !== bOrder) return aOrder - bOrder
    return a.name.localeCompare(b.name)
  })
}

function isStatewideRace(race: VoterGuideRace) {
  const districts = race.districts ?? []
  if (districts.length === 0) return false
  return districts.every((district) => normalize(district.districtLabel) === 'statewide')
}

function RaceSection({ race, districts }: { race: VoterGuideRace; districts: VoterGuideDistrict[] }) {
  const orderedDistricts = [...districts].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))

  return (
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
          {orderedDistricts.map((district) => (
            <article key={district._key ?? district.districtLabel} className="space-y-3">
              <h3 className="text-xl font-bold text-[var(--color-blue-mid)] uppercase tracking-wide">{district.districtLabel}</h3>
              {district.districtDescription && (
                <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                  {district.districtDescription}
                </p>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sortCandidates(district.candidates ?? []).map((candidate) => {
                  const status = candidateStatusLabel(candidate.ballotStatus)
                  return (
                    <div key={candidate._key ?? candidate.name} className="rounded-lg border border-[var(--color-border)] p-4 bg-white">
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
  )
}

export default function VoterGuideDistrictLookup({ races }: Props) {
  const [query, setQuery] = useState('')

  const orderedRaces = useMemo(
    () => [...races].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)),
    [races]
  )

  const districtRaces = useMemo(() => {
    const byTitle = new Map(races.map((race) => [race.officeTitle, race]))
    return TARGET_RACE_TITLES.map((title) => byTitle.get(title)).filter((race): race is VoterGuideRace => Boolean(race))
  }, [races])

  const statewideRaces = useMemo(
    () =>
      orderedRaces.filter(
        (race) => !TARGET_RACE_TITLES.includes(race.officeTitle) && isStatewideRace(race)
      ),
    [orderedRaces]
  )

  const matchResults = useMemo(
    () =>
      districtRaces.map((race) => ({
        raceTitle: race.officeTitle,
        race,
        matches: matchRace(query, race),
      })),
    [districtRaces, query]
  )

  const hasQuery = query.trim().length > 0
  const hasAnyDistrictMatch = matchResults.some((race) => race.matches.length > 0)
  const zipQuery = query.trim().match(/^\d{5}$/)?.[0]
  const zipMatchSummary = useMemo(() => {
    if (!zipQuery) return []
    return matchResults.flatMap((result) =>
      result.matches.map((match) => `${result.race.officeTitle}: ${match.district.districtLabel}`)
    )
  }, [matchResults, zipQuery])

  const racesToRender = useMemo(() => {
    if (!hasQuery) {
      return orderedRaces.map((race) => ({ race, districts: race.districts ?? [] }))
    }

    const filteredDistrictRaces = matchResults
      .filter((result) => result.matches.length > 0)
      .map((result) => ({
        race: result.race,
        districts: result.matches.map((match) => match.district),
      }))

    const alwaysVisibleStatewide = statewideRaces.map((race) => ({
      race,
      districts: race.districts ?? [],
    }))

    return [...filteredDistrictRaces, ...alwaysVisibleStatewide]
  }, [hasQuery, orderedRaces, matchResults, statewideRaces])

  return (
    <div className="space-y-8">
      <section className="bg-white/95 border border-white/50 rounded-lg p-6 md:p-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-navy)]">
          Find Your Representatives
        </h2>
        <p className="mt-2 text-sm text-[var(--color-text-muted)] max-w-3xl">
          Search by municipality, neighborhood, district name/number, or ZIP code to filter down to your Congressional, State Senate, and State House races.
        </p>

        <div className="mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. Mt Lebanon, Squirrel Hill, District 42, 15217"
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-mid)]"
            aria-label="Search district by name or ZIP code"
          />
          {hasQuery && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-blue-light)]"
            >
              Clear
            </button>
          )}
        </div>

        {zipQuery && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            ZIP results come from district ZIP mappings in Sanity. If a ZIP returns no district matches, add it under the district&apos;s `ZIP Codes` field.
          </p>
        )}
        {zipQuery && hasAnyDistrictMatch && (
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">
            ZIP {zipQuery} matched {zipMatchSummary.length} district race{zipMatchSummary.length === 1 ? '' : 's'}: {zipMatchSummary.join(' · ')}.
          </p>
        )}

        {hasQuery && (
          <p className="mt-3 text-sm text-[var(--color-text-muted)]">
            Showing matched district races first, followed by statewide offices.
          </p>
        )}
      </section>

      {hasQuery && !hasAnyDistrictMatch && (
        <section className="bg-white/95 border border-white/50 rounded-lg p-6">
          <p className="text-sm text-[var(--color-text-muted)]">
            No district matches found for &quot;{query.trim()}&quot;. Statewide offices are shown below.
          </p>
        </section>
      )}

      {racesToRender.map(({ race, districts }) => (
        <RaceSection key={race._key ?? race.officeTitle} race={race} districts={districts} />
      ))}
    </div>
  )
}
