import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Hard-coded map for custom domains (added as municipalities onboard).
// Subdomains of alleghenydems.com are resolved automatically below —
// no entry needed here for northside.alleghenydems.com.
const HOSTNAME_TO_SLUG: Record<string, string> = {
  // Custom domains (uncomment and add entries as municipalities onboard):
  // 'northsidedems.com':      'northside',
  // 'www.northsidedems.com':  'northside',
}

const COUNTY_SLUG = 'allegheny-county'

// Routes that must never be tenant-scoped
const BYPASS_PREFIXES = ['/studio', '/api', '/_next', '/favicon.ico']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (BYPASS_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  // ── Path-based demo routing ───────────────────────────────────────────────
  // /municipalities/northside/events → served as /events with northside branding.
  // No DNS or Vercel domain config needed — works immediately after creating
  // a municipality document in Sanity.
  const municipalitiesMatch = pathname.match(/^\/municipalities\/([^/]+)(\/.*)?$/)
  if (municipalitiesMatch) {
    const slug = municipalitiesMatch[1]
    const rest = municipalitiesMatch[2] || '/'
    const rewriteUrl = request.nextUrl.clone()
    rewriteUrl.pathname = rest
    const response = NextResponse.rewrite(rewriteUrl)
    response.headers.set('x-municipality-slug', slug)
    response.headers.set('x-municipality-prefix', `/municipalities/${slug}`)
    return response
  }

  // ── Hostname-based production routing ────────────────────────────────────
  const hostname = request.headers.get('host') ?? ''
  const host = hostname.split(':')[0] // strip port for local dev

  let slug: string

  if (HOSTNAME_TO_SLUG[host]) {
    // Custom domain match
    slug = HOSTNAME_TO_SLUG[host]
  } else {
    // Check for subdomain pattern: xxx.alleghenydems.com
    // A municipality is live at their-slug.alleghenydems.com as soon as
    // their municipality document exists in Sanity — no code deploy needed.
    const subdomainMatch = host.match(/^([^.]+)\.alleghenydems\.com$/)
    if (subdomainMatch) {
      slug = subdomainMatch[1]
    } else {
      // alleghenydems.com, localhost, and any unrecognized host → county site
      slug = COUNTY_SLUG
    }
  }

  const response = NextResponse.next()
  response.headers.set('x-municipality-slug', slug)
  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
