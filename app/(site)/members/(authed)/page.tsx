import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Members Area' }

export default function MembersHomePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Welcome, committee member</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Resources for Allegheny County Democratic Committee members. This area is not visible to the public.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        {[
          {
            title: 'Member Roster',
            description: 'The full committee roster with phone numbers and emails, plus a CSV download.',
            href: '/members/roster',
            icon: '📇',
          },
          {
            title: 'Documents',
            description: 'Bylaws, minutes, forms, and training materials.',
            href: '/members/documents',
            icon: '📁',
          },
          {
            title: 'Vote Review Queue',
            description: 'Approve or reject auto-imported legislative votes before they reach the public tracker.',
            href: '/members/review',
            icon: '🗳️',
          },
          {
            title: 'Admin Guide',
            description: 'How to manage the website and Sanity content.',
            href: '/members/admin-guide',
            icon: '🛠️',
          },
        ].map(({ title, description, href, icon }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col gap-2 p-5 bg-white rounded-xl border border-[var(--color-border)] hover:border-[var(--color-blue-mid)] hover:shadow-md transition-all group"
          >
            <span className="text-2xl">{icon}</span>
            <span className="font-semibold text-[var(--color-blue-mid)] group-hover:underline">{title}</span>
            <span className="text-sm text-[var(--color-text-muted)]">{description}</span>
          </Link>
        ))}
      </div>

      <p className="text-sm text-[var(--color-text-muted)]">
        Access problems or a change of email address? Contact{' '}
        <a href="mailto:Info@alleghenydems.com" className="text-[var(--color-blue-mid)] hover:underline">
          Info@alleghenydems.com
        </a>.
      </p>
    </div>
  )
}
