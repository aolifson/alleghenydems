'use client'

import { useState } from 'react'

export default function MemberLoginForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'sending') return
    setStatus('sending')
    try {
      const res = await fetch('/api/members/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      setMessage(data.message ?? 'If that address is on file, a sign-in link is on its way.')
      setStatus(res.ok ? 'sent' : 'error')
    } catch {
      setMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="bg-[var(--color-blue-light)] border border-[var(--color-blue)]/30 rounded-lg p-5 text-sm text-[var(--color-navy)]">
        <p className="font-semibold mb-1">Check your email</p>
        <p>{message}</p>
        <p className="mt-2 text-[var(--color-text-muted)]">
          The link expires in 15 minutes. Didn&rsquo;t get it? Check spam, or{' '}
          <button type="button" onClick={() => setStatus('idle')} className="text-[var(--color-blue-mid)] underline">
            try again
          </button>.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="member-login-email" className="block text-sm font-semibold text-[var(--color-navy)] mb-1">
          Email address
        </label>
        <input
          id="member-login-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
        />
        <p className="mt-1.5 text-xs text-[var(--color-text-muted)]">
          Use the email address the committee has on file for you.
        </p>
      </div>
      {status === 'error' && (
        <p className="text-sm text-[var(--color-red)]">{message}</p>
      )}
      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full px-4 py-2.5 bg-[var(--color-blue)] hover:opacity-90 text-white text-sm font-semibold rounded-lg transition-opacity disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Email me a sign-in link'}
      </button>
    </form>
  )
}
