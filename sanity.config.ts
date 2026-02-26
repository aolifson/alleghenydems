import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import {
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
      structure: (S) =>
        S.list()
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

          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
