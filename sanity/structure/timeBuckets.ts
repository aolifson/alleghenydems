import type { ComponentType } from 'react'
import type { InitialValueTemplateItemBuilder, StructureBuilder } from 'sanity/structure'
import { ArchiveIcon, CalendarIcon, ClockIcon, DocumentsIcon, HomeIcon } from '@sanity/icons'

// Time-bucketed Studio lists so old content stays reachable (for history)
// without cluttering the working lists. Buckets are pure structure filters —
// no data is moved or archived. All filters use GROQ now(), so items shift
// buckets on their own without a Studio reload.

type Ordering = { field: string; direction: 'asc' | 'desc' }[]

type BucketScope = {
  /** Extra GROQ conditions ANDed onto every bucket (e.g. municipality scoping). */
  filter?: string
  /** Params referenced by `filter`. */
  params?: Record<string, unknown>
  /** Initial-value templates for the "create new" button in each bucket. */
  templates?: InitialValueTemplateItemBuilder[]
}

const DAYS_30 = 60 * 60 * 24 * 30

// An event stays "upcoming" until it ends (endDate when set, else start date).
// Undated drafts count as upcoming so works-in-progress don't vanish into the archive.
const EVENT_END = 'dateTime(coalesce(endDate, date))'
const eventFilters = {
  upcoming: `(!defined(date) || ${EVENT_END} >= dateTime(now()))`,
  recentPast: `defined(date) && ${EVENT_END} < dateTime(now()) && ${EVENT_END} >= dateTime(now()) - ${DAYS_30}`,
  archive: `defined(date) && ${EVENT_END} < dateTime(now()) - ${DAYS_30}`,
}

// publishedAt is a plain date on the schema, but WordPress-imported posts hold
// full datetimes — parse as-is first, then retry with a time component added.
const NEWS_DATE = 'coalesce(dateTime(publishedAt), dateTime(publishedAt + "T00:00:00Z"))'
const newsFilters = {
  recent: `(!defined(publishedAt) || ${NEWS_DATE} >= dateTime(now()) - ${DAYS_30})`,
  archive: `defined(publishedAt) && ${NEWS_DATE} < dateTime(now()) - ${DAYS_30}`,
}

function bucketListItem(
  S: StructureBuilder,
  scope: BucketScope,
  cfg: { type: string; title: string; icon: ComponentType; bucketFilter: string; ordering: Ordering }
) {
  let list = S.documentList()
    .title(cfg.title)
    .schemaType(cfg.type)
    .filter(`_type == "${cfg.type}" && ${cfg.bucketFilter}${scope.filter ? ` && (${scope.filter})` : ''}`)
    .defaultOrdering(cfg.ordering)
  if (scope.params) list = list.params(scope.params)
  if (scope.templates) list = list.initialValueTemplates(scope.templates)
  return S.listItem().title(cfg.title).icon(cfg.icon).child(list)
}

export function eventBucketItems(S: StructureBuilder, scope: BucketScope = {}) {
  return [
    bucketListItem(S, scope, {
      type: 'event',
      title: 'Upcoming Events',
      icon: CalendarIcon,
      bucketFilter: eventFilters.upcoming,
      ordering: [{ field: 'date', direction: 'asc' }],
    }),
    bucketListItem(S, scope, {
      type: 'event',
      title: 'Past — Last 30 Days',
      icon: ClockIcon,
      bucketFilter: eventFilters.recentPast,
      ordering: [{ field: 'date', direction: 'desc' }],
    }),
    bucketListItem(S, scope, {
      type: 'event',
      title: 'Past — Archive',
      icon: ArchiveIcon,
      bucketFilter: eventFilters.archive,
      ordering: [{ field: 'date', direction: 'desc' }],
    }),
  ]
}

export function newsBucketItems(S: StructureBuilder, scope: BucketScope = {}) {
  return [
    bucketListItem(S, scope, {
      type: 'news',
      title: 'Recent (Last 30 Days)',
      icon: DocumentsIcon,
      bucketFilter: newsFilters.recent,
      ordering: [{ field: 'publishedAt', direction: 'desc' }],
    }),
    bucketListItem(S, scope, {
      type: 'news',
      title: 'Archive (Older)',
      icon: ArchiveIcon,
      bucketFilter: newsFilters.archive,
      ordering: [{ field: 'publishedAt', direction: 'desc' }],
    }),
  ]
}

// County-view section for event/news: time buckets up top, then the same
// County-wide / By-Municipality drill-downs as byMunicipalityListItem, with
// the buckets repeated inside each drill-down. "Create new" inside a
// municipality still pre-fills that municipality via the
// `<type>-for-municipality` templates registered in sanity.config.ts.
export function bucketedByMunicipalityListItem(
  S: StructureBuilder,
  options: { type: 'event' | 'news'; title: string; icon: ComponentType }
) {
  const { type, title, icon } = options
  const buckets = type === 'event' ? eventBucketItems : newsBucketItems

  return S.listItem()
    .title(title)
    .icon(icon)
    .child(
      S.list()
        .title(title)
        .items([
          ...buckets(S),
          S.divider(),
          S.listItem()
            .title('County-wide (ACDC) Only')
            .icon(icon)
            .child(
              S.list()
                .title(`County-wide ${title}`)
                .items(buckets(S, { filter: '!defined(municipality)' }))
            ),
          S.listItem()
            .title('By Municipality')
            .icon(HomeIcon)
            .child(
              S.documentTypeList('municipality')
                .title('Select a Municipality')
                .defaultOrdering([{ field: 'name', direction: 'asc' }])
                .child((municipalityId) => {
                  // References always point at the published ID, but a
                  // never-published municipality hands us its draft ID.
                  const publishedId = municipalityId.replace(/^drafts\./, '')
                  return S.list()
                    .title(title)
                    .items(
                      buckets(S, {
                        filter: 'municipality._ref == $municipalityId',
                        params: { municipalityId: publishedId },
                        templates: [
                          S.initialValueTemplateItem(`${type}-for-municipality`, {
                            municipalityId: publishedId,
                          }),
                        ],
                      })
                    )
                })
            ),
        ])
    )
}
