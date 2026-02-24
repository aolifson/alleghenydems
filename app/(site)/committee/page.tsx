import type { Metadata } from 'next'
import Image from 'next/image'
import { getCommitteeMembers } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export const metadata: Metadata = { title: 'Committee Members' }
export const revalidate = 3600

export default async function CommitteePage() {
  const members = await getCommitteeMembers()

  // Group by district
  const byDistrict = members.reduce<Record<string, typeof members>>((acc, m) => {
    const district = m.district ?? 'Other'
    if (!acc[district]) acc[district] = []
    acc[district].push(m)
    return acc
  }, {})

  const districts = Object.keys(byDistrict).sort()

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Committee Members</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        {members.length} committee members across Allegheny County wards and municipalities.
      </p>

      {districts.length === 0 && (
        <p className="text-[var(--color-text-muted)] py-8">Committee member directory coming soon.</p>
      )}

      {districts.map((district) => (
        <section key={district} className="mb-10">
          <h2 className="text-lg font-bold text-[var(--color-blue)] border-b-2 border-[var(--color-blue-light)] pb-2 mb-4">
            {district}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {byDistrict[district].map((member) => (
              <div key={member._id} className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm border border-[var(--color-border)]">
                {member.photo ? (
                  <div className="relative w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-[var(--color-blue-light)]">
                    <Image
                      src={urlFor(member.photo).width(96).height(96).url()}
                      alt={member.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[var(--color-blue-light)] flex items-center justify-center flex-shrink-0 text-[var(--color-blue)] font-bold text-lg">
                    {member.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate">{member.name}</p>
                  {member.title && <p className="text-xs text-[var(--color-text-muted)] truncate">{member.title}</p>}
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-xs text-[var(--color-blue-mid)] hover:underline truncate block">
                      {member.email}
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
