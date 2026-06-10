import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signMemberToken,
  verifyMemberToken,
} from '@/lib/members-auth'

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token') ?? ''
  const email = token ? await verifyMemberToken(token, 'login') : null

  if (!email) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/members/login'
    loginUrl.search = '?error=expired'
    return NextResponse.redirect(loginUrl)
  }

  const sessionToken = await signMemberToken(email, 'session')
  const membersUrl = request.nextUrl.clone()
  membersUrl.pathname = '/members'
  membersUrl.search = ''

  const response = NextResponse.redirect(membersUrl)
  response.cookies.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
  return response
}
