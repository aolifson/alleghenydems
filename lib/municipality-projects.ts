// Registry of municipalities that have been split into their own Sanity
// project for hard access isolation (see docs/MULTI-PROJECT-MIGRATION.md).
// Unlisted municipalities still live inside the county project, addressed
// by the legacy `municipality` reference filter — no code change needed
// for them. To migrate one: add an entry here, run
// `scripts/split-municipality-data.ts <slug>`, then invite that
// committee's editors to the new project (never the county one).
export interface MunicipalityProjectConfig {
  projectId: string
  dataset: string
}

export const MIGRATED_MUNICIPALITY_PROJECTS: Record<string, MunicipalityProjectConfig> = {
  'fox-chapel': { projectId: 'ihpwz2dj', dataset: 'production' },
}

export function getMigratedProjectConfig(municipalitySlug: string): MunicipalityProjectConfig | null {
  return MIGRATED_MUNICIPALITY_PROJECTS[municipalitySlug] ?? null
}

// Reverse lookup — used by the Studio (see HiddenSharedItemsInput) to figure
// out which municipality a workspace belongs to from its own project ID.
export function getSlugForProjectId(projectId: string): string | null {
  const entry = Object.entries(MIGRATED_MUNICIPALITY_PROJECTS).find(([, cfg]) => cfg.projectId === projectId)
  return entry ? entry[0] : null
}
