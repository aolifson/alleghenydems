import { NextResponse } from 'next/server'
import { getMemberRoster } from '@/sanity/lib/queries'
import { getActiveMemberEmail } from '@/lib/members-session'

function csvField(value: string | undefined): string {
  const v = value ?? ''
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

export async function GET() {
  const email = await getActiveMemberEmail()
  if (!email) {
    return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
  }

  const members = await getMemberRoster()
  const header = 'Name,Role,Committee/Ward,Email,Phone'
  const rows = members.map((m) =>
    [m.name, m.role, m.seat, m.email, m.phone].map(csvField).join(',')
  )
  const csv = [header, ...rows].join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="acdc-member-roster.csv"',
      'Cache-Control': 'private, no-store',
    },
  })
}
