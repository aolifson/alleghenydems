import type { PortableTextComponents } from '@portabletext/react'
import Image from 'next/image'
import ExternalLink, { isExternalHref } from '@/components/external-link'
import { urlFor } from '@/sanity/lib/image'

type InlineImageValue = {
  asset?: unknown
  alt?: string
  caption?: string
}

// Shared rendering for Sanity Portable Text body content.
// The default <PortableText> drops `link` annotations (no anchor is rendered)
// and silently skips any block type it doesn't have a component for — which
// includes the `image` blocks editors can insert into page/news body content.
// Any page rendering body content must pass these components, or inline
// images added in the Studio will never appear on the site.
export const portableTextComponents: PortableTextComponents = {
  marks: {
    link: ({ value, children }) => {
      const href = (value as { href?: string } | undefined)?.href ?? ''
      const className = 'text-[var(--color-blue-mid)] underline hover:no-underline'
      if (isExternalHref(href)) {
        return (
          <ExternalLink href={href} className={className}>
            {children}
          </ExternalLink>
        )
      }
      return (
        <a href={href} className={className}>
          {children}
        </a>
      )
    },
  },
  types: {
    image: ({ value }) => {
      const image = value as InlineImageValue
      if (!image?.asset) return null
      return (
        <figure className="my-6">
          <Image
            src={urlFor(image).width(1200).fit('max').url()}
            alt={image.alt ?? ''}
            width={1200}
            height={800}
            sizes="(min-width: 768px) 768px, 100vw"
            className="rounded-lg w-full h-auto"
          />
          {image.caption && (
            <figcaption className="mt-2 text-sm text-center text-[var(--color-text-muted)]">
              {image.caption}
            </figcaption>
          )}
        </figure>
      )
    },
  },
}
