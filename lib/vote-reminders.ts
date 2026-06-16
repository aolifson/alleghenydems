import { Resend } from 'resend'
import { ELECTION } from '@/lib/election'

// Preferred sender requires the alleghenydems.com domain to be verified in
// Resend; until then we fall back to Resend's shared test sender so reminder
// emails still go out. Mirrors app/api/members/login/route.ts.
const PREFERRED_FROM =
  process.env.VOTE_REMINDERS_FROM_EMAIL ?? 'ACDC Vote Reminders <noreply@alleghenydems.com>'
const FALLBACK_FROM = 'ACDC Vote Reminders <onboarding@resend.dev>'

export const VOTE_REMINDER_METHODS = ['mail', 'in-person', 'undecided'] as const
export type VoteMethod = (typeof VOTE_REMINDER_METHODS)[number]

export const REMINDER_MILESTONES = ['registration', 'mail-ballot', 'election-day'] as const
export type ReminderMilestone = (typeof REMINDER_MILESTONES)[number]

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export function isValidEmail(email: string): boolean {
  // Deliberately permissive — Resend does the real validation on send.
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export interface ReminderEmailPayload {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Send via the preferred sender, falling back to Resend's test sender if the
 * preferred domain isn't verified yet. Never throws — returns whether a send
 * succeeded so callers can log/count without failing the request.
 */
export async function sendReminderEmail(payload: ReminderEmailPayload): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) {
    console.error('Vote reminder email skipped: RESEND_API_KEY is not set.')
    return false
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: PREFERRED_FROM, ...payload })
    if (!error) return true
    console.error('Vote reminder email failed from preferred sender, retrying with test sender:', error)
    const retry = await resend.emails.send({ from: FALLBACK_FROM, ...payload })
    if (retry.error) {
      console.error('Vote reminder email failed:', retry.error)
      return false
    }
    return true
  } catch (error) {
    console.error('Vote reminder email failed:', error)
    return false
  }
}

function emailShell(heading: string, bodyHtml: string, unsubscribeUrl: string): string {
  return `
<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #1e293b;">
  <div style="background: #0d2240; border-radius: 8px 8px 0 0; padding: 24px; text-align: center;">
    <p style="color: #ffffff; font-size: 18px; font-weight: 700; margin: 0;">Allegheny County Democratic Committee</p>
    <p style="color: rgba(255,255,255,0.7); font-size: 13px; margin: 4px 0 0;">Vote Reminders</p>
  </div>
  <div style="border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; padding: 28px 24px;">
    <h1 style="font-size: 18px; margin: 0 0 16px; color: #0d2240;">${heading}</h1>
    ${bodyHtml}
  </div>
  <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 16px 0 0;">
    You're receiving this because you asked ACDC to remind you to vote.
    <a href="${unsubscribeUrl}" style="color: #64748b;">Unsubscribe</a>.
  </p>
</div>`
}

const KEY_DATES_HTML = `
<ul style="font-size: 14px; line-height: 1.6; padding-left: 18px; margin: 0 0 16px;">
  <li><strong>Register by:</strong> ${ELECTION.registrationDeadlineLabel}</li>
  <li><strong>Apply for a mail ballot by:</strong> ${ELECTION.mailBallotApplicationDeadlineLabel}</li>
  <li><strong>Election Day:</strong> ${ELECTION.dateLabel} (polls ${ELECTION.pollHours})</li>
</ul>`

const KEY_DATES_TEXT = `Key dates for the ${ELECTION.name}:
- Register by: ${ELECTION.registrationDeadlineLabel}
- Apply for a mail ballot by: ${ELECTION.mailBallotApplicationDeadlineLabel}
- Election Day: ${ELECTION.dateLabel} (polls ${ELECTION.pollHours})`

/** Confirmation email sent right after someone signs up. */
export function confirmationEmail(name: string | undefined, unsubscribeUrl: string): ReminderEmailPayload {
  const greeting = name ? `Thanks, ${name}!` : 'Thanks for signing up!'
  const html = emailShell(
    "You're signed up for vote reminders",
    `<p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">${greeting} We'll send you a heads-up before each key deadline for the ${ELECTION.name} so your vote counts.</p>
     <p style="font-size: 14px; line-height: 1.6; margin: 0 0 8px;"><strong>Mark your calendar:</strong></p>
     ${KEY_DATES_HTML}
     <p style="font-size: 13px; color: #64748b; margin: 16px 0 0;">Questions? Just reply to this email or visit alleghenydems.com.</p>`,
    unsubscribeUrl
  )
  const text = `${greeting} You're signed up for vote reminders from the Allegheny County Democratic Committee.

${KEY_DATES_TEXT}

Unsubscribe anytime: ${unsubscribeUrl}`
  return {
    to: '',
    subject: "You're signed up for vote reminders",
    html,
    text,
  }
}

const MILESTONE_COPY: Record<ReminderMilestone, { subject: string; heading: string; line: string }> = {
  registration: {
    subject: `Reminder: register to vote by ${ELECTION.registrationDeadlineLabel}`,
    heading: 'Make sure you’re registered to vote',
    line: `The deadline to register (or update your registration) for the ${ELECTION.name} is <strong>${ELECTION.registrationDeadlineLabel}</strong>. If you’ve moved or aren’t sure, take a minute to check now.`,
  },
  'mail-ballot': {
    subject: `Reminder: apply for your mail ballot by ${ELECTION.mailBallotApplicationDeadlineLabel}`,
    heading: 'Apply for your mail ballot',
    line: `The deadline to apply for a mail ballot for the ${ELECTION.name} is <strong>${ELECTION.mailBallotApplicationDeadlineLabel}</strong>. Don’t wait — apply now so your ballot arrives with time to spare.`,
  },
  'election-day': {
    subject: `Reminder: Election Day is ${ELECTION.dateLabel}`,
    heading: 'Election Day is here',
    line: `Today (or very soon) is Election Day: <strong>${ELECTION.dateLabel}</strong>, polls open <strong>${ELECTION.pollHours}</strong>. If you have a mail ballot, return it ${ELECTION.mailBallotReturnLabel}. Make your plan and vote!`,
  },
}

/** Milestone reminder email (registration / mail-ballot / election-day). */
export function milestoneEmail(
  milestone: ReminderMilestone,
  name: string | undefined,
  unsubscribeUrl: string
): ReminderEmailPayload {
  const copy = MILESTONE_COPY[milestone]
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const html = emailShell(
    copy.heading,
    `<p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">${greeting}</p>
     <p style="font-size: 14px; line-height: 1.6; margin: 0 0 16px;">${copy.line}</p>
     <p style="text-align: center; margin: 24px 0;">
       <a href="https://www.alleghenydems.com/plan-to-vote" style="display: inline-block; background: #2563eb; color: #ffffff; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 6px;">Make your plan to vote</a>
     </p>`,
    unsubscribeUrl
  )
  const text = `${greeting}

${copy.line.replace(/<[^>]+>/g, '')}

Make your plan: https://www.alleghenydems.com/plan-to-vote

Unsubscribe: ${unsubscribeUrl}`
  return {
    to: '',
    subject: copy.subject,
    html,
    text,
  }
}

/** Build the absolute one-click unsubscribe URL for a token. */
export function buildUnsubscribeUrl(baseUrl: string, token: string): string {
  const base = baseUrl.replace(/\/$/, '')
  return `${base}/api/vote-reminders/unsubscribe?token=${encodeURIComponent(token)}`
}
