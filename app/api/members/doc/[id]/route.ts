import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { client } from '@/sanity/lib/client'
import { getActiveMemberEmail } from '@/lib/members-session'

// Streams an internal document through an authenticated route so the
// unauthenticated Sanity CDN URL never appears in rendered HTML.
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const email = await getActiveMemberEmail()
  if (!email) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const { id } = await params
  const doc = await client.withConfig({ useCdn: false }).fetch<{
    title: string
    url?: string
    fileName?: string
    mimeType?: string
  } | null>(
    `*[_type == "internalDoc" && _id == $id && isActive == true][0]{
      title,
      "url": file.asset->url,
      "fileName": file.asset->originalFilename,
      "mimeType": file.asset->mimeType
    }`,
    { id }
  )

  if (!doc?.url) {
    return new NextResponse('Not found', { status: 404, headers: { 'Cache-Control': 'no-store' } })
  }

  const upstream = await fetch(doc.url)
  if (!upstream.ok || !upstream.body) {
    return new NextResponse('Document unavailable', { status: 502, headers: { 'Cache-Control': 'no-store' } })
  }

  const filename = (doc.fileName ?? doc.title).replace(/[^\w.\- ]+/g, '_')
  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': doc.mimeType ?? 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
