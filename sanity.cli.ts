import { defineCliConfig } from 'sanity/cli'

// Project targeting for `npx sanity ...` commands (dataset export/import, etc.).
// Override with NEXT_PUBLIC_SANITY_PROJECT_ID=<id> for migration commands
// against the new per-municipality projects.
export default defineCliConfig({
  api: {
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'mfzgc4rr',
    dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  },
})
