import type { Metadata } from 'next'
import MemberLoginForm from '@/components/member-login-form'
import MemberPreviewLoginForm from '@/components/member-preview-login-form'
import { isPreviewPasswordEnabled } from '@/lib/members-auth'

export const metadata: Metadata = { title: 'Member Login' }

export default async function MemberLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const previewEnabled = isPreviewPasswordEnabled()

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Member Login</h1>
      <p className="text-[var(--color-text-muted)] mb-6">
        Committee members sign in with a one-time email link — no password needed.
      </p>

      {error === 'expired' && (
        <p className="mb-4 rounded-lg border border-[var(--color-gold)] bg-[var(--color-gold)]/10 px-4 py-3 text-sm text-[var(--color-navy)]">
          That sign-in link has expired or already been used. Request a new one below.
        </p>
      )}

      <MemberLoginForm />

      {previewEnabled && <MemberPreviewLoginForm />}

      <p className="mt-6 text-xs text-[var(--color-text-muted)]">
        Trouble signing in? Email{' '}
        <a href="mailto:Info@alleghenydems.com" className="text-[var(--color-blue-mid)] hover:underline">
          Info@alleghenydems.com
        </a>{' '}
        to update the address on file.
      </p>
    </div>
  )
}
