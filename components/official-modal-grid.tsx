'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import SocialLinks from '@/components/social-links'
import { urlFor } from '@/sanity/lib/image'
import type { CommitteeMember } from '@/sanity/lib/queries'

// Elected Officials render in a dense 5-across grid, so expanding a card in
// place (the pattern the committee directory uses) would shove the whole grid
// around. These open a dialog instead, matching how the old WordPress site
// presented officials. Uses native <dialog> so focus trapping, Esc-to-close,
// and the backdrop come from the platform rather than hand-rolled JS.
function OfficialDialog({ official, onClose }: { official: CommitteeMember | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (official && !el.open) el.showModal()
    if (!official && el.open) el.close()
  }, [official])

  // Covers Esc and any other platform-initiated close.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('close', onClose)
    return () => el.removeEventListener('close', onClose)
  }, [onClose])

  return (
    <dialog
      ref={ref}
      aria-labelledby="official-dialog-name"
      onClick={(e) => {
        // Clicks land on <dialog> itself only when the backdrop is hit.
        if (e.target === ref.current) ref.current?.close()
      }}
      className="w-[min(36rem,calc(100vw-2rem))] max-h-[85vh] p-0 rounded-xl border border-[var(--color-border)] shadow-xl backdrop:bg-black/60 open:flex flex-col bg-white"
    >
      {official && (
        <>
          <div className="flex items-start gap-4 p-6 pb-4 border-b border-[var(--color-border)]">
            {official.photo?.asset && (
              <Image
                src={urlFor(official.photo).width(200).height(200).url()}
                alt={official.name}
                width={100}
                height={100}
                className="rounded-lg object-cover shrink-0"
              />
            )}
            <div className="min-w-0 flex-1">
              <h2 id="official-dialog-name" className="font-display text-xl font-bold text-[var(--color-navy)] leading-tight">
                {official.name}
              </h2>
              {official.title && (
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{official.title}</p>
              )}
              <div className="mt-2 flex justify-start">
                {/* No websiteUrl here — the dialog has room for an explicit
                    "Official website" text link below, which reads better than
                    a globe icon. The compact card uses the icon instead. */}
                <SocialLinks
                  facebookUrl={official.facebookUrl}
                  instagramUrl={official.instagramUrl}
                  xUrl={official.xUrl}
                  ownerName={official.name}
                  className="!justify-start"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="shrink-0 -mt-1 -mr-1 h-8 w-8 rounded-full text-[var(--color-text-muted)] hover:bg-[var(--color-blue-light)] hover:text-[var(--color-blue-mid)] transition-colors text-lg leading-none"
            >
              ×
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-5">
            {official.bio ? (
              <p className="text-sm leading-relaxed text-[var(--color-text)] whitespace-pre-line">{official.bio}</p>
            ) : (
              <p className="text-sm text-[var(--color-text-muted)]">No biography on file yet.</p>
            )}
            {official.websiteUrl && (
              <a
                href={official.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-[var(--color-blue-mid)] hover:underline"
              >
                Official website ↗
              </a>
            )}
          </div>
        </>
      )}
    </dialog>
  )
}

export default function OfficialModalGrid({ officials }: { officials: CommitteeMember[] }) {
  const [selected, setSelected] = useState<CommitteeMember | null>(null)
  const handleClose = useCallback(() => setSelected(null), [])

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
        {officials.map((official) => (
          // The social links have to be siblings of the button, not inside it —
          // nesting anchors within a button is invalid and swallows their clicks.
          <div key={official._id} className="flex flex-col items-center text-center gap-2">
            <button
              type="button"
              onClick={() => setSelected(official)}
              className="flex flex-col items-center text-center gap-2 rounded-lg p-2 -m-2 cursor-pointer hover:bg-[var(--color-blue-light)]/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-blue)] transition-colors"
            >
              {official.photo?.asset ? (
                <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[var(--color-blue-light)] shrink-0 shadow-sm">
                  <Image
                    src={urlFor(official.photo).width(192).height(192).url()}
                    alt={official.name}
                    fill
                    className="object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-[var(--color-blue-light)] flex items-center justify-center shrink-0 text-[var(--color-blue)] font-bold text-2xl shadow-sm">
                  {official.name.charAt(0)}
                </div>
              )}
              <div>
                <p className="font-semibold text-sm text-[var(--color-text)] leading-tight">{official.name}</p>
                {official.title && (
                  <p className="text-xs text-[var(--color-text-muted)] mt-0.5 leading-tight">{official.title}</p>
                )}
              </div>
            </button>

            <SocialLinks
              facebookUrl={official.facebookUrl}
              instagramUrl={official.instagramUrl}
              xUrl={official.xUrl}
              websiteUrl={official.websiteUrl}
              ownerName={official.name}
              className="mt-0.5"
            />
          </div>
        ))}
      </div>

      <OfficialDialog official={selected} onClose={handleClose} />
    </>
  )
}
