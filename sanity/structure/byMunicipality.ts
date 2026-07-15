import type { ComponentType } from 'react'
import type { StructureBuilder } from 'sanity/structure'
import { HomeIcon } from '@sanity/icons'

type Ordering = { field: string; direction: 'asc' | 'desc' }[]

// Builds the "All / County-wide / By Municipality" submenu for a content type
// that carries the optional `municipality` reference (event, news, actionAlert,
// page). "Create new" inside a municipality's list pre-fills that municipality
// via the `<type>-for-municipality` templates registered in sanity.config.ts.
export function byMunicipalityListItem(
  S: StructureBuilder,
  options: { type: string; title: string; icon: ComponentType; ordering?: Ordering }
) {
  const { type, title, icon, ordering } = options
  const applyOrdering = <T extends { defaultOrdering: (o: Ordering) => T }>(list: T) =>
    ordering ? list.defaultOrdering(ordering) : list

  return S.listItem()
    .title(title)
    .icon(icon)
    .child(
      S.list()
        .title(title)
        .items([
          S.listItem()
            .title(`All ${title}`)
            .icon(icon)
            .child(S.documentTypeList(type).title(`All ${title}`)),
          S.listItem()
            .title('County-wide (ACDC) Only')
            .icon(icon)
            .child(
              applyOrdering(
                S.documentList()
                  .title(`County-wide ${title}`)
                  .schemaType(type)
                  .filter(`_type == "${type}" && !defined(municipality)`)
              )
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
                  return applyOrdering(
                    S.documentList()
                      .title(title)
                      .schemaType(type)
                      .filter(`_type == "${type}" && municipality._ref == $municipalityId`)
                      .params({ municipalityId: publishedId })
                      .initialValueTemplates([
                        S.initialValueTemplateItem(`${type}-for-municipality`, {
                          municipalityId: publishedId,
                        }),
                      ])
                  )
                })
            ),
        ])
    )
}
