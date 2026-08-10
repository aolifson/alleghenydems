import type { Metadata } from 'next'
import OfficialModalGrid from '@/components/official-modal-grid'
import { getElectedOfficials, type CommitteeMember } from '@/sanity/lib/queries'

export const metadata: Metadata = { title: 'Elected Officials' }
export const revalidate = 600

const CATEGORY_ORDER = [
  'U.S. Congress & Senate',
  'Governor & Lt. Governor',
  'Pennsylvania State Senate',
  'Pennsylvania State House',
  'City of Pittsburgh',
  'Allegheny County Officials',
  'Allegheny County Council',
  'Other Officials',
]

// District numbers live inside the title string ("State Representative—District
// 21"), so they can't be ordered in GROQ. Pull the number out and sort on it,
// otherwise districts read 10, 11, 12, 19, 2, 20 — the complaint that prompted
// this. Titles with no district (Governor, Sheriff) sort first, then by name.
function districtNumber(title?: string): number {
  const match = title?.match(/district\s*[-—–]?\s*(\d+)/i)
  return match ? Number(match[1]) : -1
}

function byDistrictThenName(a: CommitteeMember, b: CommitteeMember): number {
  const districtDiff = districtNumber(a.title) - districtNumber(b.title)
  if (districtDiff !== 0) return districtDiff
  return a.name.localeCompare(b.name)
}

function categorize(title: string): string {
  const t = title.toLowerCase()
  if (t.includes('congress') || t.includes('u.s. sen')) return 'U.S. Congress & Senate'
  if (t.includes('governor')) return 'Governor & Lt. Governor'
  if (t.includes('state senator') || t.includes('state senate')) return 'Pennsylvania State Senate'
  if (t.includes('state rep')) return 'Pennsylvania State House'
  if (t.includes('mayor')) return 'City of Pittsburgh'
  if (t.includes('county executive') || t.includes('district attorney') || t.includes('sheriff')) return 'Allegheny County Officials'
  if (t.includes('county council')) return 'Allegheny County Council'
  return 'Other Officials'
}

export default async function ElectedOfficialsPage() {
  const officials = await getElectedOfficials()

  const byCategory = officials.reduce<Record<string, typeof officials>>((acc, o) => {
    const cat = categorize(o.title ?? '')
    ;(acc[cat] ??= []).push(o)
    return acc
  }, {})
  for (const list of Object.values(byCategory)) list.sort(byDistrictThenName)

  const categories = CATEGORY_ORDER.filter(c => byCategory[c]?.length)

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">Elected Officials</h1>
      <p className="text-[var(--color-text-muted)] mb-8">
        Democratic elected officials serving Allegheny County. Select anyone to read their biography.
      </p>

      {categories.map(cat => (
        <section key={cat} className="mb-10">
          <h2 className="text-lg font-bold text-[var(--color-blue)] border-b-2 border-[var(--color-blue-light)] pb-2 mb-5">
            {cat}
          </h2>
          <OfficialModalGrid officials={byCategory[cat]} />
        </section>
      ))}
    </div>
  )
}
