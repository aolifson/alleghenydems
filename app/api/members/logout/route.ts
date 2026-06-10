import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE } from '@/lib/members-auth'

export async function POST(request: NextRequest) {
  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/members/login'
  loginUrl.search = ''

  // 303 so the browser follows the redirect with GET after the form POST.
  const response = NextResponse.redirect(loginUrl, 303)
  response.cookies.delete(SESSION_COOKIE)
  return response
}
