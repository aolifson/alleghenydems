import type { AnchorHTMLAttributes } from 'react'

// Hosts that count as "our site" — links to these never get the ↗ treatment.
const INTERNAL_HOSTS = ['alleghenydems.com']

/**
 * True for http(s) hrefs that leave the site's own domains
 * (alleghenydems.com, *.alleghenydems.com, *.vercel.app previews).
 * Internal paths (/about), mailto:, tel:, and hash links return false.
 */
export function isExternalHref(href: string): boolean {
  if (!/^https?:\/\//i.test(href)) return false
  try {
    const host = new URL(href).hostname.toLowerCase()
    if (INTERNAL_HOSTS.some((domain) => host === domain || host.endsWith(`.${domain}`))) return false
    if (host.endsWith('.vercel.app')) return false
    return true
  } catch {
    return true
  }
}

export function ExternalLinkIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  )
}

/**
 * Anchor for links that leave the site: opens in a new tab, shows an inline
 * ↗ icon, and announces "(opens in new tab)" to screen readers.
 */
export default function ExternalLink({
  href,
  children,
  className,
  iconClassName = 'h-3 w-3',
  ...rest
}: AnchorHTMLAttributes<HTMLAnchorElement> & { iconClassName?: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
      <ExternalLinkIcon className={`inline-block ml-1 shrink-0 align-[-0.05em] ${iconClassName}`} />
      <span className="sr-only"> (opens in new tab)</span>
    </a>
  )
}
