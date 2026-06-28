import {useCallback, useEffect, useMemo, useState} from 'react'
import {useClient} from 'sanity'
import {IntentLink} from 'sanity/router'
import {Badge, Box, Button, Card, Flex, Spinner, Stack, Text, TextInput} from '@sanity/ui'

// Flat, searchable index of every Voter Guide candidate. Candidates are inline
// objects nested in voterGuide → races[] → districts[] → candidates[], so they
// can't be found via global search. Each row deep-links straight to the
// candidate's field path for editing.

interface RawCandidate {
  _key: string
  name?: string
  endorsedByAcdc?: boolean
  hasVolunteer?: boolean
}

interface RawGuide {
  _id: string
  title?: string
  rows?: Array<{
    _key: string
    officeTitle?: string
    direct?: RawCandidate[] | null
    districts?: Array<{_key: string; districtLabel?: string; cands?: RawCandidate[] | null}> | null
  }> | null
}

interface Row {
  key: string
  guideId: string
  raceTitle: string
  districtLabel: string | null
  name: string
  endorsed: boolean
  hasVolunteer: boolean
  path: string
}

const QUERY = /* groq */ `*[_type == "voterGuide"]{
  _id, title,
  "rows": races[]{
    _key, officeTitle,
    "direct": candidates[]{_key, name, endorsedByAcdc, "hasVolunteer": defined(volunteerUrl)},
    "districts": districts[]{
      _key, districtLabel,
      "cands": candidates[]{_key, name, endorsedByAcdc, "hasVolunteer": defined(volunteerUrl)}
    }
  }
}`

const normalizeId = (id: string) => id.replace(/^drafts\./, '')

function flatten(guides: RawGuide[]): Row[] {
  // Collapse draft/published pairs, preferring the draft so in-progress edits show.
  const byId = new Map<string, RawGuide>()
  for (const g of guides) {
    const nid = normalizeId(g._id)
    if (!byId.has(nid) || g._id.startsWith('drafts.')) byId.set(nid, g)
  }

  const rows: Row[] = []
  for (const g of byId.values()) {
    const guideId = normalizeId(g._id)
    for (const race of g.rows ?? []) {
      const raceTitle = race.officeTitle ?? 'Race'
      const pushCandidate = (c: RawCandidate, path: string) =>
        rows.push({
          key: `${guideId}:${path}`,
          guideId,
          raceTitle,
          districtLabel: null,
          name: c.name ?? '(unnamed)',
          endorsed: !!c.endorsedByAcdc,
          hasVolunteer: !!c.hasVolunteer,
          path,
        })

      for (const c of race.direct ?? []) {
        pushCandidate(c, `races[_key=="${race._key}"].candidates[_key=="${c._key}"]`)
      }
      for (const d of race.districts ?? []) {
        for (const c of d.cands ?? []) {
          rows.push({
            key: `${guideId}:races[_key=="${race._key}"].districts[_key=="${d._key}"].candidates[_key=="${c._key}"]`,
            guideId,
            raceTitle,
            districtLabel: d.districtLabel ?? null,
            name: c.name ?? '(unnamed)',
            endorsed: !!c.endorsedByAcdc,
            hasVolunteer: !!c.hasVolunteer,
            path: `races[_key=="${race._key}"].districts[_key=="${d._key}"].candidates[_key=="${c._key}"]`,
          })
        }
      }
    }
  }
  return rows
}

export default function CandidateFinder() {
  const client = useClient({apiVersion: '2024-01-01'})
  const [rows, setRows] = useState<Row[] | null>(null)
  const [search, setSearch] = useState('')

  const load = useCallback(() => {
    let active = true
    setRows(null)
    client
      .fetch<RawGuide[]>(QUERY)
      .then((res) => {
        if (active) setRows(flatten(res ?? []))
      })
      .catch(() => {
        if (active) setRows([])
      })
    return () => {
      active = false
    }
  }, [client])

  useEffect(() => load(), [load])

  const filtered = useMemo(() => {
    if (!rows) return []
    const q = search.trim().toLowerCase()
    const base = q
      ? rows.filter(
          (r) =>
            r.name.toLowerCase().includes(q) ||
            r.raceTitle.toLowerCase().includes(q) ||
            (r.districtLabel ?? '').toLowerCase().includes(q),
        )
      : rows
    return [...base].sort((a, b) => a.name.localeCompare(b.name, undefined, {sensitivity: 'base'}))
  }, [rows, search])

  return (
    <Flex direction="column" height="fill">
      <Box padding={3} style={{borderBottom: '1px solid var(--card-border-color)'}}>
        <Stack space={3}>
          <Flex align="center" justify="space-between" gap={2}>
            <Text size={1} muted>
              {rows ? `${filtered.length} of ${rows.length} candidates` : 'Loading candidates…'}
            </Text>
            <Button mode="bleed" fontSize={1} padding={2} text="Refresh" onClick={load} />
          </Flex>
          <TextInput
            placeholder="Search by candidate, office, or district…"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            clearButton={search.length > 0}
            onClear={() => setSearch('')}
          />
        </Stack>
      </Box>

      <Box flex={1} overflow="auto" padding={2}>
        {!rows ? (
          <Flex align="center" justify="center" padding={5}>
            <Spinner muted />
          </Flex>
        ) : filtered.length === 0 ? (
          <Box padding={4}>
            <Text muted size={1}>
              {rows.length === 0 ? 'No candidates found.' : `No candidates match “${search}”.`}
            </Text>
          </Box>
        ) : (
          <Stack space={1}>
            {filtered.map((r) => (
              <IntentLink
                key={r.key}
                intent="edit"
                params={{id: r.guideId, type: 'voterGuide', path: r.path}}
                style={{textDecoration: 'none'}}
              >
                <Card padding={3} radius={2} tone={r.endorsed ? 'positive' : 'default'}>
                  <Flex align="center" justify="space-between" gap={3}>
                    <Stack space={2} flex={1}>
                      <Text size={2} weight="semibold" textOverflow="ellipsis">
                        {r.name}
                      </Text>
                      <Text size={1} muted textOverflow="ellipsis">
                        {r.raceTitle}
                        {r.districtLabel ? ` · ${r.districtLabel}` : ''}
                      </Text>
                    </Stack>
                    <Flex gap={2} align="center" style={{flexShrink: 0}}>
                      {r.endorsed && (
                        <Badge tone="positive" fontSize={0}>
                          Endorsed
                        </Badge>
                      )}
                      <Badge tone={r.hasVolunteer ? 'primary' : 'default'} fontSize={0}>
                        {r.hasVolunteer ? 'Volunteer ✓' : 'No volunteer'}
                      </Badge>
                    </Flex>
                  </Flex>
                </Card>
              </IntentLink>
            ))}
          </Stack>
        )}
      </Box>
    </Flex>
  )
}
