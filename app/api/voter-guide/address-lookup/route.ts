import { NextRequest, NextResponse } from 'next/server'

const CENSUS_GEOCODER_URL =
  'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'
const CENSUS_COORDINATES_URL =
  'https://geocoding.geo.census.gov/geocoder/geographies/coordinates'
const GOOGLE_MAPS_GEOCODING_URL =
  'https://maps.googleapis.com/maps/api/geocode/json'
const CENSUS_BENCHMARK = 'Public_AR_Current'
const CENSUS_VINTAGE = 'Current_Current'
const STATE_PATTERNS = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming',
] as const

type CensusGeographyEntry = Record<string, string | number | null>

interface CensusAddressMatch {
  matchedAddress?: string
  coordinates?: {
    x?: number
    y?: number
  }
  geographies?: Record<string, CensusGeographyEntry[]>
}

interface CensusGeocoderResponse {
  result?: {
    addressMatches?: CensusAddressMatch[]
  }
}

function parseDistrictNumber(value?: string | number | null) {
  const match = String(value ?? '').match(/\d+/)
  return match ? String(Number(match[0])) : null
}

function firstMatchingEntry(
  geographies: Record<string, CensusGeographyEntry[]> | undefined,
  pattern: RegExp
) {
  if (!geographies) return null

  for (const [layerName, entries] of Object.entries(geographies)) {
    if (!pattern.test(layerName) || !Array.isArray(entries) || entries.length === 0) continue
    return entries[0]
  }

  return null
}

const GOOGLE_OVER_LIMIT_STATUSES = new Set(['OVER_DAILY_LIMIT', 'OVER_QUERY_LIMIT'])

async function geocodeWithGoogle(
  address: string
): Promise<{ lat: number; lng: number; formattedAddress: string } | null> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY
  if (!apiKey) return null

  const params = new URLSearchParams({ address, key: apiKey })
  try {
    const response = await fetch(
      `${GOOGLE_MAPS_GEOCODING_URL}?${params.toString()}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    )
    if (!response.ok) return null

    const payload = (await response.json()) as {
      status: string
      results?: Array<{
        formatted_address: string
        geometry: { location: { lat: number; lng: number } }
      }>
    }

    if (GOOGLE_OVER_LIMIT_STATUSES.has(payload.status)) {
      console.error(
        `[address-lookup] Google Maps returned ${payload.status} — ` +
          'check billing and quota settings at https://console.cloud.google.com. ' +
          'Disable fallback by removing GOOGLE_MAPS_API_KEY from Vercel env vars.'
      )
      return null
    }

    if (payload.status !== 'OK' || !payload.results?.length) return null

    const result = payload.results[0]
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formattedAddress: result.formatted_address,
    }
  } catch {
    return null
  }
}

async function geocodeCoordinatesWithCensus(
  lat: number,
  lng: number
): Promise<CensusAddressMatch | null> {
  const params = new URLSearchParams({
    x: String(lng),
    y: String(lat),
    benchmark: CENSUS_BENCHMARK,
    vintage: CENSUS_VINTAGE,
    format: 'json',
  })
  try {
    const response = await fetch(
      `${CENSUS_COORDINATES_URL}?${params.toString()}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    )
    if (!response.ok) return null

    // The coordinates endpoint returns result.geographies directly,
    // unlike the address endpoint which wraps results in addressMatches[].
    const payload = (await response.json()) as {
      result?: { geographies?: Record<string, CensusGeographyEntry[]> }
    }
    const geographies = payload.result?.geographies
    if (!geographies) return null
    return { geographies }
  } catch {
    return null
  }
}

function hasExplicitState(address: string) {
  const stateRegex = new RegExp(`\\b(?:${STATE_PATTERNS.join('|')})\\b`, 'i')
  return stateRegex.test(address)
}

