import { createClient, type SanityClient } from 'next-sanity'
import { getMigratedProjectConfig } from '@/lib/municipality-projects'

const countyProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!
const countyDataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

export const countyClient = createClient({
  projectId: countyProjectId,
  dataset: countyDataset,
  apiVersion: '2024-01-01',
  useCdn: true,
})

// Back-compat alias — most of the app (member portal, vote reminders,
// legislative review, CSV import) only ever talks to the county project.
export const client = countyClient

// Write client — used only in API routes (CSV import). County project only;
// migrated municipality projects are never written to from this app.
export const writeClient = createClient({
  projectId: countyProjectId,
  dataset: countyDataset,
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

export interface TenantClient {
  client: SanityClient
  projectId: string
  dataset: string
  isMigrated: boolean
}

const tenantClients = new Map<string, SanityClient>()

// Resolves the Sanity client that owns a municipality's OWN content.
// Falls back to the county client (legacy mode: content lives in the
// county project, scoped by the `municipality` reference field) for any
// slug not yet split into its own project.
export function getTenantClient(municipalitySlug: string): TenantClient {
  const config = getMigratedProjectConfig(municipalitySlug)
  if (!config) {
    return { client: countyClient, projectId: countyProjectId, dataset: countyDataset, isMigrated: false }
  }

  const key = `${config.projectId}:${config.dataset}`
  let tenantClient = tenantClients.get(key)
  if (!tenantClient) {
    tenantClient = createClient({
      projectId: config.projectId,
      dataset: config.dataset,
      apiVersion: '2024-01-01',
      useCdn: true,
    })
    tenantClients.set(key, tenantClient)
  }
  return { client: tenantClient, projectId: config.projectId, dataset: config.dataset, isMigrated: true }
}
