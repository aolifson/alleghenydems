import { cookies } from 'next/headers'
import { client } from '@/sanity/lib/client'
import {
  SESSION_COOKIE,
  verifyMemberToken,
  normalizeEmail,
  isAdminEmail,
  isPreviewPasswordEnabled,
  PREVIEW_SESSION_EMAIL,
} from './members-auth'

/** Email from a valid member_session cookie, else null. Node runtime only. */
export async function getSessionEmail(): Promise<string | null> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (!token) return null
  return verifyMemberToken(token, 'session')
}

/**
 * Session email re-checked against Sanity for isActive == true.
 * Sensitive routes (roster, internal docs) call this so access
 * self-revokes when a member is deactivated, even with a live cookie.
 */
export async function getActiveMemberEmail(): Promise<string | null> {
  const email = await getSessionEmail()
  if (!email) return null
  // Preview shared-password sessions stay valid only while the env var is set.
  if (email === PREVIEW_SESSION_EMAIL) return isPreviewPasswordEnabled() ? email : null
  if (isAdminEmail(email)) return email
  const match = await client.withConfig({ useCdn: false }).fetch<string | null>(
    `*[_type == "committeeMember" && isActive == true && lower(email) == $email][0].email`,
    { email: normalizeEmail(email) }
  )
  return match ? email : null
}
