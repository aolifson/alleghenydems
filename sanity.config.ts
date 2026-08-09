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
  SearchIcon,
  UsersIcon,
} from '@sanity/icons'
import { schemaTypes } from './sanity/schemaTypes'
import { municipalityTemplates } from './sanity/schemaTypes/templates'
import { municipalityProjectSchemaTypes } from './sanity/schemaTypes/municipality-project'
import CandidateFinder from './sanity/structure/CandidateFinder'
import { byMunicipalityListItem } from './sanity/structure/byMunicipality'
import { municipalityWorkspaceStructure } from './sanity/structure/municipalityWorkspaceStructure'
import {
  bucketedByMunicipalityListItem,
  eventBucketItems,
  newsBucketItems,
} from './sanity/structure/timeBuckets'
import { MIGRATED_MUNICIPALITY_PROJECTS } from './lib/municipality-projects'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

// One workspace per migrated municipality (see lib/municipality-projects.ts),
// each pointed at that committee's own project — Sanity login gates which
// workspaces a given editor can actually open, since workspace membership
// follows Sanity project membership. Not-yet-migrated municipalities have no
// workspace of their own; their content still lives in — and is edited
// from — the county workspace below.
const municipalityWorkspaces = Object.entries(MIGRATED_MUNICIPALITY_PROJECTS).map(([slug, config]) => ({
  name: slug,
  title: `${slug} (Municipality)`,
  basePath: `/studio/${slug}`,
  projectId: config.projectId,
  dataset: config.dataset,
  plugins: [structureTool({ structure: municipalityWorkspaceStructure }), visionTool()],
  schema: { types: municipalityProjectSchemaTypes },
}))

export default defineConfig([
  {
    name: 'county',
    title: 'Allegheny Dems',
    basePath: '/studio/county',
  
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
                    S.list()
                      .title('Events')
                      .items(
                        eventBucketItems(S, {
                          filter: `municipality->slug.current == "${municipalitySlug}"`,
                        })
                      )
                  ),
                S.listItem()
                  .title('News & Updates')
                  .icon(DocumentsIcon)
                  .child(
                    S.list()
                      .title('News & Updates')
                      .items(
                        newsBucketItems(S, {
                          filter: `municipality->slug.current == "${municipalitySlug}"`,
                        })
                      )
                  ),
                S.listItem()
                  .title('Pages')
                  .icon(DocumentIcon)
                  .child(
                    S.documentTypeList('page')
                      .title('Pages')
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
                            S.list()
                              .title('Shared Events')
                              .items(
                                eventBucketItems(S, {
                                  filter: `!defined(municipality) && (shareWithAll == true || "${municipalitySlug}" in sharedWith[]->slug.current)`,
                                })
                              )
                          ),
                        S.listItem()
                          .title('Shared News')
                          .icon(DocumentsIcon)
                          .child(
                            S.list()
                              .title('Shared News')
                              .items(
                                newsBucketItems(S, {
                                  filter: `!defined(municipality) && (shareWithAll == true || "${municipalitySlug}" in sharedWith[]->slug.current)`,
                                })
                              )
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
              byMunicipalityListItem(S, {
                type: 'actionAlert',
                title: 'Action Alerts',
                icon: BellIcon,
                ordering: [{ field: 'startDate', direction: 'desc' }],
              }),
  
              S.divider(),
  
              // ── Main content ──
              bucketedByMunicipalityListItem(S, {
                type: 'event',
                title: 'Events',
                icon: CalendarIcon,
              }),
  
              bucketedByMunicipalityListItem(S, {
                type: 'news',
                title: 'News & Updates',
                icon: DocumentsIcon,
              }),
  
              S.documentTypeListItem('voterGuide')
                .title('Voter Guides')
                .icon(MasterDetailIcon),
  
              S.listItem()
                .title('Candidate Finder')
                .icon(SearchIcon)
                .id('candidateFinder')
                .child(
                  S.component(CandidateFinder)
                    .title('Candidate Finder')
                    .id('candidateFinder')
                ),
  
              S.documentTypeListItem('legislativeTracker')
                .title('Legislative Tracker')
                .icon(DocumentsIcon),
  
              S.divider(),
  
              // ── Outreach (county scope only) ──
              S.listItem()
                .title('Outreach')
                .icon(EnvelopeIcon)
                .child(
                  S.list()
                    .title('Outreach')
                    .items([
                      S.documentTypeListItem('voteReminder')
                        .title('🗳️ Vote Reminder Signups')
                        .icon(BellIcon),
                    ])
                ),
  
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
  
              byMunicipalityListItem(S, {
                type: 'page',
                title: 'Pages (Advanced)',
                icon: DocumentIcon,
              }),
  
            ])
        },
      }),
      visionTool(),
    ],
  
    schema: {
      types: schemaTypes,
      // Function form so the default per-type templates are kept.
      templates: (prev) => [...prev, ...municipalityTemplates],
    },
  },
  ...municipalityWorkspaces,
])
