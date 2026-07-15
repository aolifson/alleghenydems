import type { Template } from 'sanity'

// Parameterized initial-value templates so "create new" inside a
// municipality-scoped list (see sanity/structure/byMunicipality.ts)
// pre-fills the municipality reference.
function forMunicipality(schemaType: string, title: string): Template {
  return {
    id: `${schemaType}-for-municipality`,
    title: `${title} for municipality`,
    schemaType,
    parameters: [{ name: 'municipalityId', title: 'Municipality ID', type: 'string' }],
    value: ({ municipalityId }: { municipalityId: string }) => ({
      municipality: { _type: 'reference', _ref: municipalityId },
    }),
  }
}

export const municipalityTemplates: Template[] = [
  forMunicipality('event', 'Event'),
  forMunicipality('news', 'News post'),
  forMunicipality('actionAlert', 'Action alert'),
  forMunicipality('page', 'Page'),
]
