import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { randomUUID } from 'crypto'
import { writeClient } from '@/sanity/lib/client'
import {
  normalizeEmail,
  isValidEmail,
  confirmationEmail,
  sendReminderEmail,
  buildUnsubscribeUrl,
  VOTE_REMINDER_METHODS,
  type VoteMethod,
} from '@/lib/vote-reminders'

const SUCCESS = {
  ok: true,
  message: "You're signed up! Check your inbox for a confirmation.",
}

function coerceMethod(value: unknown): VoteMethod | undefined {
  return VOTE_REMINDER_METHODS.includes(value as VoteMethod) ? (value as VoteMethod) : undefined
}

export async function POST(request: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = (await request.json()) as Record<string, unknown>
  } catch {
    body = {}
  }

  const email = normalizeEmail(String(body.email ?? ''))
  if (!email || !isValidEmail(email)) {
    return NextResponse.json(
      { ok: false, message: 'Please enter a valid email address.' },
      { status: 400 }
    )
  }

  const name = String(body.name ?? '').trim() || undefined
  const zip = String(body.zip ?? '').trim() || undefined
  const voteMethod = coerceMethod(body.voteMethod)
  const source = (String(body.source ?? '').trim() || 'plan-to-vote').slice(0, 80)

  // Canonical public origin for the unsubscribe link, mirroring the login route.
  const baseUrl = (process.env.MEMBERS_BASE_URL ?? request.nextUrl.origin).replace(/\/$/, '')

  try {
    // De-dupe by email: reuse the existing token if they already signed up so
    // a re-submit doesn't create duplicates and the unsubscribe link stays stable.
    const existing = await writeClient.fetch<{ _id: string; unsubscribeToken?: string } | null>(
      `*[_type == "voteReminder" && email == $email][0]{ _id, unsubscribeToken }`,
      { email }
    )

    let unsubscribeToken: string
    if (existing) {
      unsubscribeToken = existing.unsubscribeToken ?? randomUUID()
      await writeClient
        .patch(existing._id)
        .set({
          name,
          zip,
          voteMethod,
          source,
          unsubscribed: false,
          unsubscribeToken,
        })
        .commit()
    } else {
      unsubscribeToken = randomUUID()
      await writeClient.create({
        _type: 'voteReminder',
        email,
        name,
        zip,
        voteMethod,
        source,
        createdAt: new Date().toISOString(),
        unsubscribed: false,
        unsubscribeToken,
      })
    }

    // Send the confirmation — failure here must NOT fail the capture.
    const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, unsubscribeToken)
    const payload = confirmationEmail(name, unsubscribeUrl)
    await sendReminderEmail({ ...payload, to: email })

    return NextResponse.json(SUCCESS)
  } catch (error) {
    console.error('Vote reminder signup failed:', error)
    return NextResponse.json(
      { ok: false, message: 'Something went wrong. Please try again in a moment.' },
      { status: 500 }
    )
  }
}
