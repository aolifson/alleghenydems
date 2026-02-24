/**
 * POST /api/csv-import
 *
 * Accepts a CSV file upload of committee members and upserts them into Sanity.
 *
 * Expected CSV columns (case-insensitive, flexible):
 *   name, title/role, district/ward/municipality, email, phone
 *
 * Protected by a secret token: include header  Authorization: Bearer <SANITY_API_TOKEN>
 *
 * Example curl:
 *   curl -X POST https://your-site.vercel.app/api/csv-import \
 *     -H "Authorization: Bearer <token>" \
 *     -F "file=@members.csv"
 */

import { NextRequest, NextResponse } from 'next/server'
import Papa from 'papaparse'
import { writeClient } from '@/sanity/lib/client'
import crypto from 'crypto'

// Simple auth: require SANITY_API_TOKEN as bearer token
function isAuthorized(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.replace(/^Bearer\s+/i, '').trim()
  return token === process.env.SANITY_API_TOKEN
}

// Normalize CSV header names to canonical field names
function normalizeHeaders(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  const aliases: Record<string, string[]> = {
    name:     ['name', 'full name', 'fullname', 'member name'],
    title:    ['title', 'role', 'position', 'office'],
    district: ['district', 'ward', 'municipality', 'area', 'precinct'],
    email:    ['email', 'email address', 'e-mail'],
    phone:    ['phone', 'phone number', 'telephone', 'cell', 'mobile'],
  }
  for (const header of headers) {
    const lower = header.toLowerCase().trim()
    for (const [field, aliasList] of Object.entries(aliases)) {
      if (aliasList.some((a) => lower.includes(a))) {
        map[header] = field
        break
      }
    }
  }
  return map
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) {
    return NextResponse.json({ error: 'No file uploaded. Send as multipart form field "file".' }, { status: 400 })
  }

  const csvText = await file.text()
  const { data, errors } = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  })

  if (errors.length > 0) {
    return NextResponse.json({ error: 'CSV parse error', details: errors }, { status: 400 })
  }

  if (data.length === 0) {
    return NextResponse.json({ error: 'CSV file is empty.' }, { status: 400 })
  }

  const headerMap = normalizeHeaders(Object.keys(data[0]))

  // Map rows to Sanity documents
  const transaction = writeClient.transaction()
  let created = 0
  let updated = 0

  for (const row of data) {
    const mapped: Record<string, string> = {}
    for (const [originalKey, fieldName] of Object.entries(headerMap)) {
      if (row[originalKey]) mapped[fieldName] = row[originalKey].trim()
    }

    if (!mapped.name) continue // skip rows without a name

    // Deterministic ID from name + district for upsert/deduplication
    const idSource = `${mapped.name}|${mapped.district ?? ''}`.toLowerCase()
    const externalId = crypto.createHash('md5').update(idSource).digest('hex').slice(0, 16)
    const docId = `committeeMember-${externalId}`

    const doc = {
      _id: docId,
      _type: 'committeeMember',
      externalId,
      name: mapped.name,
      ...(mapped.title    && { title: mapped.title }),
      ...(mapped.district && { district: mapped.district }),
      ...(mapped.email    && { email: mapped.email }),
      ...(mapped.phone    && { phone: mapped.phone }),
      isActive: true,
    }

    // createOrReplace: full upsert
    transaction.createOrReplace(doc)
    // We can't distinguish create/update without pre-fetching; count all
    created++
  }

  await transaction.commit()

  return NextResponse.json({
    success: true,
    message: `Processed ${created} committee members.`,
    rows: data.length,
  })
}
