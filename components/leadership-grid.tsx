'use client'

import { useState } from 'react'
import MemberCard from './member-card'
import type { CommitteeMember } from '@/sanity/lib/queries'

// Same click-to-expand card as the full committee directory (see
// member-directory.tsx), scaled down to a plain grid with no search/filter
// bar — used for small, curated groups like the Who We Are leadership list.
export default function LeadershipGrid({ members }: { members: CommitteeMember[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {members.map((member) => (
        <MemberCard
          key={member._id}
          member={member}
          expanded={expandedId === member._id}
          onToggle={() => setExpandedId(expandedId === member._id ? null : member._id)}
        />
      ))}
    </div>
  )
}
