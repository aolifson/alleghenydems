import { promises as fs } from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getActiveMemberEmail } from '@/lib/members-session'

// Serves the admin guide (moved out of public/ so it is no longer
// world-readable) as a standalone HTML document, after auth.
export async function GET(request: NextRequest) {
  const email = await getActiveMemberEmail()
  if (!email) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/members/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

  const html = await fs.readFile(path.join(process.cwd(), 'private', 'admin-guide.html'), 'utf-8')
  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'private, no-store',
    },
  })
}
