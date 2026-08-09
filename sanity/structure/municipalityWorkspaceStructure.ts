import type { StructureBuilder } from 'sanity/structure'
import { BellIcon, CalendarIcon, DocumentIcon, DocumentsIcon, EnvelopeIcon, HomeIcon, UsersIcon } from '@sanity/icons'

// Structure for a migrated municipality's own workspace — no multi-tenant
// branching needed (everything in this project already belongs to this
// committee). Compare to the county workspace's structure in
// sanity.config.ts, which still has to juggle 30+ municipalities in one
// project via sanity/structure/byMunicipality.ts and timeBuckets.ts.
export function municipalityWorkspaceStructure(S: StructureBuilder) {
  return S.list()
    .title('Municipality Content')
    .items([
      S.listItem()
        .title('Municipality Settings')
        .icon(HomeIcon)
        .id('municipalitySettings')
        .child(
          S.document()
            .schemaType('municipalitySettings')
            .documentId('municipalitySettings')
            .title('Municipality Settings')
        ),

      S.divider(),

      S.documentTypeListItem('actionAlert').title('Action Alerts').icon(BellIcon),
      S.documentTypeListItem('event').title('Events').icon(CalendarIcon),
      S.documentTypeListItem('news').title('News & Updates').icon(DocumentsIcon),
      S.documentTypeListItem('page').title('Pages').icon(DocumentIcon),

      S.divider(),

      S.listItem()
        .title('Committee & People')
        .icon(UsersIcon)
        .child(
          S.list()
            .title('Committee & People')
            .items([
              S.documentTypeListItem('committeeMember').title('Committee Members').icon(UsersIcon),
              S.documentTypeListItem('committeeDirectoryEntry').title('Committee Directory').icon(DocumentsIcon),
              S.documentTypeListItem('committeeContactEntry').title('Committee Contacts').icon(EnvelopeIcon),
            ])
        ),
    ])
}
