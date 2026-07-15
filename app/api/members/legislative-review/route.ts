import { NextResponse } from 'next/server'
import { getActiveMemberEmail } from '@/lib/members-session'
import { writeClient } from '@/sanity/lib/client'
import {
  ACTION_TYPES,
  TRACKER_DRAFT_ID,
  fetchTrackerDocs,
  extractReviewItems,
  getReviewCategories,
  type ActionType,
} from '@/lib/legislative-review'
import type { LegislativeTrackerDocument } from '@/sanity/lib/queries'

// Members-area review queue for auto-imported legislative votes.
// GET  → pending items + category choices.
// POST → { op: "approve", key, type, category, description }
//        { op: "reject", keys: [...] }
// Both ops only ever touch actions flagged needsReview, and only in the DRAFT
// document — publishing to the live page stays a deliberate step in Sanity Studio.

const NO_STORE = { 'Cache-Control': 'private, no-store' }
const MAX_REJECT_KEYS = 500

// Sanity array keys are short alphanumeric strings; validate before splicing
// them into patch paths.
const SAFE_KEY = /^[A-Za-z0-9_-]{1,64}$/

export async function GET() {
  const email = await getActiveMemberEmail()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })

  const { draft, published } = await fetchTrackerDocs()
  const doc = draft ?? published
  if (!doc) return NextResponse.json({ error: 'Legislative tracker not found' }, { status: 404, headers: NO_STORE })

  return NextResponse.json(
    { items: extractReviewItems(doc), categories: getReviewCategories(doc) },
    { headers: NO_STORE }
  )
}

/** Draft copy of the published doc, used when no draft exists yet. */
function publishedAsDraft(published: LegislativeTrackerDocument): LegislativeTrackerDocument {
  const { _rev, _createdAt, _updatedAt, ...rest } = published as LegislativeTrackerDocument &
    Record<string, unknown>
  void _rev
  void _createdAt
  void _updatedAt
  return { ...(rest as LegislativeTrackerDocument), _id: TRACKER_DRAFT_ID }
}

export async function POST(request: Request) {
  const email = await getActiveMemberEmail()
  if (!email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: NO_STORE })

  let body: Record<string, unknown>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE })
  }

  const { draft, published } = await fetchTrackerDocs()
  const doc = draft ?? published
  if (!doc) return NextResponse.json({ error: 'Legislative tracker not found' }, { status: 404, headers: NO_STORE })

  // Guard rail: this endpoint can only modify items still awaiting review.
  const reviewKeys = new Set(
    (doc.actions ?? []).filter((a) => a.needsReview && a._key).map((a) => a._key as string)
  )

  const startTransaction = () => {
    const tx = writeClient.transaction()
    if (!draft && published) tx.createIfNotExists(publishedAsDraft(published))
    return tx
  }

  if (body.op === 'approve') {
    const key = typeof body.key === 'string' ? body.key : ''
    const type = typeof body.type === 'string' ? (body.type as ActionType) : null
    const category = typeof body.category === 'string' ? body.category.trim() : ''
    const description = typeof body.description === 'string' ? body.description.trim() : ''

    if (!SAFE_KEY.test(key) || !reviewKeys.has(key)) {
      return NextResponse.json(
        { error: 'That item is no longer in the review queue. Refresh the page.' },
        { status: 409, headers: NO_STORE }
      )
    }
    if (!type || !ACTION_TYPES.includes(type)) {
      return NextResponse.json({ error: 'Pick an action type.' }, { status: 400, headers: NO_STORE })
    }
    if (!category || category.length > 100) {
      return NextResponse.json({ error: 'Pick or enter a category.' }, { status: 400, headers: NO_STORE })
    }
    if (!description || description.length > 2000) {
      return NextResponse.json(
        { error: 'Write a short voter-facing description.' },
        { status: 400, headers: NO_STORE }
      )
    }

    const path = `actions[_key=="${key}"]`
    await startTransaction()
      .patch(TRACKER_DRAFT_ID, (p) =>
        p.set({
          [`${path}.type`]: type,
          [`${path}.category`]: category,
          [`${path}.description`]: description,
          [`${path}.needsReview`]: false,
        })
      )
      .commit()

    return NextResponse.json({ ok: true, approved: key }, { headers: NO_STORE })
  }

  if (body.op === 'reject') {
    const rawKeys = Array.isArray(body.keys) ? body.keys : []
    const keys = rawKeys
      .filter((k): k is string => typeof k === 'string' && SAFE_KEY.test(k) && reviewKeys.has(k))
      .slice(0, MAX_REJECT_KEYS)
    if (keys.length === 0) {
      return NextResponse.json(
        { error: 'None of the selected items are in the review queue. Refresh the page.' },
        { status: 409, headers: NO_STORE }
      )
    }

    await startTransaction()
      .patch(TRACKER_DRAFT_ID, (p) => p.unset(keys.map((k) => `actions[_key=="${k}"]`)))
      .commit()

    return NextResponse.json({ ok: true, rejected: keys }, { headers: NO_STORE })
  }

  return NextResponse.json({ error: 'Unknown operation' }, { status: 400, headers: NO_STORE })
}
