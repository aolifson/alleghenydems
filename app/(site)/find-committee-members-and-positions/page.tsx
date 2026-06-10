import { permanentRedirect } from 'next/navigation'

// Absorbed into the public committee directory.
export default function LegacyFindCommitteeMembersPage() {
  permanentRedirect('/committee-members')
}
