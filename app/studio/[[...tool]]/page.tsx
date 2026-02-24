/**
 * Embedded Sanity Studio — accessible at /studio
 * Sanity handles its own authentication via Sanity accounts.
 */
import SanityStudio from '@/components/sanity-studio'

export const dynamic = 'force-dynamic'

export default function StudioPage() {
  return <SanityStudio />
}
