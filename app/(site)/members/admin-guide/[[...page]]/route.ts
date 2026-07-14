import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getActiveMemberEmail } from '@/lib/members-session'

// The multi-page site guide, served from docs/admin-guide/ (not public/, so it
// is never world-readable) after members-area auth. Pages link to each other
// with plain relative hrefs (e.g. "cms-guide.html"), which resolve correctly
// because every page — including the index — is served at a *.html URL.
const GUIDE_DIR = path.join(process.cwd(), 'docs', 'admin-guide')

const GUIDE_PAGES = new Set([
  'index.html',
  'cms-guide.html',
  'local-committees.html',
  'costs.html',
])

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ page?: string[] }> }
) {
  const email = await getActiveMemberEmail()
  if (!email) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/members/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  const { page } = await params

  // Bare /members/admin-guide → the guide's front page. Redirect (rather than
  // serve) so relative links inside the HTML resolve under /members/admin-guide/.
  if (!page || page.length === 0) {
    const indexUrl = request.nextUrl.clone()
    indexUrl.pathname = '/members/admin-guide/index.html'
    return NextResponse.redirect(indexUrl)
  }

  if (page.length !== 1 || !GUIDE_PAGES.has(page[0])) {
    return new NextResponse('Not found', { status: 404 })
  }

  const html = await fs.readFile(path.join(GUIDE_DIR, page[0]), 'utf-8')
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  })
}
