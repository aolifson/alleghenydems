import { createImageUrlBuilder as imageUrlBuilder } from '@sanity/image-url'
import { countyClient } from './client'
import type { SanityImageSource } from '@sanity/image-url'

const countyBuilder = imageUrlBuilder(countyClient)
const tenantBuilders = new Map<string, ReturnType<typeof imageUrlBuilder>>()

// Image asset refs don't carry a project ID — the builder has to be built
// against the project that actually stores the asset. Content fetched from
// a migrated municipality's own project gets stamped with `_sourceProject`
// at query time (see sanity/lib/queries.ts); everything else (county
// content, and any not-yet-migrated municipality) is untagged and resolves
// to the county project exactly as before.
export function urlFor(source: SanityImageSource) {
  const tagged = source as { _sourceProject?: { projectId: string; dataset: string } }
  const project = tagged?._sourceProject
  if (!project) return countyBuilder.image(source)

  const key = `${project.projectId}:${project.dataset}`
  let builder = tenantBuilders.get(key)
  if (!builder) {
    builder = imageUrlBuilder({ projectId: project.projectId, dataset: project.dataset })
    tenantBuilders.set(key, builder)
  }
  return builder.image(source)
}
