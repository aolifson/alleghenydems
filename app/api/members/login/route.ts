import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { client } from '@/sanity/lib/client'
import { signMemberToken, normalizeEmail, isAdminEmail } from '@/lib/members-auth'

const GENERIC_RESPONSE = {
  ok: true,
  message: 'If that address is on file, a sign-in link is on its way.',
}

// Best-effort in-memory throttle: 3 requests per email per 15 minutes.
// Fine at committee scale; resets on redeploy/cold start.
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000
const RATE_LIMIT_MAX = 3
const recentRequests = new Map<string, number[]>()

function isRateLimited(email: string): boolean {
  const now = Date.now()
  const timestamps = (recentRequests.get(email) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS)
  if (timestamps.length >= RATE_LIMIT_MAX) {
    recentRequests.set(email, timestamps)
    return true
  }
  timestamps.push(now)
  recentRequests.set(email, timestamps)
  return false
}

function loginEmailHtml(verifyUrl: string): string {
  return `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
  <div style="background: #0d2240; border-radius: 8px 8px 0 0; padding: 24px; text-align: center;">
    <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0;">Allegheny County Democratic Committee</p>
    <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0 0;">Members Area</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 28px 24px;">
    <p style="margin: 0 0 16px;">Here&rsquo;s your sign-in link. It expires in 15 minutes and can be used once.</p>
    <p style="text-align: center; margin: 24px 0;">
      <a href="${verifyUrl}" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px;">Sign in to the Members Area</a>
    </p>
    <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">If you didn&rsquo;t request this, you can safely ignore this email.</p>
  </div>
</div>`
}

export async function POST(request: NextRequest) {
  if (!process.env.AUTH_SECRET || !process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { ok: false, message: 'Member login is not configured. Please contact the site administrator.' },
      { status: 503 }
    )
  }

  let email: string
  try {
    const body = await request.json()
    email = normalizeEmail(String(body?.email ?? ''))
  } catch {
    email = ''
  }
  if (!email || !email.includes('@')) {
    return NextResponse.json(GENERIC_RESPONSE)
  }

  if (isRateLimited(email)) {
    return NextResponse.json(GENERIC_RESPONSE)
  }

  const member = await client.withConfig({ useCdn: false }).fetch<{ _id: string } | null>(
    `*[_type == "committeeMember" && isActive == true && lower(email) == $email][0]{ _id }`,
    { email }
  )

  // Same response whether or not the email matched — no account enumeration.
  // Site admins from MEMBERS_ADMIN_EMAILS get in without a Sanity record.
  if (!member && !isAdminEmail(email)) {
    return NextResponse.json(GENERIC_RESPONSE)
  }

  const token = await signMemberToken(email, 'login')
  const verifyUrl = `${request.nextUrl.origin}/api/members/verify?token=${encodeURIComponent(token)}`

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const payload = {
      to: email,
      subject: 'Your members area sign-in link',
      html: loginEmailHtml(verifyUrl),
      text: `Sign in to the ACDC members area (link expires in 15 minutes): ${verifyUrl}`,
    }
    // Preferred sender requires the domain to be verified in Resend; until
    // then, fall back to Resend's test sender so login links still go out.
    const preferredFrom = process.env.MEMBERS_AREA_FROM_EMAIL ?? 'Allegheny Dems Members <noreply@alleghenydems.com>'
    const { error } = await resend.emails.send({ from: preferredFrom, ...payload })
    if (error) {
      console.error('Members login email failed from preferred sender, retrying with test sender:', error)
      const retry = await resend.emails.send({ from: 'ACDC Members <onboarding@resend.dev>', ...payload })
      if (retry.error) console.error('Members login email failed:', retry.error)
    }
  } catch (error) {
    console.error('Members login email failed:', error)
  }

  return NextResponse.json(GENERIC_RESPONSE)
}
