#!/usr/bin/env npx tsx
/**
 * Splits one municipality's content out of the county Sanity project into
 * its own project, for the hard-isolation migration described in
 * docs/MULTI-PROJECT-MIGRATION.md. Copies (not moves) — the county copies
 * are left in place until you're satisfied with the result, then delete
 * them manually.
 *
 * Usage:
 *   npx tsx scripts/split-municipality-data.ts <municipality-slug>
 *   npx tsx scripts/split-municipality-data.ts fox-chapel
 *
 * Requires (in .env.local / .env.migration.local):
 *   NEXT_PUBLIC_SANITY_PROJECT_ID, NEXT_PUBLIC_SANITY_DATASET  (county, source)
 *   <SLUG>_SANITY_PROJECT_ID, <SLUG>_SANITY_WRITE_TOKEN         (target project)
 *   e.g. FOXCHAPEL_SANITY_PROJECT_ID, FOXCHAPEL_SANITY_WRITE_TOKEN
 *
 * Safe to re-run: uses createOrReplace, and caches re-uploaded assets by
 * their original ref so images aren't duplicated on a second pass.
 */

import fs from 'fs'
import path from 'path'
import { createClient, type SanityClient } from 'next-sanity'

function loadEnvFile(filename: string) {
  const envPath = path.join(process.cwd(), filename)
  if (!fs.existsSync(envPath)) return
  for (const line of fs.readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/)
    if (m) process.env[m[1].trim()] ??= m[2].trim()
  }
}
loadEnvFile('.env.local')
loadEnvFile('.env.migration.local')

const CONTENT_TYPES_WITH_SHARING = ['event', 'news', 'actionAlert'] as const
const CONTENT_TYPES_OWN_ONLY = ['page', 'committeeMember', 'committeeDirectoryEntry', 'committeeContactEntry'] as const

async function main() {
  const slug = process.argv[2]
  if (!slug) {
    console.error('Usage: npx tsx scripts/split-municipality-data.ts <municipality-slug>')
    process.exit(1)
  }

  const envPrefix = slug.replace(/-/g, '').toUpperCase()
  const targetProjectId = process.env[`${envPrefix}_SANITY_PROJECT_ID`]
  const targetWriteToken = process.env[`${envPrefix}_SANITY_WRITE_TOKEN`]
  const countyProjectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const countyDataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production'

  if (!targetProjectId || !targetWriteToken || !countyProjectId) {
    console.error(`Missing env vars. Need NEXT_PUBLIC_SANITY_PROJECT_ID, ${envPrefix}_SANITY_PROJECT_ID, ${envPrefix}_SANITY_WRITE_TOKEN.`)
    process.exit(1)
  }

  const county = createClient({ projectId: countyProjectId, dataset: countyDataset, apiVersion: '2024-01-01', useCdn: false })
  const target = createClient({ projectId: targetProjectId, dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: targetWriteToken })

  const municipality = await county.fetch<{ _id: string; name: string } | null>(
    `*[_type == "municipality" && slug.current == $slug][0]`,
    { slug }
  )
  if (!municipality) {
    console.error(`No municipality found in county project with slug "${slug}".`)
    process.exit(1)
  }
  const municipalityId = municipality._id
  console.log(`Splitting "${municipality.name}" (${municipalityId}) → project ${targetProjectId}`)

  const assetCache = new Map<string, string>()

  async function reuploadAsset(assetRef: string): Promise<string> {
    const cached = assetCache.get(assetRef)
    if (cached) return cached

    const match = assetRef.match(/^image-([a-f0-9]+)-(\d+x\d+)-(\w+)$/)
    if (!match) throw new Error(`Unrecognized image asset ref: ${assetRef}`)
    const [, id, dims, format] = match
    const url = `https://cdn.sanity.io/images/${countyProjectId}/${countyDataset}/${id}-${dims}.${format}`

    const res = await fetch(url)
    if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    const asset = await target.assets.upload('image', buffer, { filename: `${id}.${format}` })
    assetCache.set(assetRef, asset._id)
    return asset._id
  }

  // Recursively walks a document (including portable-text body arrays) and
  // re-uploads any image asset it finds, rewriting the ref to point at the
  // newly-uploaded asset in the target project.
  async function reuploadImagesDeep(node: unknown): Promise<unknown> {
    if (Array.isArray(node)) {
      return Promise.all(node.map((item) => reuploadImagesDeep(item)))
    }
    if (node && typeof node === 'object') {
      const obj = node as Record<string, unknown>
      const asset = obj.asset as { _ref?: string } | undefined
      if (obj._type === 'image' && asset?._ref?.startsWith('image-')) {
        const newRef = await reuploadAsset(asset._ref)
        return { ...obj, asset: { _type: 'reference', _ref: newRef } }
      }
      const entries = await Promise.all(
        Object.entries(obj).map(async ([key, val]) => [key, await reuploadImagesDeep(val)] as const)
      )
      return Object.fromEntries(entries)
    }
    return node
  }

  async function migrateDocs(type: string, stripSharingFields: boolean) {
    const docs = await county.fetch<Array<Record<string, unknown>>>(
      `*[_type == $type && municipality._ref == $municipalityId && !(_id in path("drafts.**"))]`,
      { type, municipalityId }
    )
    let count = 0
    for (const doc of docs) {
      const cleaned: Record<string, unknown> = { ...doc }
      delete cleaned._rev
      delete cleaned._createdAt
      delete cleaned._updatedAt
      delete cleaned.municipality
      if (stripSharingFields) {
        delete cleaned.shareWithAll
        delete cleaned.sharedWith
      }
      const withReuploadedImages = await reuploadImagesDeep(cleaned)
      await target.createOrReplace(withReuploadedImages as { _id: string; _type: string })
      count++
    }
    console.log(`  ${type}: ${count} document(s)`)
  }

  for (const type of CONTENT_TYPES_WITH_SHARING) await migrateDocs(type, true)
  for (const type of CONTENT_TYPES_OWN_ONLY) await migrateDocs(type, false)

  // municipalitySettings singleton — branding/nav/contact only; routing
  // fields (slug/customDomain/subdomain/isActive) stay in the county registry.
  const fullMunicipality = await county.fetch<Record<string, unknown>>(
    `*[_id == $id][0]`,
    { id: municipalityId }
  )
  const settingsDoc: Record<string, unknown> = { ...fullMunicipality }
  for (const field of ['_id', '_rev', '_createdAt', '_updatedAt', 'slug', 'customDomain', 'subdomain', 'isActive', 'externalSiteUrl']) {
    delete settingsDoc[field]
  }
  settingsDoc._id = 'municipalitySettings'
  settingsDoc._type = 'municipalitySettings'
  const settingsWithImages = await reuploadImagesDeep(settingsDoc)
  await target.createOrReplace(settingsWithImages as { _id: string; _type: string })
  console.log('  municipalitySettings: 1 document')

  console.log(`\nDone. County copies were left in place — verify the new project, then delete them from county manually.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
