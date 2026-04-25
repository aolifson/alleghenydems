import { NextRequest, NextResponse } from 'next/server'

const CENSUS_GEOCODER_URL =
  'https://geocoding.geo.census.gov/geocoder/geographies/onelineaddress'
const CENSUS_BENCHMARK = 'Public_AR_Current'
const CENSUS_VINTAGE = 'Current_Current'

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

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get('address')?.trim()

  if (!address) {
    return NextResponse.json({ error: 'Address is required.' }, { status: 400 })
  }

  const params = new URLSearchParams({
    address,
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
