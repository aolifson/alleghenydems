import Link from 'next/link'

const MEMBERS_NAV = [
  { label: 'Overview', href: '/members' },
  { label: 'Roster', href: '/members/roster' },
  { label: 'Documents', href: '/members/documents' },
]

export default function MembersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-[var(--color-border)] pb-3 mb-8">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide px-2.5 py-1 rounded-full bg-[var(--color-navy)] text-white">
          🔒 Members Area
        </span>
        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          {MEMBERS_NAV.map(({ label, href }) => (
            <Link key={href} href={href} className="font-medium text-[var(--color-blue-mid)] hover:underline">
              {label}
            </Link>
          ))}
          {/* Plain anchor: the admin guide is a standalone HTML document */}
          <a href="/members/admin-guide" className="font-medium text-[var(--color-blue-mid)] hover:underline">
            Admin Guide
          </a>
        </nav>
        <form action="/api/members/logout" method="post" className="ml-auto">
          <button type="submit" className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline">
            Sign out
          </button>
        </form>
      </div>
      {children}
    </div>
  )
}
