import { writeClient } from '@/sanity/lib/client'
import type { LegislativeAction, LegislativeTrackerDocument } from '@/sanity/lib/queries'

// Server-only helpers for the members-area vote review queue.
// Auto-imported votes live in the *draft* tracker document (flagged needsReview),
// so reads and writes here go through the authed write client — the public CDN
// client can't see drafts.

export const TRACKER_DOC_ID = 'legislative-tracker'
export const TRACKER_DRAFT_ID = `drafts.${TRACKER_DOC_ID}`

export const ACTION_TYPES = ['accomplishment', 'blocked', 'harmful'] as const
export type ActionType = (typeof ACTION_TYPES)[number]

/** Placeholder category the importer assigns; never offered as a real choice. */
export const IMPORT_PLACEHOLDER_CATEGORY = 'Needs Review'

/** Slimmed-down, client-safe shape for one vote awaiting review. */
export interface ReviewItem {
  key: string
  official: string
  party: 'D' | 'R'
  office: string
  date: string
  chamber?: string
  billId?: string
  billSummary?: string
  voteValue?: string
  voteResult?: string
  partyBreakdown?: string
  crossedParty?: boolean
  sourceLabel?: string
  sourceUrl?: string
  /** Pre-filled starting point for the voter-facing description. */
  suggestedDescription: string
}

export interface TrackerDocs {
  draft: LegislativeTrackerDocument | null
  published: LegislativeTrackerDocument | null
}

export async function fetchTrackerDocs(): Promise<TrackerDocs> {
  const docs = await writeClient.fetch<LegislativeTrackerDocument[]>(
    `*[_id in [$draftId, $docId]]`,
    { draftId: TRACKER_DRAFT_ID, docId: TRACKER_DOC_ID },
    { cache: 'no-store' }
  )
  return {
    draft: docs.find((d) => d._id === TRACKER_DRAFT_ID) ?? null,
    published: docs.find((d) => d._id === TRACKER_DOC_ID) ?? null,
  }
}

/**
 * What the bill does, in plain-ish language. Older imports didn't set
 * billSummary, but their description leads with "Voted Nay on PA HB144: <bill
 * title>…" — recover the title from there.
 */
function deriveBillSummary(action: LegislativeAction, cleanDescription: string): string | undefined {
  const explicit = action.billSummary?.trim()
  if (explicit) return explicit
  const firstLine = cleanDescription.split('\n')[0]?.trim()
  if (!firstLine) return undefined
  const match = firstLine.match(/^Voted\s+[A-Za-z ]+\s+on\s+[^:]+:\s*(.+)$/)
  return (match ? match[1] : firstLine).trim() || undefined
}

/** All actions still awaiting review, newest first. */
export function extractReviewItems(doc: LegislativeTrackerDocument): ReviewItem[] {
  return (doc.actions ?? [])
    .filter((a) => a.needsReview && a._key)
    .map((a) => {
      // Imported description minus its editor-instruction boilerplate.
      const cleanDescription = (a.description ?? '').split('[AUTO-IMPORTED')[0].trim()
      const billSummary = deriveBillSummary(a, cleanDescription)
      const voteWord = a.voteValue === 'Yea' ? 'Yes' : a.voteValue === 'Nay' ? 'No' : a.voteValue
      const suggestedDescription =
        a.billId && voteWord
          ? `Voted ${voteWord} on ${a.billId}${billSummary ? ` — ${billSummary}` : ''}`
          : cleanDescription
      return {
        key: a._key!,
        official: a.official,
        party: a.party,
        office: a.office,
        date: a.date,
        chamber: a.chamber,
        billId: a.billId,
        billSummary,
        voteValue: a.voteValue,
        voteResult: a.voteResult,
        partyBreakdown: a.partyBreakdown,
        crossedParty: a.crossedParty,
        sourceLabel: a.sourceLabel,
        sourceUrl: a.sourceUrl,
        suggestedDescription,
      }
    })
    .sort((a, b) => (b.date || '').localeCompare(a.date || '') || a.official.localeCompare(b.official))
}

/** Real categories to offer when approving: configured order first, then extras from data. */
export function getReviewCategories(doc: LegislativeTrackerDocument): string[] {
  const configured = (doc.categories ?? []).filter((c) => c !== IMPORT_PLACEHOLDER_CATEGORY)
  const configuredSet = new Set(configured)
  const extras = Array.from(
    new Set(
      (doc.actions ?? [])
        .map((a) => a.category)
        .filter((c) => Boolean(c) && c !== IMPORT_PLACEHOLDER_CATEGORY && !configuredSet.has(c))
    )
  ).sort((a, b) => a.localeCompare(b))
  return [...configured, ...extras]
}
