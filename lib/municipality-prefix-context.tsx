'use client'
import { createContext, useContext } from 'react'

const MunicipalityPrefixContext = createContext('')

export function MunicipalityPrefixProvider({
  basePath,
  children,
}: {
  basePath: string
  children: React.ReactNode
}) {
  return (
    <MunicipalityPrefixContext.Provider value={basePath}>
      {children}
    </MunicipalityPrefixContext.Provider>
  )
}

export function useMunicipalityPrefix() {
  return useContext(MunicipalityPrefixContext)
}

/**
 * Prefix an internal href with the municipality's base path.
 * External URLs (http/https/mailto/tel) and hash-only fragments are returned unchanged.
 * When basePath is '' (county site or subdomain production), returns href unchanged.
 */
export function prefixHref(href: string, basePath: string): string {
  if (!basePath) return href
  if (
    href.startsWith('http') ||
    href.startsWith('mailto') ||
    href.startsWith('tel') ||
    href.startsWith('#')
  ) {
    return href
  }
  return basePath + href
}
