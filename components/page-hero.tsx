import Image from 'next/image'
import { urlFor } from '@/sanity/lib/image'
import type { SanityImage } from '@/sanity/lib/queries'

interface PageHeroProps {
  headline: string
  subhead?: string
  image?: SanityImage
  rounded?: boolean
  framedText?: boolean
  minHeightClassName?: string
}

export default function PageHero({
  headline,
  subhead,
  image,
  rounded = true,
  framedText = false,
  minHeightClassName = 'min-h-[260px]',
}: PageHeroProps) {
  if (!image) {
    return (
      <section className="mb-8">
        <h1 className="font-display text-3xl font-bold text-[var(--color-blue)] mb-2">{headline}</h1>
        {subhead && <p className="text-[var(--color-text-muted)]">{subhead}</p>}
      </section>
    )
  }

  return (
    <section className={`mb-8 relative overflow-hidden ${rounded ? 'rounded-lg' : ''} ${minHeightClassName}`}>
      <Image
        src={urlFor(image).width(1600).height(720).url()}
        alt={headline}
        fill
        className="object-cover"
        priority
      />
      <div className="absolute inset-0" style={{ backgroundColor: 'rgba(13, 34, 64, 0.55)' }} />
      <div className="relative z-10 px-8 py-10 md:px-12 md:py-14 max-w-4xl text-white">
        <div className={framedText ? 'inline-block border-4 border-white px-6 py-5 md:px-8 md:py-7' : ''}>
          <h1 className="font-display text-4xl md:text-5xl font-bold leading-tight uppercase tracking-wide">
            {headline}
          </h1>
          {subhead && (
            <p className="mt-4 text-lg md:text-xl text-white/90 leading-relaxed">
              {subhead}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
