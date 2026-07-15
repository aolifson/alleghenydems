'use client'

import { useMemo, useState } from 'react'
import type { ReviewItem, ActionType } from '@/lib/legislative-review'

const NEW_CATEGORY = '__new__'

const CHAMBER_LABELS: Record<string, string> = {
  'pa-house': 'PA House',
  'pa-senate': 'PA Senate',
  'us-house': 'U.S. House',
  'us-senate': 'U.S. Senate',
}

const TYPE_CHOICES: { value: ActionType; label: string; hint: string }[] = [
  { value: 'accomplishment', label: 'Accomplishment', hint: 'A win — something good was delivered or passed.' },
  { value: 'blocked', label: 'Blocked', hint: 'Something good was blocked or voted down.' },
  { value: 'harmful', label: 'Harmful', hint: 'A harmful bill or vote against working families.' },
]

function formatDate(date: string): string {
  const parsed = new Date(`${date}T12:00:00`)
  if (Number.isNaN(parsed.getTime())) return date
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

async function postReview(body: unknown): Promise<Record<string, unknown>> {
  const res = await fetch('/api/members/legislative-review', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) throw new Error((data?.error as string) ?? 'Something went wrong. Please try again.')
  return data ?? {}
}

interface BillGroup {
  id: string
  billId?: string
  chamber?: string
  date: string
  billSummary?: string
  voteResult?: string
  partyBreakdown?: string
  sourceLabel?: string
  sourceUrl?: string
  items: ReviewItem[]
}

/** One group per bill/roll call, so the intern reads each bill once. */
function groupByBill(items: ReviewItem[]): BillGroup[] {
  const groups = new Map<string, BillGroup>()
  for (const item of items) {
    const id = item.billId ? `${item.chamber ?? ''}|${item.billId}|${item.date}` : `solo|${item.key}`
    let group = groups.get(id)
    if (!group) {
      group = {
        id,
        billId: item.billId,
        chamber: item.chamber,
        date: item.date,
        billSummary: item.billSummary,
        voteResult: item.voteResult,
        partyBreakdown: item.partyBreakdown,
        sourceLabel: item.sourceLabel,
        sourceUrl: item.sourceUrl,
        items: [],
      }
      groups.set(id, group)
    }
    // Prefer whichever item in the group actually has these fields.
    group.billSummary ||= item.billSummary
    group.voteResult ||= item.voteResult
    group.partyBreakdown ||= item.partyBreakdown
    group.sourceUrl ||= item.sourceUrl
    group.sourceLabel ||= item.sourceLabel
    group.items.push(item)
  }
  return [...groups.values()].sort(
    (a, b) => (b.date || '').localeCompare(a.date || '') || (a.billId ?? '').localeCompare(b.billId ?? '')
  )
}

// ─── Approve form (one open at a time) ───────────────────────────────

function ApproveForm({
  item,
  categories,
  busy,
  onApprove,
  onCancel,
}: {
  item: ReviewItem
  categories: string[]
  busy: boolean
  onApprove: (fields: { type: ActionType; category: string; description: string }) => void
  onCancel: () => void
}) {
  const [type, setType] = useState<ActionType | ''>('')
  const [category, setCategory] = useState(categories[0] ?? NEW_CATEGORY)
  const [newCategory, setNewCategory] = useState('')
  const [description, setDescription] = useState(item.suggestedDescription)

  const finalCategory = category === NEW_CATEGORY ? newCategory.trim() : category
  const ready = Boolean(type && finalCategory && description.trim())

  return (
    <div className="mt-3 rounded-lg border border-[var(--color-blue)]/40 bg-[var(--color-bg)] p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-[var(--color-navy)] mb-2">
          1. How should {item.official}&rsquo;s vote be classified?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {TYPE_CHOICES.map(({ value, label, hint }) => (
            <label
              key={value}
              className={`flex flex-col gap-1 rounded-lg border p-3 cursor-pointer transition-colors ${
                type === value
                  ? 'border-[var(--color-blue)] bg-[var(--color-blue-light)]'
                  : 'border-[var(--color-border)] bg-white hover:border-[var(--color-blue)]'
              }`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-navy)]">
                <input
                  type="radio"
                  name={`type-${item.key}`}
                  value={value}
                  checked={type === value}
                  onChange={() => setType(value)}
                  className="accent-[var(--color-blue)]"
                />
                {label}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">{hint}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={`category-${item.key}`} className="block text-sm font-semibold text-[var(--color-navy)] mb-1">
          2. Category
        </label>
        <div className="flex flex-wrap gap-2">
          <select
            id={`category-${item.key}`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
            <option value={NEW_CATEGORY}>+ New category…</option>
          </select>
          {category === NEW_CATEGORY && (
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Name the new category"
              maxLength={100}
              className="flex-1 min-w-48 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
            />
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor={`description-${item.key}`}
          className="block text-sm font-semibold text-[var(--color-navy)] mb-1"
        >
          3. Voter-facing description
        </label>
        <textarea
          id={`description-${item.key}`}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={2000}
          className="w-full rounded-lg border border-[var(--color-border)] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-blue)]"
        />
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          Plain language a voter would understand — we&rsquo;ve pre-filled a starting point.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          disabled={!ready || busy}
          onClick={() => type && onApprove({ type, category: finalCategory, description: description.trim() })}
          className="px-4 py-2 bg-[var(--color-blue)] hover:opacity-90 text-white text-sm font-semibold rounded-lg transition-opacity disabled:opacity-50"
        >
          {busy ? 'Approving…' : '✓ Approve'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)] underline disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

// ─── The queue ───────────────────────────────────────────────────────

export default function LegislativeReviewQueue({
  initialItems,
  categories,
}: {
  initialItems: ReviewItem[]
  categories: string[]
}) {
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [busyKeys, setBusyKeys] = useState<Set<string>>(new Set())
  const [bulkBusy, setBulkBusy] = useState(false)
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)
  const [knownCategories, setKnownCategories] = useState(categories)

  const groups = useMemo(() => groupByBill(items), [items])
  const itemsByKey = useMemo(() => new Map(items.map((i) => [i.key, i])), [items])
  const allSelected = items.length > 0 && selected.size === items.length

  function removeItems(keys: string[]) {
    const gone = new Set(keys)
    setItems((prev) => prev.filter((i) => !gone.has(i.key)))
    setSelected((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => next.delete(k))
      return next
    })
    setOpenKey((prev) => (prev && gone.has(prev) ? null : prev))
  }

  function setKeysSelected(keys: string[], on: boolean) {
    setSelected((prev) => {
      const next = new Set(prev)
      keys.forEach((k) => (on ? next.add(k) : next.delete(k)))
      return next
    })
  }

  async function handleApprove(key: string, fields: { type: ActionType; category: string; description: string }) {
    const item = itemsByKey.get(key)
    setBusyKeys((prev) => new Set(prev).add(key))
    setNotice(null)
    try {
      await postReview({ op: 'approve', key, ...fields })
      removeItems([key])
      if (!knownCategories.includes(fields.category)) {
        setKnownCategories((prev) => [...prev, fields.category])
      }
      setNotice({
        kind: 'success',
        text: `Approved ${item?.official ?? 'item'}${
          item?.billId ? ` — ${item.billId}` : ''
        }. It goes live the next time the tracker is published in Sanity.`,
      })
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBusyKeys((prev) => {
        const next = new Set(prev)
        next.delete(key)
        return next
      })
    }
  }

  async function handleReject(keys: string[]) {
    if (keys.length === 0) return
    const first = itemsByKey.get(keys[0])
    const label =
      keys.length === 1
        ? `${first?.official ?? 'this'}'s vote${first?.billId ? ` on ${first.billId}` : ''}`
        : `${keys.length} votes`
    if (!window.confirm(`Reject ${label}? Rejected votes are removed and won't appear on the site.`)) return

    setBulkBusy(true)
    setBusyKeys((prev) => new Set([...prev, ...keys]))
    setNotice(null)
    try {
      const data = await postReview({ op: 'reject', keys })
      const rejected = Array.isArray(data.rejected) ? (data.rejected as string[]) : keys
      removeItems(rejected)
      setNotice({
        kind: 'success',
        text: rejected.length === 1 ? 'Rejected 1 vote.' : `Rejected ${rejected.length} votes.`,
      })
    } catch (err) {
      setNotice({ kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' })
    } finally {
      setBulkBusy(false)
      setBusyKeys((prev) => {
        const next = new Set(prev)
        keys.forEach((k) => next.delete(k))
        return next
      })
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {notice && <Notice notice={notice} />}
        <div className="rounded-xl border border-[var(--color-border)] bg-white p-10 text-center">
          <p className="text-3xl mb-2">🎉</p>
          <p className="font-semibold text-[var(--color-navy)]">The review queue is empty</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Every imported vote has been reviewed. New votes appear here after the next automatic import.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {notice && <Notice notice={notice} />}

      {/* Bulk action toolbar */}
      <div className="sticky top-0 z-10 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--color-border)] bg-white px-4 py-3 shadow-sm">
        <label className="flex items-center gap-2 text-sm font-medium text-[var(--color-navy)] cursor-pointer">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.key)))}
            className="h-4 w-4 accent-[var(--color-blue)]"
          />
          Select all
        </label>
        <span className="text-sm text-[var(--color-text-muted)]">
          {selected.size > 0
            ? `${selected.size} of ${items.length} selected`
            : `${items.length} votes on ${groups.length} bills waiting for review`}
        </span>
        <button
          type="button"
          disabled={selected.size === 0 || bulkBusy}
          onClick={() => handleReject([...selected])}
          className="ml-auto px-4 py-2 bg-[var(--color-red)] hover:bg-[var(--color-red-dark)] text-white text-sm font-semibold rounded-lg transition-colors disabled:opacity-40"
        >
          {bulkBusy ? 'Rejecting…' : `Reject selected${selected.size > 0 ? ` (${selected.size})` : ''}`}
        </button>
      </div>

      {/* One card per bill / roll call */}
      <ul className="space-y-4">
        {groups.map((group) => {
          const groupKeys = group.items.map((i) => i.key)
          const groupAllSelected = groupKeys.every((k) => selected.has(k))
          const chamber = group.chamber ? CHAMBER_LABELS[group.chamber] ?? group.chamber : null
          return (
            <li key={group.id} className="rounded-xl border border-[var(--color-border)] bg-white overflow-hidden">
              {/* Bill header */}
              <div className="p-4 sm:p-5 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={groupAllSelected}
                    onChange={() => setKeysSelected(groupKeys, !groupAllSelected)}
                    aria-label={`Select all votes on ${group.billId ?? 'this bill'}`}
                    title="Select every official's vote on this bill"
                    className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-blue)]"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {group.billId && (
                        <span className="font-display font-bold text-[var(--color-navy)]">{group.billId}</span>
                      )}
                      {chamber && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-navy)] text-white">
                          {chamber}
                        </span>
                      )}
                      {group.date && (
                        <span className="text-sm text-[var(--color-text-muted)]">{formatDate(group.date)}</span>
                      )}
                      {group.voteResult && (
                        <span className="text-sm text-[var(--color-text-muted)]">· {group.voteResult}</span>
                      )}
                      {group.partyBreakdown && (
                        <span className="text-sm text-[var(--color-text-muted)]">· {group.partyBreakdown}</span>
                      )}
                    </div>
                    {group.billSummary && (
                      <p className="mt-1.5 text-sm text-[var(--color-text)]">{group.billSummary}</p>
                    )}
                    {group.sourceUrl && (
                      <a
                        href={group.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1.5 inline-block text-sm font-medium text-[var(--color-blue-mid)] hover:underline"
                      >
                        {group.sourceLabel || 'View official vote record'} ↗
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* One row per official */}
              <ul className="divide-y divide-[var(--color-border)]">
                {group.items.map((item) => {
                  const busy = busyKeys.has(item.key)
                  return (
                    <li key={item.key} className={`p-4 sm:px-5 ${busy ? 'opacity-60' : ''}`}>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <input
                          type="checkbox"
                          checked={selected.has(item.key)}
                          onChange={() => setKeysSelected([item.key], !selected.has(item.key))}
                          disabled={busy}
                          aria-label={`Select ${item.official}'s vote`}
                          className="h-4 w-4 shrink-0 accent-[var(--color-blue)]"
                        />
                        <span className="font-semibold text-[var(--color-navy)]">{item.official}</span>
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded text-white ${
                            item.party === 'R' ? 'bg-[var(--color-red)]' : 'bg-[var(--color-blue)]'
                          }`}
                        >
                          {item.party === 'R' ? 'REP' : 'DEM'}
                        </span>
                        <span className="hidden sm:inline text-sm text-[var(--color-text-muted)]">{item.office}</span>
                        {item.voteValue && (
                          <span
                            className={`text-xs font-bold px-2 py-0.5 rounded border ${
                              item.voteValue === 'Yea'
                                ? 'border-[var(--color-navy)] text-[var(--color-navy)]'
                                : 'border-[var(--color-text-muted)] text-[var(--color-text-muted)]'
                            }`}
                          >
                            Voted {item.voteValue.toUpperCase()}
                          </span>
                        )}
                        {item.crossedParty && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-[var(--color-gold)]/20 text-[#8a5a00] border border-[var(--color-gold)]">
                            ⚠ Crossed party lines
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-2">
                          {openKey !== item.key && (
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => setOpenKey(item.key)}
                              className="px-3 py-1.5 bg-[var(--color-blue)] hover:opacity-90 text-white text-xs font-semibold rounded-lg transition-opacity disabled:opacity-50"
                            >
                              Categorize &amp; approve
                            </button>
                          )}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleReject([item.key])}
                            className="px-3 py-1.5 border border-[var(--color-red)] text-[var(--color-red)] hover:bg-[var(--color-red)] hover:text-white text-xs font-semibold rounded-lg transition-colors disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </span>
                      </div>
                      {openKey === item.key && (
                        <ApproveForm
                          item={item}
                          categories={knownCategories}
                          busy={busy}
                          onApprove={(fields) => handleApprove(item.key, fields)}
                          onCancel={() => setOpenKey(null)}
                        />
                      )}
                    </li>
                  )
                })}
              </ul>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

function Notice({ notice }: { notice: { kind: 'success' | 'error'; text: string } }) {
  return (
    <div
      role="status"
      className={`rounded-lg border px-4 py-3 text-sm ${
        notice.kind === 'success'
          ? 'border-green-300 bg-green-50 text-green-900'
          : 'border-[var(--color-red)]/40 bg-red-50 text-[var(--color-red-dark)]'
      }`}
    >
      {notice.text}
    </div>
  )
}
