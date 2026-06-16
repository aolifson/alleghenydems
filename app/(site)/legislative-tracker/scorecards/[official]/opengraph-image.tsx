import { ImageResponse } from 'next/og'
import { getLegislativeTrackerBySlug } from '@/sanity/lib/queries'
import { findScorecard } from '@/lib/scorecards'

export const runtime = 'nodejs'
export const revalidate = 3600
export const alt = 'Official legislative scorecard'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ official: string }> }) {
  const { official } = await params
  const tracker = await getLegislativeTrackerBySlug('legislative-tracker')
  const card = findScorecard(tracker?.actions, official)

  const name = card?.name ?? 'Legislative Scorecard'
  const office = card?.office ?? 'Allegheny County'
  const isDem = card?.party === 'D'
  const accent = isDem ? '#1d4ed8' : '#b91c1c'

  const stats: { n: number; label: string; color: string }[] = []
  if (card) {
    if (card.delivered) stats.push({ n: card.delivered, label: 'DELIVERED', color: '#15803d' })
    if (card.blocked) stats.push({ n: card.blocked, label: 'BLOCKED', color: '#b91c1c' })
    if (card.harmful) stats.push({ n: card.harmful, label: 'HARMFUL', color: '#7f1d1d' })
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0d2240',
          color: 'white',
          padding: '64px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', fontSize: 26, color: '#9db4d4', letterSpacing: 1 }}>
          ALLEGHENY COUNTY DEMOCRATS · LEGISLATIVE SCORECARD
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
          <div
            style={{
              display: 'flex',
              alignSelf: 'flex-start',
              backgroundColor: accent,
              color: 'white',
              fontSize: 24,
              fontWeight: 700,
              padding: '6px 16px',
              borderRadius: 8,
              marginBottom: 20,
            }}
          >
            {isDem ? 'DEMOCRAT' : 'REPUBLICAN'}
          </div>
          <div style={{ display: 'flex', fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>{name}</div>
          <div style={{ display: 'flex', fontSize: 32, color: '#c7d6ea', marginTop: 8 }}>{office}</div>
        </div>

        <div style={{ display: 'flex', gap: 56, marginTop: 40 }}>
          {stats.length > 0 ? (
            stats.map((s) => (
              <div key={s.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', fontSize: 84, fontWeight: 800, color: s.color === '#15803d' ? '#4ade80' : '#fca5a5' }}>
                  {s.n}
                </div>
                <div style={{ display: 'flex', fontSize: 24, color: '#9db4d4', letterSpacing: 2 }}>{s.label}</div>
              </div>
            ))
          ) : (
            <div style={{ display: 'flex', fontSize: 30, color: '#c7d6ea' }}>See the full record →</div>
          )}
        </div>
      </div>
    ),
    size
  )
}
