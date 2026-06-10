import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import {
  BellIcon,
  HomeIcon,
  CalendarIcon,
  CogIcon,
  DocumentIcon,
  DocumentsIcon,
  EnvelopeIcon,
  LinkIcon,
  MasterDetailIcon,
  UsersIcon,
} from '@sanity/icons'
import { schemaTypes } from './sanity/schemaTypes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'alleghenydems',
  title: 'Allegheny Dems',
  basePath: '/studio',

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S, { currentUser }) => {
        const roles = currentUser?.roles?.map((r) => r.name) ?? []
        const isSuperAdmin = roles.includes('administrator')
        const municipalityRole = roles.find((r) => r.startsWith('municipality-'))
        const municipalitySlug = municipalityRole?.replace('municipality-', '') ?? null

        // ── Scoped view: municipality editor ───────────────────────────
        if (municipalitySlug && !isSuperAdmin) {
          return S.list()
            .title('My Committee')
            .items([
              S.listItem()
                .title('Municipality Settings')
                .icon(HomeIcon)
                .child(
                  S.documentTypeList('municipality')
                    .title('Municipality Settings')
                    .filter(`slug.current == "${municipalitySlug}"`)
                ),
              S.divider(),
              S.listItem()
                .title('Action Alerts')
                .icon(BellIcon)
                .child(
                  S.documentTypeList('actionAlert')
                    .title('Action Alerts')
                    .filter(`municipality->slug.current == "${municipalitySlug}"`)
                ),
              S.listItem()
                .title('Events')
                .icon(CalendarIcon)
                .child(
                  S.documentTypeList('event')
                    .title('Events')
                    .filter(`municipality->slug.current == "${municipalitySlug}"`)
                ),
              S.listItem()
                .title('News & Updates')
                .icon(DocumentsIcon)
                .child(
                  S.documentTypeList('news')
                    .title('News & Updates')
                    .filter(`municipality->slug.current == "${municipalitySlug}"`)
                ),
              S.divider(),
              // Read-only view of county content shared with this municipality
              S.listItem()
                .title('Shared from County (read-only)')
                .icon(DocumentsIcon)
                .child(
                  S.list()
                    .title('Shared from County')
                    .items([
                      S.listItem()
                        .title('Shared Events')
                        .icon(CalendarIcon)
                        .child(
                          S.documentTypeList('event')
                            .title('Shared Events')
                            .filter(`!defined(municipality) && (shareWithAll == true || "${municipalitySlug}" in sharedWith[]->slug.current)`)
                        ),
                      S.listItem()
                        .title('Shared News')
                        .icon(DocumentsIcon)
                        .child(
                          S.documentTypeList('news')
                            .title('Shared News')
                            .filter(`!defined(municipality) && (shareWithAll == true || "${municipalitySlug}" in sharedWith[]->slug.current)`)
                        ),
                    ])
                ),
            ])
        }

        // ── Full view: county editor or super-admin ─────────────────────
        return S.list()
          .title('Allegheny Dems Content')
          .items([
            // ── Site-wide settings (singleton) ──
            S.listItem()
              .title('Site Settings')
              .icon(CogIcon)
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
                  .title('Site Settings')
              ),

            S.divider(),

            // ── Municipalities ──
            S.documentTypeListItem('municipality')
              .title('Municipalities')
              .icon(HomeIcon),

            S.divider(),

            // ── Action Alerts ──
            S.documentTypeListItem('actionAlert')
              .title('Action Alerts')
              .icon(BellIcon),

            S.divider(),

            // ── Main content ──
            S.documentTypeListItem('event')
              .title('Events')
              .icon(CalendarIcon),

            S.documentTypeListItem('news')
              .title('News & Updates')
              .icon(DocumentsIcon),

            S.documentTypeListItem('voterGuide')
              .title('Voter Guides')
              .icon(MasterDetailIcon),

            S.documentTypeListItem('legislativeTracker')
              .title('Legislative Tracker')
              .icon(DocumentsIcon),

            S.divider(),

            // ── Committee & People ──
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
                    S.documentTypeListItem('internalDoc').title('🔒 Internal Documents — members only').icon(DocumentIcon),
                  ])
              ),

            S.divider(),

            // ── Advanced / Developers ──
            S.listItem()
              .title('External Links')
              .icon(LinkIcon)
              .child(S.documentTypeList('externalLink').title('External Links')),

            S.listItem()
              .title('Pages (Advanced)')
              .icon(DocumentIcon)
              .child(
                S.documentTypeList('page')
                  .title('Pages')
              ),

          ])
      },
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
