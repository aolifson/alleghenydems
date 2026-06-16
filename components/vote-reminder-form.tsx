'use client'
import { useState } from 'react'

type Status = 'idle' | 'sending' | 'sent' | 'error'

const VOTE_METHODS: { value: string; label: string }[] = [
  { value: 'mail', label: 'By mail' },
  { value: 'in-person', label: 'In person' },
  { value: 'undecided', label: 'Still deciding' },
]

const inputClass =
  'w-full px-3 py-2 border border-[var(--color-border)] rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue-mid)]'

export default function VoteReminderForm({ source = 'plan-to-vote' }: { source?: string }) {
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setStatus('sending')
    setErrorMsg('')

    const formData = new FormData(e.currentTarget)
    const payload = {
      email: String(formData.get('email') ?? ''),
      name: String(formData.get('name') ?? ''),
      voteMethod: String(formData.get('voteMethod') ?? ''),
      source,
    }

    try {
      const res = await fetch('/api/vote-reminders/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (res.ok && data.ok) {
        setStatus('sent')
      } else {
        setStatus('error')
        setErrorMsg(data.message ?? 'Something went wrong. Please try again.')
      }
    } catch {
      setStatus('error')
      setErrorMsg('Network error. Please try again.')
    }
  }

  if (status === 'sent') {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
        ✅ You&rsquo;re signed up! We&rsquo;ll remind you before each key voting deadline. Check your inbox
        for a confirmation.
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="vr-email" className="block text-sm font-medium mb-1">
          Email <span className="text-[var(--color-red)]">*</span>
        </label>
        <input id="vr-email" name="email" type="email" required autoComplete="email" className={inputClass} />
      </div>

      <div>
        <label htmlFor="vr-name" className="block text-sm font-medium mb-1">
          First name <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
        </label>
        <input id="vr-name" name="name" type="text" autoComplete="given-name" className={inputClass} />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium mb-1">
          How do you plan to vote?{' '}
          <span className="text-[var(--color-text-muted)] font-normal">(optional)</span>
        </legend>
        <div className="flex flex-wrap gap-x-5 gap-y-2 pt-1">
          {VOTE_METHODS.map((m) => (
            <label key={m.value} className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="voteMethod"
                value={m.value}
                className="h-4 w-4 accent-[var(--color-blue)]"
              />
              {m.label}
            </label>
          ))}
        </div>
      </fieldset>

      <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
        By signing up you agree to receive occasional voting reminders from ACDC. Unsubscribe anytime.
      </p>

      {status === 'error' && <p className="text-sm text-[var(--color-red)]">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="w-full py-2 px-4 bg-[var(--color-blue)] hover:bg-[var(--color-navy)] text-white font-semibold rounded transition-colors disabled:opacity-60"
      >
        {status === 'sending' ? 'Signing you up…' : 'Remind me to vote'}
      </button>
    </form>
  )
}
