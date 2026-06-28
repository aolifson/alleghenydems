import type { PortableTextComponents } from '@portabletext/react'
import ExternalLink, { isExternalHref } from '@/components/external-link'

// Shared rendering for Sanity Portable Text body content.
// The default <PortableText> drops `link` annotations (no anchor is rendered),
// so pages that use links in their body must pass these components.
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
}
