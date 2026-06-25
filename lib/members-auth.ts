import { SignJWT, jwtVerify } from 'jose'

// Stateless signed tokens for the members-only area. Two purposes:
// 'login'   — short-lived token embedded in the magic-link email
// 'session' — long-lived token stored in the member_session cookie
// jose (not node crypto) so verification also works in edge middleware.

export const SESSION_COOKIE = 'member_session'
export const LOGIN_TOKEN_TTL = '15m'
export const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30 // 30 days

export type TokenPurpose = 'login' | 'session'

function secretKey(): Uint8Array | null {
  const secret = process.env.AUTH_SECRET
  if (!secret) return null
  return new TextEncoder().encode(secret)
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/**
 * Site admins who can sign in to the members area without being a
 * committeeMember in Sanity — from MEMBERS_ADMIN_EMAILS (comma-separated).
 */
export function isAdminEmail(email: string): boolean {
  const list = process.env.MEMBERS_ADMIN_EMAILS
  if (!list) return false
  const normalized = normalizeEmail(email)
  return list
    .split(',')
    .map((entry) => normalizeEmail(entry))
    .filter(Boolean)
    .includes(normalized)
}

// ── Preview-phase shared password ────────────────────────────────────────────
// A single shared password (env MEMBERS_PREVIEW_PASSWORD) that lets reviewers
// into the members area while the site is still private and real per-person
// email links aren't deliverable yet (Resend domain unverified). Sessions
// minted this way carry this sentinel email. REMOVE the env var at public
// launch — its mere presence is the on/off switch.
export const PREVIEW_SESSION_EMAIL = 'preview-reviewer@members.local'

export function isPreviewPasswordEnabled(): boolean {
  return Boolean(process.env.MEMBERS_PREVIEW_PASSWORD)
}

export function checkPreviewPassword(provided: string): boolean {
  const secret = process.env.MEMBERS_PREVIEW_PASSWORD
  if (!secret || !provided || provided.length !== secret.length) return false
  let mismatch = 0
  for (let i = 0; i < secret.length; i++) {
    mismatch |= provided.charCodeAt(i) ^ secret.charCodeAt(i)
  }
  return mismatch === 0
}

export async function signMemberToken(email: string, purpose: TokenPurpose): Promise<string> {
  const key = secretKey()
  if (!key) throw new Error('AUTH_SECRET is not set')
  return new SignJWT({ email, purpose })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(purpose === 'login' ? LOGIN_TOKEN_TTL : `${SESSION_TTL_SECONDS}s`)
    .sign(key)
}

/** Returns the member email for a valid token of the given purpose, else null. */
export async function verifyMemberToken(token: string, purpose: TokenPurpose): Promise<string | null> {
  const key = secretKey()
  if (!key) return null
  try {
    const { payload } = await jwtVerify(token, key)
    if (payload.purpose !== purpose || typeof payload.email !== 'string') return null
    return payload.email
  } catch {
    return null
  }
}
