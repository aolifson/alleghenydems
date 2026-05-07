'use client'

import { FormEvent, useMemo, useState, useTransition } from 'react'
import Image from 'next/image'
import SocialLinks from '@/components/social-links'
import VoterGuideStateCommittee from '@/components/voter-guide-state-committee'
import { urlFor } from '@/sanity/lib/image'
import type { VoterGuideCandidate, VoterGuideDistrict, VoterGuideRace } from '@/sanity/lib/queries'

interface LookupResult {
  district: VoterGuideDistrict
  score: number
}

interface AddressLookupResult {
  standardizedAddress: string
  submittedAddress?: string
  countyName?: string | null
  congressionalDistrict?: string | null
  stateSenateDistrict?: string | null
  stateHouseDistrict?: string | null
  coordinates?: {
    longitude?: number | null
    latitude?: number | null
  }
  source?: string
}

interface Props {
  races: VoterGuideRace[]
  initialQuery?: string
  stateCommitteeRace?: VoterGuideRace
}

const DISTRICT_RACE_TITLE_ALIASES = {
  congress: ['Representative in Congress', 'Representative in U.S. Congress'],
  stateSenate: ['Senator in the General Assembly', 'Senator in the PA General Assembly'],
  stateHouse: ['Representative in the General Assembly', 'Representative in the PA General Assembly'],
} as const

const TARGET_RACE_TITLES: string[] = Object.values(DISTRICT_RACE_TITLE_ALIASES).flat()
const STREET_TYPE_PATTERN =
  /\b(?:st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard|way|ct|court|cir|circle|pl|place|pkwy|parkway|trl|trail|ter|terrace)\b/i

function extractDistrictNumber(label?: string) {
  return (label?.match(/\d+/)?.[0] ?? '').trim()
}

function extractZipQuery(query: string) {
  return query.match(/\b\d{5}\b/)?.[0] ?? null
}

function looksLikeAddressQuery(query: string) {
  const trimmed = query.trim()
  if (!trimmed) return false

  const startsWithStreetNumber = /^\d+[a-zA-Z\-]?\s+/.test(trimmed)
  const hasZip = Boolean(extractZipQuery(trimmed))
  const hasStreetType = STREET_TYPE_PATTERN.test(trimmed)
  const hasComma = trimmed.includes(',')
  const wordCount = trimmed.split(/\s+/).length

  return startsWithStreetNumber && (hasStreetType || hasZip || hasComma || wordCount >= 3)
}

function candidateStatusLabel(status?: VoterGuideCandidate['ballotStatus']) {
  if (status === 'alsoAppearing') return 'Also Appearing On Ballot'
  if (status === 'appearing') return 'Appearing On Ballot'
  return null
}

function candidateEndorsementLabel(candidate: VoterGuideCandidate) {
  if (candidate.endorsedByAcdc) return 'Endorsed by ACDC'
  if (candidate.ballotStatus === 'endorsed') return 'Endorsed by PA Dems'
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

function scoreDistrictByCandidate(query: string, district: VoterGuideDistrict) {
  const normalizedQuery = normalize(query)
  if (!normalizedQuery) return 0

  let best = 0

  for (const candidate of district.candidates ?? []) {
    const normalizedName = normalize(candidate.name)
    if (!normalizedName) continue

    if (normalizedName === normalizedQuery) {
      best = Math.max(best, 140)
      continue
    }
    if (normalizedName.startsWith(normalizedQuery)) {
      best = Math.max(best, 110)
    } else if (normalizedName.includes(normalizedQuery)) {
      best = Math.max(best, 95)
    } else if (normalizedQuery.includes(normalizedName) && normalizedName.length >= 4) {
      best = Math.max(best, 85)
    }
  }

  return best
}

function matchRace(query: string, race: VoterGuideRace): LookupResult[] {
  const trimmed = query.trim()
  if (!trimmed) return []

  const zip = extractZipQuery(trimmed)
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
    .map((district) => ({
      district,
      score: Math.max(scoreDistrictByText(trimmed, district), scoreDistrictByCandidate(trimmed, district)),
    }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || (a.district.displayOrder ?? 999) - (b.district.displayOrder ?? 999))

  const topScore = ranked[0]?.score ?? 0
  const threshold = Math.max(60, topScore - 20)
  return ranked.filter((item) => item.score >= threshold).slice(0, 4)
}

function sortCandidates(candidates: VoterGuideCandidate[]) {
  return [...candidates].sort((a, b) => {
    if (a.endorsedByAcdc !== b.endorsedByAcdc) return a.endorsedByAcdc ? -1 : 1

    const lastNameCompare = getSortableLastName(a.name).localeCompare(getSortableLastName(b.name), undefined, {
      sensitivity: 'base',
    })
    if (lastNameCompare !== 0) return lastNameCompare

    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })
  })
}

