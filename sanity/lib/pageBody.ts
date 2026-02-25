interface PortableTextSpan {
  _type?: string
  text?: string
}

interface PortableTextBlock {
  _type?: string
  style?: string
  children?: PortableTextSpan[]
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

function blockText(block: PortableTextBlock) {
  if (!Array.isArray(block.children)) return ''
  return block.children
    .filter((child) => child?._type === 'span')
    .map((child) => child.text ?? '')
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function stripDuplicatedHeroBlocks(
  body: unknown[] | undefined,
  heroHeadline?: string,
  heroSubhead?: string
) {
  if (!Array.isArray(body) || body.length === 0) return body

  const blocks = body as PortableTextBlock[]
  const normalizedHeadline = normalizeText(heroHeadline ?? '')
  const normalizedSubhead = normalizeText(heroSubhead ?? '')
  let start = 0

  const first = blocks[0]
  if (
    first?._type === 'block' &&
    ['h1', 'h2', 'h3'].includes(first.style ?? '') &&
    normalizeText(blockText(first)) === normalizedHeadline
  ) {
    start = 1
  }

  const second = blocks[start]
  if (
    normalizedSubhead &&
    second?._type === 'block' &&
    normalizeText(blockText(second)) === normalizedSubhead
  ) {
    start += 1
  }

  return start > 0 ? blocks.slice(start) : body
}

export function stripShortcodeBlocks(
  body: unknown[] | undefined,
  shortcodes: string[]
) {
  if (!Array.isArray(body) || body.length === 0 || shortcodes.length === 0) return body

  const tokens = shortcodes.map((shortcode) => `[${shortcode.toLowerCase()}`)
  const blocks = body as PortableTextBlock[]

  return blocks.filter((block) => {
    if (block?._type !== 'block') return true
    const text = blockText(block).toLowerCase()
    if (!text) return true
    return !tokens.some((token) => text.includes(token))
  })
}
