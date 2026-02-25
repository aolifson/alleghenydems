import Link from 'next/link'

interface SocialLinksProps {
  facebookUrl?: string
  instagramUrl?: string
  xUrl?: string
  className?: string
}

const ICON_CLASS = 'h-4 w-4'

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={ICON_CLASS} fill="currentColor">
      <path d="M13.5 8.5V6.8c0-.6.4-1 1-1H16V3h-2c-2.5 0-3.5 1.3-3.5 3.7v1.8H8V12h2.5v9h3V12H16l.5-3.5h-3Z" />
    </svg>
  )
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={ICON_CLASS} fill="currentColor">
      <path d="M7.5 3h9A4.5 4.5 0 0 1 21 7.5v9a4.5 4.5 0 0 1-4.5 4.5h-9A4.5 4.5 0 0 1 3 16.5v-9A4.5 4.5 0 0 1 7.5 3Zm0 1.8A2.7 2.7 0 0 0 4.8 7.5v9a2.7 2.7 0 0 0 2.7 2.7h9a2.7 2.7 0 0 0 2.7-2.7v-9a2.7 2.7 0 0 0-2.7-2.7h-9Zm4.5 2.8A4.4 4.4 0 1 1 7.6 12 4.4 4.4 0 0 1 12 7.6Zm0 1.8a2.6 2.6 0 1 0 2.6 2.6A2.6 2.6 0 0 0 12 9.4Zm4.8-2.9a1.1 1.1 0 1 1-1.1 1.1 1.1 1.1 0 0 1 1.1-1.1Z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={ICON_CLASS} fill="currentColor">
      <path d="M18.9 3H22l-6.8 7.7L23 21h-6.1l-4.8-6.2L6.7 21H3.6l7.3-8.2L1 3h6.3l4.3 5.7L18.9 3Zm-1.1 16.1h1.7L6.3 4.8H4.5l13.3 14.3Z" />
    </svg>
  )
}

export default function SocialLinks({
  facebookUrl,
  instagramUrl,
  xUrl,
  className = '',
}: SocialLinksProps) {
  if (!facebookUrl && !instagramUrl && !xUrl) return null

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {facebookUrl && (
        <Link
          href={facebookUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Facebook"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-blue-mid)] hover:bg-[var(--color-blue-light)] transition-colors"
        >
          <FacebookIcon />
        </Link>
      )}
      {instagramUrl && (
        <Link
          href={instagramUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Instagram"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-blue-mid)] hover:bg-[var(--color-blue-light)] transition-colors"
        >
          <InstagramIcon />
        </Link>
      )}
      {xUrl && (
        <Link
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="X"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[var(--color-border)] text-[var(--color-blue-mid)] hover:bg-[var(--color-blue-light)] transition-colors"
        >
          <XIcon />
        </Link>
      )}
    </div>
  )
}