function getSortableLastName(name: string) {
  const suffixes = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v'])
  const parts = name
    .replace(/[.,]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  while (parts.length > 1 && suffixes.has(parts[parts.length - 1].toLowerCase())) {
    parts.pop()
  }

  return parts.at(-1) ?? name
}

function isStatewideRace(race: VoterGuideRace) {
  const districts = race.districts ?? []
  if (districts.length === 0) return true
  return districts.every((district) => normalize(district.districtLabel) === 'statewide')
}

function findRaceByTitles(races: VoterGuideRace[], titles: readonly string[]) {
  const normalizedTitles = new Set(titles.map(normalize))
  return races.find((race) => normalizedTitles.has(normalize(race.officeTitle))) ?? null
}

function getDistrictRaceKind(race: VoterGuideRace) {
  const normalizedTitle = normalize(race.officeTitle)
  if (DISTRICT_RACE_TITLE_ALIASES.congress.map(normalize).includes(normalizedTitle)) return 'congress'
  if (DISTRICT_RACE_TITLE_ALIASES.stateSenate.map(normalize).includes(normalizedTitle)) return 'stateSenate'
  if (DISTRICT_RACE_TITLE_ALIASES.stateHouse.map(normalize).includes(normalizedTitle)) return 'stateHouse'
  return null
}

function findDistrictByNumber(race: VoterGuideRace, districtNumber?: string | null) {
  if (!districtNumber) return null

  return (
    (race.districts ?? []).find(
      (district) => extractDistrictNumber(district.districtLabel) === districtNumber
    ) ?? null
  )
}

function CandidateCard({ candidate }: { candidate: VoterGuideCandidate }) {
  const status = candidateStatusLabel(candidate.ballotStatus)
  const endorsement = candidateEndorsementLabel(candidate)
  return (
    <div className="voter-guide-candidate-card rounded-lg border border-[var(--color-border)] p-4 md:p-5 bg-white">
      {endorsement && (
        <div className="mb-3 inline-flex items-center rounded-r-sm bg-[var(--color-navy)] text-white px-3 py-1 text-xs font-bold uppercase tracking-wide">
          {endorsement}
        </div>
      )}
      <div className="flex gap-3">
        {candidate.photo ? (
          <div className="voter-guide-candidate-photo relative h-20 w-20 shrink-0 rounded overflow-hidden border border-[var(--color-border)]">
            <Image
              src={urlFor(candidate.photo).width(160).height(160).url()}
              alt={candidate.photo.alt ?? candidate.name}
              fill
              loading="eager"
              sizes="80px"
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
}

function CandidateGrid({ candidates }: { candidates: VoterGuideCandidate[] }) {
  const orderedCandidates = sortCandidates(candidates)

  if (orderedCandidates.length === 0) return null

  return (
    <div
      className={
        orderedCandidates.length <= 1
          ? 'voter-guide-candidate-grid grid grid-cols-1 gap-4'
          : 'voter-guide-candidate-grid grid grid-cols-1 md:grid-cols-2 gap-4'
      }
    >
      {orderedCandidates.map((candidate) => (
        <CandidateCard key={candidate._key ?? candidate.name} candidate={candidate} />
      ))}
    </div>
  )
}

function DistrictSection({ district }: { district: VoterGuideDistrict }) {
  const candidates = sortCandidates(district.candidates ?? [])
  const [firstCandidate, ...remainingCandidates] = candidates

  return (
    <article className="voter-guide-district-section space-y-3">
      <div className="voter-guide-district-lead space-y-3">
        <div className="voter-guide-district-intro space-y-3">
          <h3 className="text-xl font-bold text-[var(--color-blue-mid)] uppercase tracking-wide">{district.districtLabel}</h3>
          {district.districtDescription && (
            <p className="text-base text-[var(--color-text)] leading-relaxed">
              {district.districtDescription}
            </p>
          )}
        </div>

        {firstCandidate && <CandidateCard candidate={firstCandidate} />}
      </div>

      {remainingCandidates.length > 0 && <CandidateGrid candidates={remainingCandidates} />}
    </article>
  )
}

function RaceSection({
  race,
  districts,
  intro,
}: {
  race: VoterGuideRace
  districts: VoterGuideDistrict[]
  intro?: string
}) {
  const orderedDistricts = [...districts].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
  const statewideDistrictCandidates =
    orderedDistricts.length === 1 && normalize(orderedDistricts[0].districtLabel) === 'statewide'
      ? orderedDistricts[0].candidates ?? []
      : []
  const racewideCandidates =
    race.candidates && race.candidates.length > 0 ? race.candidates : statewideDistrictCandidates
  const shouldRenderRacewide = racewideCandidates.length > 0
  const shouldRenderDistricts = !shouldRenderRacewide

  return (
    <section key={race._key ?? race.officeTitle} className="voter-guide-race-section bg-white rounded-lg overflow-visible border border-white/40 shadow-sm">
      <div className="voter-guide-race-header sticky top-0 z-20 bg-[var(--color-navy)] text-white px-6 py-4 rounded-t-lg shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Viewing Race</p>
        <h2 className="font-display text-2xl md:text-3xl font-bold uppercase tracking-wide">{race.officeTitle}</h2>
      </div>

      {intro && (
        <div className="border-b border-[var(--color-border)] bg-white px-6 py-4">
          <p className="text-sm md:text-base text-[var(--color-text)] leading-relaxed max-w-4xl">
            {intro}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="voter-guide-race-meta bg-[var(--color-blue-light)] px-6 py-5 border-b lg:border-b-0 lg:border-r border-[var(--color-border)]">
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
          {shouldRenderRacewide && <CandidateGrid candidates={racewideCandidates} />}

          {shouldRenderDistricts && orderedDistricts.length === 0 && (
            <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-blue-light)] px-4 py-3">
              <p className="text-sm font-semibold text-[var(--color-navy)]">Details coming soon</p>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                This race is in the voter guide, but candidates or district details have not been added yet.
              </p>
            </div>
          )}

          {shouldRenderDistricts && orderedDistricts.map((district) => (
            <DistrictSection key={district._key ?? district.districtLabel} district={district} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default function VoterGuideDistrictLookup({ races, initialQuery = '', stateCommitteeRace }: Props) {
  const [query, setQuery] = useState(initialQuery)
  const [exactLookup, setExactLookup] = useState<AddressLookupResult | null>(null)
  const [lookupNotice, setLookupNotice] = useState<{ tone: 'error' | 'info'; message: string } | null>(null)
  const [isAddressLookupPending, startAddressLookupTransition] = useTransition()

  const orderedRaces = useMemo(
    () => [...races].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999)),
    [races]
  )

  const districtRaces = useMemo(() => {
    return [
      findRaceByTitles(races, DISTRICT_RACE_TITLE_ALIASES.congress),
      findRaceByTitles(races, DISTRICT_RACE_TITLE_ALIASES.stateSenate),
      findRaceByTitles(races, DISTRICT_RACE_TITLE_ALIASES.stateHouse),
    ].filter((race): race is VoterGuideRace => Boolean(race))
  }, [races])

  const statewideRaces = useMemo(
    () =>
      orderedRaces.filter(
        (race) =>
          race.officeTitle !== stateCommitteeRace?.officeTitle &&
          !TARGET_RACE_TITLES.includes(race.officeTitle) &&
          isStatewideRace(race)
      ),
    [orderedRaces, stateCommitteeRace]
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
  const hasExactLookup = Boolean(exactLookup)
  const shouldOfferExactLookup = looksLikeAddressQuery(query)
  const hasAnyDistrictMatch = matchResults.some((race) => race.matches.length > 0)
  const zipQuery = extractZipQuery(query)
  const ambiguousZipRaces = useMemo(
    () => matchResults.filter((result) => result.matches.length > 1),
    [matchResults]
  )
  const zipMatchSummary = useMemo(() => {
    if (!zipQuery) return []
    return matchResults.flatMap((result) =>
      result.matches.map((match) => `${result.race.officeTitle}: ${match.district.districtLabel}`)
    )
  }, [matchResults, zipQuery])

  const stateSenateMatchNumbers = useMemo(() => {
    const senateMatches = matchResults.find((result) => getDistrictRaceKind(result.race) === 'stateSenate')?.matches ?? []
    return new Set(
      senateMatches
        .map((match) => extractDistrictNumber(match.district.districtLabel))
        .filter((number): number is string => Boolean(number))
    )
  }, [matchResults])

  const stateCommitteeMatches = useMemo(() => {
    if (!stateCommitteeRace) return []

    const byLabel = new Map<string, VoterGuideDistrict>()

    for (const district of stateCommitteeRace.districts ?? []) {
      const districtNumber = extractDistrictNumber(district.districtLabel)
      if (districtNumber && stateSenateMatchNumbers.has(districtNumber)) {
        byLabel.set(district.districtLabel, district)
      }
    }

    if (hasQuery) {
      for (const match of matchRace(query, stateCommitteeRace)) {
        byLabel.set(match.district.districtLabel, match.district)
      }
    }

    return [...byLabel.values()].sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999))
  }, [hasQuery, query, stateCommitteeRace, stateSenateMatchNumbers])

  const textRacesToRender = useMemo(() => {
    if (!hasQuery) {
      return districtRaces.map((race) => ({ race, districts: race.districts ?? [] }))
    }

    return matchResults
      .filter((result) => result.matches.length > 0)
      .map((result) => ({
        race: result.race,
        districts: result.matches.map((match) => match.district),
      }))
  }, [districtRaces, hasQuery, matchResults])

  const exactRacesToRender = useMemo(() => {
    if (!exactLookup) return []

    return districtRaces.flatMap((race) => {
      const raceKind = getDistrictRaceKind(race)
      const districtNumber =
        raceKind === 'congress'
          ? exactLookup.congressionalDistrict
          : raceKind === 'stateSenate'
            ? exactLookup.stateSenateDistrict
            : exactLookup.stateHouseDistrict

      const district = findDistrictByNumber(race, districtNumber)
      return district ? [{ race, districts: [district] }] : []
    })
  }, [districtRaces, exactLookup])

  const exactStateCommitteeMatches = useMemo(() => {
    if (!stateCommitteeRace || !exactLookup?.stateSenateDistrict) return []
    const district = findDistrictByNumber(stateCommitteeRace, exactLookup.stateSenateDistrict)
    return district ? [district] : []
  }, [exactLookup, stateCommitteeRace])

  const racesToRender = hasExactLookup ? exactRacesToRender : textRacesToRender
  const activeStateCommitteeMatches = hasExactLookup ? exactStateCommitteeMatches : stateCommitteeMatches
  const hasActiveSearch = hasExactLookup || hasQuery
  const hasSearchResults =
    racesToRender.length > 0 ||
    activeStateCommitteeMatches.length > 0 ||
    (hasActiveSearch && statewideRaces.length > 0)

  const exactLookupSummary = useMemo(() => {
    if (!exactLookup) return []

    return [
      exactLookup.congressionalDistrict ? `Congress ${exactLookup.congressionalDistrict}` : null,
      exactLookup.stateSenateDistrict ? `State Senate ${exactLookup.stateSenateDistrict}` : null,
      exactLookup.stateHouseDistrict ? `State House ${exactLookup.stateHouseDistrict}` : null,
    ].filter((item): item is string => Boolean(item))
  }, [exactLookup])

  function clearAllSearch() {
    setQuery('')
    setExactLookup(null)
    setLookupNotice(null)
  }

  function handleTextQueryChange(nextValue: string) {
    setQuery(nextValue)
    if (exactLookup) setExactLookup(null)
    if (lookupNotice) setLookupNotice(null)
  }

  async function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (!trimmedQuery || !looksLikeAddressQuery(trimmedQuery)) {
      return
    }

    setLookupNotice(null)

    startAddressLookupTransition(async () => {
      try {
        const response = await fetch(
          `/api/voter-guide/address-lookup?address=${encodeURIComponent(trimmedQuery)}`,
          { cache: 'no-store' }
        )

        const payload = (await response.json()) as AddressLookupResult & { error?: string }
        if (!response.ok) {
          const fallbackMessage =
            response.status === 404 || response.status === 422
              ? 'We could not confirm an exact address from that search, so the results below are using text, neighborhood, district, and ZIP matching.'
              : 'Exact address lookup is unavailable right now, so the results below are using text, neighborhood, district, and ZIP matching.'
          setExactLookup(null)
          setLookupNotice({ tone: 'info', message: fallbackMessage })
          return
        }

        setExactLookup(payload)
        setLookupNotice(null)
      } catch (err) {
        setExactLookup(null)
        setLookupNotice({
          tone: 'info',
          message:
            err instanceof Error && err.message
              ? `${err.message} Showing text, neighborhood, district, and ZIP matches below instead.`
              : 'Exact address lookup failed. Showing text, neighborhood, district, and ZIP matches below instead.',
        })
      }
    })
  }

  return (
    <div className="space-y-8">
      <section className="voter-guide-print-card bg-white/95 border border-white/50 rounded-lg p-6 md:p-8">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-[var(--color-navy)]">
          Find Your Candidates
        </h2>
        <p className="mt-2 text-base text-[var(--color-text)] max-w-3xl leading-relaxed">
          For best results, search by your full street address. You can also search by municipality (Clairton) or neighborhood (e.g. Beltzhoover), but those can include multiple candidates’ districts. 
        </p>

        <form onSubmit={handleSearchSubmit} className="no-print mt-4 flex flex-col sm:flex-row gap-3">
          <input
            type="search"
            value={query}
            onChange={(event) => handleTextQueryChange(event.target.value)}
            placeholder="e.g. Mt Lebanon, Summer Lee, District 42, 15217, 5843 Hobart St"
            className="w-full rounded-md border border-[var(--color-border)] bg-white px-3 py-2 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-mid)]"
            aria-label="Search district by location, candidate name, ZIP code, or street address"
          />
          <button
            type="submit"
            disabled={isAddressLookupPending || !shouldOfferExactLookup}
            className="rounded-md bg-[var(--color-navy)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--color-blue-mid)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isAddressLookupPending ? 'Checking Address...' : 'Check Address'}
          </button>
          {(hasQuery || hasExactLookup) && (
            <button
              type="button"
              onClick={clearAllSearch}
              className="rounded-md border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-navy)] hover:bg-[var(--color-blue-light)]"
            >
              Clear
            </button>
          )}
        </form>

        {shouldOfferExactLookup && !hasExactLookup && (
          <p className="no-print mt-2 text-sm text-[var(--color-text-muted)] max-w-3xl leading-relaxed">
            This looks like a street address. Press Enter or click `Check Address` to try an exact ballot lookup first. 
          </p>
        )}

        {lookupNotice && (
          <p className={`no-print mt-2 text-sm leading-relaxed ${lookupNotice.tone === 'error' ? 'text-[var(--color-red)]' : 'text-[var(--color-text-muted)]'}`}>
            {lookupNotice.message}
          </p>
        )}

        {exactLookup && (
          <p className="mt-2 text-base text-[var(--color-text)] leading-relaxed">
            Using exact address lookup for {exactLookup.standardizedAddress}
            {exactLookupSummary.length > 0 ? ` (${exactLookupSummary.join(' · ')})` : ''}.
          </p>
        )}

       
        {!hasExactLookup && zipQuery && hasAnyDistrictMatch && (
          <p className="no-print mt-2 text-xs text-[var(--color-text-muted)]">
            ZIP {zipQuery} matched {zipMatchSummary.length} district race{zipMatchSummary.length === 1 ? '' : 's'}: {zipMatchSummary.join(' · ')}.
          </p>
        )}

        {!hasExactLookup && zipQuery && ambiguousZipRaces.length > 0 && (
          <p className="no-print mt-2 text-xs text-[var(--color-text-muted)]">
            ZIP codes can cross district lines. For {zipQuery}, we show every possible district match so you do not miss a race you may be able to vote in.
          </p>
        )}

        {hasExactLookup && (
          <p className="no-print mt-3 text-base text-[var(--color-text)] leading-relaxed">
            Showing the races attached to this exact address.
          </p>
        )}

        {!hasExactLookup && hasQuery && (
          <p className="no-print mt-3 text-base text-[var(--color-text)] leading-relaxed">
            Showing all races related to this search. 
          </p>
        )}
      </section>

      {hasActiveSearch && !hasSearchResults && (
        <section className="voter-guide-print-card bg-white/95 border border-white/50 rounded-lg p-6">
          <p className="text-sm text-[var(--color-text-muted)]">
            {hasExactLookup
              ? `No ballot matches from ${exactLookup?.standardizedAddress}.`
              : `No district matches found for "${query.trim()}".`}
          </p>
        </section>
      )}

      {racesToRender.map(({ race, districts }) => (
        <RaceSection key={race._key ?? race.officeTitle} race={race} districts={districts} />
      ))}

      {stateCommitteeRace && (!hasActiveSearch || activeStateCommitteeMatches.length > 0) && (
        <VoterGuideStateCommittee
          race={stateCommitteeRace}
          districts={hasActiveSearch ? activeStateCommitteeMatches : undefined}
        />
      )}

      {statewideRaces.map((race) => (
        <RaceSection
          key={race._key ?? race.officeTitle}
          race={race}
          districts={race.districts ?? []}
          intro="This race appears on every ballot, no matter where you live."
        />
      ))}
    </div>
  )
}
