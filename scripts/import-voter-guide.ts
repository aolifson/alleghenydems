#!/usr/bin/env npx ts-node
/**
 * Voter Guide PDF Import Script
 *
 * STEP 1 – Extract & Parse (generates JSON for review):
 *   npx ts-node scripts/import-voter-guide.ts path/to/voter-guide.pdf
 *   Output → scripts/output/voter-guide-YYYY-MM-DD.json
 *
 * STEP 2 – Review the JSON file, edit as needed, then import to Sanity:
 *   npx ts-node scripts/import-voter-guide.ts --import scripts/output/voter-guide-YYYY-MM-DD.json
 *
 * Required env vars: ANTHROPIC_API_KEY, NEXT_PUBLIC_SANITY_PROJECT_ID,
 *                    NEXT_PUBLIC_SANITY_DATASET, SANITY_API_WRITE_TOKEN
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@sanity/client'
import Anthropic from '@anthropic-ai/sdk'

// Load .env.local if present (for local dev)
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n')
    for (const line of lines) {
      const m = line.match(/^([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim()
    }
  }
}

loadEnv()

// ─── Sanity client ────────────────────────────────────────────────────
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_WRITE_TOKEN,
  useCdn: false,
})

// ─── Types mirroring voterGuide schema ───────────────────────────────
interface ImportCandidate {
  name: string
  description?: string
  campaignWebsite?: string
  facebookUrl?: string
  instagramUrl?: string
  xUrl?: string
  endorsedByAcdc?: boolean
  ballotStatus?: 'listed' | 'alsoAppearing' | 'appearing' | 'endorsed' | 'unknown'
  displayOrder?: number
}

interface ImportDistrict {
  districtLabel: string
  districtDescription?: string
  candidates: ImportCandidate[]
  displayOrder?: number
}

interface ImportRace {
  officeTitle: string
  term?: string
  annualSalary?: string
  powersAndDuties?: string[]
  districts: ImportDistrict[]
  displayOrder?: number
}

interface ImportVoterGuide {
  title: string
  slug: string
  cycleYear: number
  heroHeadline?: string
  electionDate?: string
  races: ImportRace[]
  sourcePdfTitle?: string
}

// ─── STEP 1: Extract PDF text ─────────────────────────────────────────
async function extractPdfText(pdfPath: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse')
  const buffer = fs.readFileSync(pdfPath)
  const data = await pdfParse(buffer)
  return data.text
}

// ─── STEP 1: Parse with Claude ────────────────────────────────────────
async function parseWithClaude(pdfText: string, pdfFileName: string): Promise<ImportVoterGuide> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const schema = `{
  "title": "2026 ACDC Primary Voter Guide",
  "slug": "2026-primary",
  "cycleYear": 2026,
  "heroHeadline": "Optional headline",
  "electionDate": "2026-05-19",
  "sourcePdfTitle": "filename.pdf",
  "races": [
    {
      "officeTitle": "Sheriff",
      "term": "4 years",
      "annualSalary": "$95,000",
      "powersAndDuties": ["Law enforcement", "Court security"],
      "displayOrder": 1,
      "districts": [
        {
          "districtLabel": "COUNTYWIDE",
          "districtDescription": "Optional description",
          "displayOrder": 1,
          "candidates": [
            {
              "name": "Jane Smith",
              "description": "Bio text here",
              "campaignWebsite": "https://example.com",
              "facebookUrl": "",
              "instagramUrl": "",
              "xUrl": "",
              "endorsedByAcdc": true,
              "ballotStatus": "endorsed",
              "displayOrder": 1
            }
          ]
        }
      ]
    }
  ]
}`

  const systemPrompt = `You are a data extraction assistant. Extract voter guide content from a PDF and output ONLY valid JSON matching the provided schema. Follow these rules:
- Extract ALL races/offices mentioned
- For each race extract all districts and candidates
- ballotStatus must be one of: listed, alsoAppearing, appearing, endorsed, unknown
- endorsedByAcdc should be true if the candidate is explicitly marked as endorsed by ACDC or the party
- If a URL is not found, omit the field entirely (do not include empty strings)
- displayOrder should reflect the order they appear in the PDF (1, 2, 3...)
- For electionDate use ISO format YYYY-MM-DD (infer from context or leave blank)
- The slug should be URL-safe lowercase with hyphens, e.g. "2026-primary"
- Output ONLY the JSON object, no markdown fences, no explanation`

  const userPrompt = `Source PDF filename: ${pdfFileName}

Extract this voter guide PDF text into the JSON schema:

SCHEMA:
${schema}

PDF TEXT:
${pdfText.slice(0, 80000)}`

  console.log('Sending to Claude claude-opus-4-6 for parsing...')
  const response = await anthropic.messages.create({
    model: 'claude-opus-4-6',
    max_tokens: 8192,
    messages: [{ role: 'user', content: userPrompt }],
    system: systemPrompt,
  })

  const rawText = response.content[0].type === 'text' ? response.content[0].text : ''

  // Strip any accidental markdown fences
  const cleaned = rawText.replace(/^```json\n?/m, '').replace(/^```\n?/m, '').replace(/```$/m, '').trim()

  return JSON.parse(cleaned)
}

// ─── STEP 2: Import JSON to Sanity ───────────────────────────────────
function addKeys(races: ImportRace[]) {
  return races.map((race, ri) => ({
    ...race,
    _key: `race_${ri}`,
    districts: race.districts.map((district, di) => ({
      ...district,
      _key: `race_${ri}_district_${di}`,
      candidates: district.candidates.map((candidate, ci) => ({
        ...candidate,
        _key: `race_${ri}_district_${di}_candidate_${ci}`,
      })),
    })),
  }))
}

async function importToSanity(guide: ImportVoterGuide) {
  if (!process.env.SANITY_API_WRITE_TOKEN) {
    throw new Error('SANITY_API_WRITE_TOKEN env var is required for import')
  }

  const doc = {
    _type: 'voterGuide',
    title: guide.title,
    slug: { _type: 'slug', current: guide.slug },
    cycleYear: guide.cycleYear,
    ...(guide.heroHeadline && { heroHeadline: guide.heroHeadline }),
    ...(guide.electionDate && { electionDate: guide.electionDate }),
    ...(guide.sourcePdfTitle && { sourcePdfTitle: guide.sourcePdfTitle }),
    races: addKeys(guide.races),
  }

  console.log(`Creating voter guide document: "${guide.title}"`)
  const result = await sanity.create(doc)
  console.log(`✅ Created document: ${result._id}`)
  console.log(`   Open in Studio: /studio/desk/voterGuide;${result._id}`)
  return result
}

// ─── Main ─────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2)

  if (args[0] === '--import') {
    // STEP 2: Import a reviewed JSON file
    const jsonPath = args[1]
    if (!jsonPath) {
      console.error('Usage: --import <path-to-json-file>')
      process.exit(1)
    }
    console.log(`Reading JSON from: ${jsonPath}`)
    const guide: ImportVoterGuide = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
    await importToSanity(guide)
    return
  }

  // STEP 1: Extract PDF and generate JSON for review
  const pdfPath = args[0]
  if (!pdfPath || !fs.existsSync(pdfPath)) {
    console.error(`Usage:
  Step 1 (extract):  npx ts-node scripts/import-voter-guide.ts path/to/guide.pdf
  Step 2 (import):   npx ts-node scripts/import-voter-guide.ts --import scripts/output/voter-guide-YYYY-MM-DD.json`)
    process.exit(1)
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('Error: ANTHROPIC_API_KEY env var is required for PDF extraction')
    process.exit(1)
  }

  console.log(`Extracting text from: ${pdfPath}`)
  const pdfText = await extractPdfText(pdfPath)
  console.log(`Extracted ${pdfText.length} characters`)

  const guide = await parseWithClaude(pdfText, path.basename(pdfPath))

  const dateStr = new Date().toISOString().slice(0, 10)
  const outputPath = path.join('scripts', 'output', `voter-guide-${dateStr}.json`)
  fs.writeFileSync(outputPath, JSON.stringify(guide, null, 2))

  console.log(`\n✅ JSON written to: ${outputPath}`)
  console.log(`   Review and edit the file, then run:`)
  console.log(`   npx ts-node scripts/import-voter-guide.ts --import ${outputPath}`)
  console.log(`\n   Note: Candidate photos must be uploaded manually in Sanity Studio.`)
}

main().catch((err) => {
  console.error('Fatal error:', err.message ?? err)
  process.exit(1)
})
