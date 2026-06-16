import type { LegislativeAction } from '@/sanity/lib/queries'

export interface OfficialScorecard {
  name: string
  slug: string
  party: 'D' | 'R'
  office: string
  delivered: number
  blocked: number
  harmful: number
  total: number
  /** Distinct categories this official has a record on, in first-seen order. */
  categories: string[]
  /** All of this official's reviewed actions, newest-ish first by displayOrder. */
  actions: LegislativeAction[]
  /** Communities touched across all of this official's actions. */
  municipalities: string[]
}

/** URL-safe slug for an official's name, e.g. "Rep. Summer Lee" -> "rep-summer-lee". */
export function officialSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function sortByOrder(items: LegislativeAction[]): LegislativeAction[] {
  return [...items].sort((a, b) => (a.displayOrder ?? 9999) - (b.displayOrder ?? 9999))
}

/**
 * Group reviewed legislative actions into one scorecard per official.
 * Items still flagged needsReview are excluded (defense in depth — the page
 * already filters them, but scorecards should never count unreviewed data).
 */
export function buildScorecards(actions: LegislativeAction[] | undefined): OfficialScorecard[] {
  const byName = new Map<string, OfficialScorecard>()

  for (const action of actions ?? []) {
    if (action.needsReview) continue
    if (!action.official) continue

    let card = byName.get(action.official)
    if (!card) {
      card = {
        name: action.official,
        slug: officialSlug(action.official),
        party: action.party,
        office: action.office ?? '',
        delivered: 0,
        blocked: 0,
        harmful: 0,
        total: 0,
        categories: [],
        actions: [],
        municipalities: [],
      }
      byName.set(action.official, card)
    }

    // Prefer a non-empty office string if the first one was blank.
    if (!card.office && action.office) card.office = action.office

    if (action.type === 'accomplishment') card.delivered += 1
    else if (action.type === 'blocked') card.blocked += 1
    else if (action.type === 'harmful') card.harmful += 1
    card.total += 1

    if (action.category && !card.categories.includes(action.category)) {
      card.categories.push(action.category)
    }
    for (const m of action.municipalities ?? []) {
      if (!card.municipalities.includes(m)) card.municipalities.push(m)
    }
    card.actions.push(action)
  }

  const cards = Array.from(byName.values())
  for (const card of cards) card.actions = sortByOrder(card.actions)

  // Order: Democrats (most delivered first), then Republicans (most blocked/harmful first).
  return cards.sort((a, b) => {
    if (a.party !== b.party) return a.party === 'D' ? -1 : 1
    if (a.party === 'D') return b.delivered - a.delivered || b.total - a.total
    return (b.blocked + b.harmful) - (a.blocked + a.harmful) || b.total - a.total
  })
}

export function findScorecard(
  actions: LegislativeAction[] | undefined,
  slug: string
): OfficialScorecard | null {
  return buildScorecards(actions).find((c) => c.slug === slug) ?? null
}
