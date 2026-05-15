import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_PLACES_AUTOCOMPLETE_URL =
  'https://maps.googleapis.com/maps/api/place/autocomplete/json'
const GOOGLE_OVER_LIMIT_STATUSES = new Set(['OVER_DAILY_LIMIT', 'OVER_QUERY_LIMIT'])
const PITTSBURGH_REGION_BIAS = {
  location: '40.4406,-79.9959',
  radius: '60000',
}

interface GooglePlacesAutocompleteResponse {
  status: string
  error_message?: string
  predictions?: Array<{
    description: string
    place_id: string
    structured_formatting?: {
      main_text?: string
      secondary_text?: string
    }
  }>
}

export async function GET(req: NextRequest) {
  const input = req.nextUrl.searchParams.get('input')?.trim()
  const sessionToken = req.nextUrl.searchParams.get('sessionToken')?.trim()
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!input || input.length < 3) {
    return NextResponse.json({ suggestions: [] })
  }

  if (!apiKey) {
    return NextResponse.json({ suggestions: [] })
  }

  const params = new URLSearchParams({
    input,
    key: apiKey,
    types: 'address',
    components: 'country:us',
    region: 'us',
    location: PITTSBURGH_REGION_BIAS.location,
    radius: PITTSBURGH_REGION_BIAS.radius,
  })

  if (sessionToken) params.set('sessiontoken', sessionToken)

  try {
    const response = await fetch(
      `${GOOGLE_PLACES_AUTOCOMPLETE_URL}?${params.toString()}`,
      { cache: 'no-store', headers: { Accept: 'application/json' } }
    )

    if (!response.ok) {
      return NextResponse.json({ suggestions: [] }, { status: 502 })
    }

    const payload = (await response.json()) as GooglePlacesAutocompleteResponse

    if (GOOGLE_OVER_LIMIT_STATUSES.has(payload.status)) {
      console.error(
        `[address-autocomplete] Google Places returned ${payload.status} — ` +
          'check billing, quota, and Places API settings in Google Cloud.'
      )
      return NextResponse.json({ suggestions: [] })
    }

    if (payload.status !== 'OK' || !payload.predictions?.length) {
      return NextResponse.json({ suggestions: [] })
    }

    const pennsylvaniaPredictions = payload.predictions.filter((prediction) =>
      /,\s*PA\b|Pennsylvania/i.test(prediction.description)
    )
    const predictions =
      pennsylvaniaPredictions.length > 0 ? pennsylvaniaPredictions : payload.predictions

    return NextResponse.json({
      suggestions: predictions.slice(0, 5).map((prediction) => ({
        description: prediction.description,
        placeId: prediction.place_id,
        mainText: prediction.structured_formatting?.main_text ?? prediction.description,
        secondaryText: prediction.structured_formatting?.secondary_text ?? '',
      })),
    })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
