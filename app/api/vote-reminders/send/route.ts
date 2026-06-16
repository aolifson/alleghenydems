import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { writeClient } from '@/sanity/lib/client'
import {
  milestoneEmail,
  sendReminderEmail,
  buildUnsubscribeUrl,
  REMINDER_MILESTONES,
  type ReminderMilestone,
} from '@/lib/vote-reminders'

interface Subscriber {
  email: string
  name?: string
  unsubscribeToken?: string
}

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.REMINDER_SEND_SECRET
  if (!secret) return false
  const header = request.headers.get('authorization')
  const bearer = header?.startsWith('Bearer ') ? header.slice(7) : null
  const provided =
    request.headers.get('x-reminder-secret') ??
    bearer ??
    request.nextUrl.searchParams.get('secret')
  return provided === secret
}

function coerceMilestone(value: unknown): ReminderMilestone | null {
  return REMINDER_MILESTONES.includes(value as ReminderMilestone)
    ? (value as ReminderMilestone)
    : null
}

export async function POST(request: NextRequest) {
  if (!process.env.REMINDER_SEND_SECRET) {
    return NextResponse.json(
      { ok: false, message: 'REMINDER_SEND_SECRET is not configured.' },
      { status: 503 }
    )
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, message: 'Unauthorized.' }, { status: 401 })
  }

  let milestone: ReminderMilestone | null = null
  try {
    const body = (await request.json()) as Record<string, unknown>
    milestone = coerceMilestone(body.milestone)
  } catch {
    milestone = coerceMilestone(request.nextUrl.searchParams.get('milestone'))
  }

  if (!milestone) {
    return NextResponse.json(
      { ok: false, message: `milestone must be one of: ${REMINDER_MILESTONES.join(', ')}` },
      { status: 400 }
    )
  }

  const baseUrl = (process.env.MEMBERS_BASE_URL ?? request.nextUrl.origin).replace(/\/$/, '')

  const subscribers = await writeClient.fetch<Subscriber[]>(
    `*[_type == "voteReminder" && unsubscribed != true && defined(email)]{ email, name, unsubscribeToken }`
  )

  let sent = 0
  let failed = 0
  for (const sub of subscribers) {
    // Skip rows with no token — we can't build a valid unsubscribe link.
    if (!sub.unsubscribeToken) {
      failed += 1
      continue
    }
    const unsubscribeUrl = buildUnsubscribeUrl(baseUrl, sub.unsubscribeToken)
    const payload = milestoneEmail(milestone, sub.name, unsubscribeUrl)
    const ok = await sendReminderEmail({ ...payload, to: sub.email })
    if (ok) sent += 1
    else failed += 1
  }

  return NextResponse.json({
    ok: true,
    milestone,
    total: subscribers.length,
    sent,
    failed,
  })
}
