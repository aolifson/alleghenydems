import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './sanity/schemaTypes'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'alleghenydems',
  title: 'Allegheny Dems',

  projectId,
  dataset,

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            // Singleton: Site Settings
            S.listItem()
              .title('Site Settings')
              .id('siteSettings')
              .child(
                S.document()
                  .schemaType('siteSettings')
                  .documentId('siteSettings')
              ),
            S.divider(),
            S.documentTypeListItem('event').title('Events'),
            S.documentTypeListItem('news').title('News & Updates'),
            S.divider(),
            S.documentTypeListItem('committeeMember').title('Committee Members'),
            S.documentTypeListItem('externalLink').title('External Links'),
            S.divider(),
            S.documentTypeListItem('page').title('Pages'),
            S.documentTypeListItem('voterGuide').title('Voter Guides'),
          ]),
    }),
    visionTool(),
  ],

  schema: {
    types: schemaTypes,
  },
})
