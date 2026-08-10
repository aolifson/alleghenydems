import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getInternalDocs } from '@/sanity/lib/queries'
import { getActiveMemberEmail } from '@/lib/members-session'

export const metadata: Metadata = { title: 'Member Documents' }

const CATEGORY_ORDER = ['Bylaws', 'Minutes', 'Forms', 'Training', 'Other']

export default async function MemberDocumentsPage() {
  const email = await getActiveMemberEmail()
  if (!email) redirect('/members/login')

  const docs = await getInternalDocs()

  const byCategory = docs.reduce<Record<string, typeof docs>>((acc, doc) => {
    const category = doc.category ?? 'Other'
    if (!acc[category]) acc[category] = []
    acc[category].push(doc)
    return acc
  }, {})
  const categories = [
    ...CATEGORY_ORDER.filter((c) => byCategory[c]?.length),
    ...Object.keys(byCategory).filter((c) => !CATEGORY_ORDER.includes(c)),
  ]

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Documents</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Internal committee documents. Downloads are available to signed-in members only.
      </p>

      {docs.length === 0 ? (
        <p className="text-[var(--color-text-muted)]">No documents have been published yet.</p>
      ) : (
        categories.map((category) => (
          <section key={category} className="mb-8">
            <h2 className="text-lg font-bold text-[var(--color-blue)] mb-3">{category}</h2>
            <ul className="space-y-2">
              {byCategory[category].map((doc) => (
                <li key={doc._id}>
                  <a
                    href={doc.externalUrl ?? `/api/members/doc/${doc._id}`}
                    {...(doc.externalUrl ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    className="flex items-start gap-3 p-3 bg-white rounded-lg border border-[var(--color-border)] hover:border-[var(--color-blue-mid)] hover:shadow-sm transition-all group"
                  >
                    <span className="text-xl" aria-hidden="true">📄</span>
                    <div className="flex-1">
                      <span className="font-semibold text-[var(--color-blue-mid)] group-hover:underline">
                        {doc.title}
                      </span>
                      {doc.description && (
                        <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{doc.description}</p>
                      )}
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {[
                          doc.fileExtension?.toUpperCase(),
                          doc.publishedAt && new Date(doc.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </p>
                    </div>
                    <span className="text-[var(--color-text-muted)] text-sm shrink-0 mt-0.5">
                      {doc.externalUrl ? 'Open ↗' : 'Download ↓'}
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
