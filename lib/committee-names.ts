// The committee contact list imported from the old site stores names as
// terse uppercase codes ("UP ST CLAIR", "BALDWIN BR", "PITTSBURGH WARD 09"),
// while municipality records use proper names ("Upper St. Clair"). These
// helpers reconcile the two so the Local Committees page can show every
// committee while still linking the ones that have a site on our platform.

const WORD_EXPANSIONS: Record<string, string> = {
  br: 'borough',
  boro: 'borough',
  tp: 'township',
  twp: 'township',
  pk: 'park',
  hl: 'hills',
  hls: 'hills',
  ht: 'heights',
  hts: 'heights',
  up: 'upper',
  hgts: 'heights',
}

/**
 * Reduces a committee or municipality name to a comparable key. Suffixes are
 * expanded rather than stripped — "Baldwin Borough" and "Baldwin Township"
 * are different committees and must not collapse together.
 */
export function committeeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => WORD_EXPANSIONS[word] ?? word)
    // "ward 09" and "Ward 9" are the same ward.
    .map((word) => (/^\d+$/.test(word) ? String(Number(word)) : word))
    .join(' ')
}

// Committees whose imported name can't be reconciled by the rules above.
// Keyed by committeeKey() of the contact-list name.
const KEY_ALIASES: Record<string, string> = {
  indiana: 'indiana township',
}

export function canonicalCommitteeKey(name: string): string {
  const key = committeeKey(name)
  return KEY_ALIASES[key] ?? key
}

const ALWAYS_UPPER = new Set(['acdc', 'ydac'])

/**
 * Turns an imported uppercase name into something presentable. Only used when
 * no municipality record exists to supply a properly-cased name.
 */
export function displayCommitteeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .map((word) => {
      if (ALWAYS_UPPER.has(word)) return word.toUpperCase()
      if (WORD_EXPANSIONS[word]) return capitalize(WORD_EXPANSIONS[word])
      if (word === 'mt') return 'Mt.'
      if (word === 'st') return 'St.'
      // Drop the zero padding on ward numbers ("09" -> "9").
      if (/^\d+$/.test(word)) return String(Number(word))
      return capitalize(word)
    })
    .join(' ')
}

function capitalize(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1)
}
