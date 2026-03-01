'use client'
import { createContext, useContext } from 'react'
export { prefixHref } from './prefix-href'

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