function normalizeLookupAddress(address: string) {
  if (hasExplicitState(address)) return address
  return `${address.replace(/,\s*$/, '')}, PA`
}

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.trim()

  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  }

  const lookupAddress = normalizeLookupAddress(address)

  const params = new URLSearchParams({
    address: lookupAddress,
    benchmark: CENSUS_BENCHMARK,
    vintage: CENSUS_VINTAGE,
    format: 'json',
  })

  try {
    const response = await fetch(`${CENSUS_GEOCODER_URL}?${params.toString()}`, {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `Census geocoder returned HTTP ${response.status}.` },
        { status: 502 }
      )
    }

    const payload = (await response.json()) as CensusGeocoderResponse
    const match = payload.result?.addressMatches?.[0]

    if (!match) {
      console.log(`[address-lookup] Census miss — falling back to Google Maps for: ${lookupAddress}`)
      const googleResult = await geocodeWithGoogle(lookupAddress)
      if (googleResult) {
        const coordMatch = await geocodeCoordinatesWithCensus(googleResult.lat, googleResult.lng)
        if (coordMatch) {
          const geographies = coordMatch.geographies
          const county = firstMatchingEntry(geographies, /^Counties$/i)
          const countyName = String(county?.NAME ?? '').trim()

          if (countyName && !/Allegheny County/i.test(countyName)) {
            return NextResponse.json(
              { error: 'This lookup currently supports Allegheny County addresses only.' },
              { status: 422 }
            )
          }

          const congressionalDistrict = firstMatchingEntry(geographies, /Congressional Districts/i)
          const stateSenateDistrict = firstMatchingEntry(geographies, /State Legislative Districts - Upper/i)
          const stateHouseDistrict = firstMatchingEntry(geographies, /State Legislative Districts - Lower/i)

          return NextResponse.json({
            standardizedAddress: googleResult.formattedAddress,
            submittedAddress: lookupAddress,
            countyName: countyName || null,
            congressionalDistrict:
              parseDistrictNumber(congressionalDistrict?.CD119) ??
              parseDistrictNumber(congressionalDistrict?.NAME),
            stateSenateDistrict:
              parseDistrictNumber(stateSenateDistrict?.SLDU2024) ??
              parseDistrictNumber(stateSenateDistrict?.NAME),
            stateHouseDistrict:
              parseDistrictNumber(stateHouseDistrict?.SLDL2024) ??
              parseDistrictNumber(stateHouseDistrict?.NAME),
            coordinates: {
              longitude: googleResult.lng,
              latitude: googleResult.lat,
            },
            source: 'Google Maps + U.S. Census Geocoder',
          })
        }
      }

      return NextResponse.json(
        { error: 'We could not match that address. Try a full street address with city, state, and ZIP.' },
        { status: 404 }
      )
    }

    const geographies = match.geographies
    const county = firstMatchingEntry(geographies, /^Counties$/i)
    const countyName = String(county?.NAME ?? '').trim()

    if (countyName && !/Allegheny County/i.test(countyName)) {
      return NextResponse.json(
        { error: 'This lookup currently supports Allegheny County addresses only.' },
        { status: 422 }
      )
    }

    const congressionalDistrict = firstMatchingEntry(geographies, /Congressional Districts/i)
    const stateSenateDistrict = firstMatchingEntry(geographies, /State Legislative Districts - Upper/i)
    const stateHouseDistrict = firstMatchingEntry(geographies, /State Legislative Districts - Lower/i)

    return NextResponse.json({
      standardizedAddress: match.matchedAddress ?? address,
      submittedAddress: lookupAddress,
      countyName: countyName || null,
      congressionalDistrict:
        parseDistrictNumber(congressionalDistrict?.CD119) ??
        parseDistrictNumber(congressionalDistrict?.NAME),
      stateSenateDistrict:
        parseDistrictNumber(stateSenateDistrict?.SLDU2024) ??
        parseDistrictNumber(stateSenateDistrict?.NAME),
      stateHouseDistrict:
        parseDistrictNumber(stateHouseDistrict?.SLDL2024) ??
        parseDistrictNumber(stateHouseDistrict?.NAME),
      coordinates: {
        longitude: match.coordinates?.x ?? null,
        latitude: match.coordinates?.y ?? null,
      },
      source: 'U.S. Census Geocoder',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json(
      { error: `Address lookup failed: ${message}` },
      { status: 500 }
    )
  }
}
