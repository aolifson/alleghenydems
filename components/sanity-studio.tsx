'use client'
import nextDynamic from 'next/dynamic'

const StudioConfig = nextDynamic(
  async () => {
    const [{ NextStudio }, config] = await Promise.all([
      import('next-sanity/studio'),
      import('@/sanity.config'),
    ])
    const Wrapped = () => <NextStudio config={config.default} />
    Wrapped.displayName = 'SanityStudio'
    return { default: Wrapped }
  },
  { ssr: false }
)

export default function SanityStudio() {
  return <StudioConfig />
}
