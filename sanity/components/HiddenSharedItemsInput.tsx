import { useEffect, useMemo, useState } from 'react'
import { createClient } from 'next-sanity'
import { set, unset, useProjectId, type ArrayOfPrimitivesInputProps } from 'sanity'
import { Card, Checkbox, Flex, Spinner, Stack, Text } from '@sanity/ui'
import { getSlugForProjectId } from '@/lib/municipality-projects'

// Lets a migrated municipality opt individual county items (events, news,
// action alerts) shared via shareWithAll/sharedWith OUT of their own site,
// without touching the county's document. Stores the opted-out county
// document _ids as plain strings — a real Sanity reference can't cross
// projects, since references are scoped to a single dataset.
interface SharedItem {
  _id: string
  _type: 'event' | 'news' | 'actionAlert'
  label: string
  sortDate: string
}

const countyProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const countyDataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'
const countyReadClient = createClient({
  projectId: countyProjectId,
  dataset: countyDataset,
  apiVersion: '2024-01-01',
  useCdn: true,
})

const TYPE_LABEL: Record<SharedItem['_type'], string> = {
  event: 'Event',
  news: 'News',
  actionAlert: 'Action Alert',
}

export function HiddenSharedItemsInput(props: ArrayOfPrimitivesInputProps) {
  // The field only ever declares `of: [{ type: 'string' }]` — Sanity's
  // components.input slot is typed for the general primitive-array case.
  const value = (props.value ?? []) as string[]
  const { onChange } = props
  const workspaceProjectId = useProjectId()
  const municipalitySlug = useMemo(() => getSlugForProjectId(workspaceProjectId), [workspaceProjectId])

  const [items, setItems] = useState<SharedItem[] | null>(null)

  useEffect(() => {
    if (!municipalitySlug) {
      setItems([])
      return
    }
    let cancelled = false
    countyReadClient
      .fetch<SharedItem[]>(
        `*[
          _type in ["event", "news", "actionAlert"] &&
          !defined(municipality) &&
          (shareWithAll == true || $municipalitySlug in sharedWith[]->slug.current)
        ] | order(coalesce(date, publishedAt, startDate) desc) {
          _id, _type,
          "label": coalesce(title, headline),
          "sortDate": coalesce(date, publishedAt, startDate)
        }`,
        { municipalitySlug }
      )
      .then((result) => {
        if (!cancelled) setItems(result)
      })
    return () => {
      cancelled = true
    }
  }, [municipalitySlug])

  if (items === null) {
    return (
      <Flex padding={3} align="center" gap={2}>
        <Spinner muted />
        <Text muted size={1}>Loading shared county items…</Text>
      </Flex>
    )
  }

  if (items.length === 0) {
    return (
      <Card padding={3} radius={2} tone="transparent" border>
        <Text muted size={1}>
          The county hasn&apos;t shared any events, news, or alerts with this municipality yet.
        </Text>
      </Card>
    )
  }

  const hiddenSet = new Set(value)

  function toggle(id: string, hidden: boolean) {
    const next = hidden ? [...hiddenSet, id] : [...hiddenSet].filter((x) => x !== id)
    onChange(next.length > 0 ? set(next) : unset())
  }

  return (
    <Stack space={2}>
      {items.map((item) => (
        <Card key={item._id} padding={2} radius={2} tone={hiddenSet.has(item._id) ? 'caution' : 'default'} border>
          <Flex align="center" gap={3}>
            <Checkbox
              checked={hiddenSet.has(item._id)}
              onChange={(event) => toggle(item._id, event.currentTarget.checked)}
            />
            <Stack space={1} flex={1}>
              <Text size={1} weight="medium">{item.label || '(untitled)'}</Text>
              <Text size={0} muted>
                {TYPE_LABEL[item._type]}
                {item.sortDate ? ` · ${new Date(item.sortDate).toLocaleDateString()}` : ''}
              </Text>
            </Stack>
            <Text size={0} muted>{hiddenSet.has(item._id) ? 'Hidden' : 'Shown'}</Text>
          </Flex>
        </Card>
      ))}
    </Stack>
  )
}
