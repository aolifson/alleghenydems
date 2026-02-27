import { headers } from 'next/headers'

/**
 * Reads the resolved municipality slug from the request header set by middleware.
 * Returns 'allegheny-county' as the safe fallback if the header is missing.
 *
 * Call this at the top of any server component that needs tenant-scoped data.
 */
export async function getMunicipalitySlug(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-municipality-slug') ?? 'allegheny-county'
}

/**
 * Reads the path prefix for the current municipality demo route.
 * Returns '' for subdomain/county routes (links need no prefix).
 * Returns '/municipalities/northside' for path-based demo routes.
 *
 * Use this in server components to prefix internal Link hrefs so
 * navigation stays within the municipality's demo path.
 */
export async function getMunicipalityPrefix(): Promise<string> {
  const headersList = await headers()
  return headersList.get('x-municipality-prefix') ?? ''
}
