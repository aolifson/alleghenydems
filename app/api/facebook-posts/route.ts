import { NextRequest, NextResponse } from 'next/server'
import { fetchFacebookPosts } from '@/lib/facebook'

export async function GET(req: NextRequest) {
  try {
    const search = req.nextUrl.searchParams
    const after = search.get('after') ?? undefined
    const limit = Number(search.get('limit') ?? '3')

    const result = await fetchFacebookPosts({
      after,
      limit: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 10) : 3,
    })

    if (!result) {
      return NextResponse.json(
        { error: 'Facebook feed is not configured on the server.' },
        { status: 503 }
      )
    }

    return NextResponse.json(result)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
