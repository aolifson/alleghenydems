'use client'

import { useState } from 'react'

export default function MemberPreviewLoginForm() {
  const [password, setPassword] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting') return
    setStatus('submitting')
    try {
      const res = await fetch('/api/members/preview-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        window.location.assign('/members')
        return
      }
      const data = await res.json().catch(() => ({}))
      setMessage(data.message ?? 'Incorrect password.')
      setStatus('error')
    } catch {
      setMessage('Something went wrong. Please try again.')
      setStatus('error')
    }
  }

  return (
    <div className="mt-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <p className="text-sm font-semibold text-[var(--color-navy)]">Reviewer access</p>
      <p className="mt-1 text-xs text-[var(--color-text-muted)]">
        Previewing the site? Enter the shared access password.
      </p>
      <form onSubmit={handleSubmit} className="mt-3 flex flex-col sm:flex-row gap-2">
        <input
          type="password"
          required
          autoComplete="off"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Access password"
          className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          className="px-4 py-2 bg-[var(--color-navy)] hover:opacity-90 text-white text-sm font-semibold rounded-lg transition-opacity disabled:opacity-60"
        >
          {status === 'submitting' ? 'Checking…' : 'Enter'}
        </button>
      </form>
      {status === 'error' && <p className="mt-2 text-sm text-[var(--color-red)]">{message}</p>}
    </div>
  )
}
