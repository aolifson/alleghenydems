import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  SESSION_COOKIE,
  SESSION_TTL_SECONDS,
  signMemberToken,
  isPreviewPasswordEnabled,
  checkPreviewPassword,
  PREVIEW_SESSION_EMAIL,
} from '@/lib/members-auth'

// Shared-password sign-in for the private preview/feedback phase. Disabled
// entirely (404) unless MEMBERS_PREVIEW_PASSWORD is set. Remove that env var
// at public launch and this route goes dark.
export async function POST(request: NextRequest) {
  if (!isPreviewPasswordEnabled()) {
    return NextResponse.json({ ok: false, message: 'Preview access is not enabled.' }, { status: 404 })
  }

  let password = ''
  try {
    const body = await request.json()
    password = String(body?.password ?? '')
  } catch {
    password = ''
  }

  if (!checkPreviewPassword(password)) {
    return NextResponse.json({ ok: false, message: 'Incorrect password.' }, { status: 401 })
  }

  const token = await signMemberToken(PREVIEW_SESSION_EMAIL, 'session')
  const response = NextResponse.json({ ok: true })
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_TTL_SECONDS,
    path: '/',
  })
  return response
}
