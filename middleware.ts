import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { SESSION_COOKIE, verifyMemberToken } from '@/lib/members-auth'

// Hard-coded map for custom domains (added as municipalities onboard).
// Subdomains of alleghenydems.com are resolved automatically below —
// no entry needed here for northside.alleghenydems.com.
const HOSTNAME_TO_SLUG: Record<string, string> = {
  // Custom domains (uncomment and add entries as municipalities onboard):
  // 'northsidedems.com':      'northside',
  // 'www.northsidedems.com':  'northside',
}

const COUNTY_SLUG = 'allegheny-county'

const STUDIO_PREFIX = '/studio'

// Routes that must never be tenant-scoped
const BYPASS_PREFIXES = ['/api', '/_next', '/favicon.ico']

// ── Members-only area gating ────────────────────────────────────────────────
// Cookie-signature check only — no Sanity round-trip per request. The
// sensitive node routes (roster CSV, internal docs) re-verify isActive.
async function hasValidMemberSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (!token) return false
  return (await verifyMemberToken(token, 'session')) !== null
}

// /api/members routes that must stay reachable without a session
const MEMBERS_PUBLIC_API = /^\/api\/members\/(login|verify|preview-login)(\/|$)/

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // The Studio is a client-side app that ships no content of its own — Sanity
  // authenticates every read and write against project membership, so there is
  // nothing here for an edge password to protect. It previously sat behind a
  // shared HTTP Basic login from the private-preview phase; that only added a
  // second set of credentials for editors to keep track of. Skipped here so it
  // never picks up tenant routing.
  if (pathname.startsWith(STUDIO_PREFIX)) {
    return NextResponse.next()
  }

  // Strip the municipality demo prefix so /municipalities/<slug>/members
  // is gated the same as /members (the rewrite below never re-enters here).
  const tenantPath = pathname.replace(/^\/municipalities\/[^/]+/, '') || '/'
  const isMembersPage =
    /^\/members(\/|$)/.test(tenantPath) && !/^\/members\/login(\/|$)/.test(tenantPath)
  const isMembersApi = pathname.startsWith('/api/members/') && !MEMBERS_PUBLIC_API.test(pathname)

  if ((isMembersPage || isMembersApi) && !(await hasValidMemberSession(request))) {
    if (isMembersApi) {
      return new NextResponse('Unauthorized', { status: 401, headers: { 'Cache-Control': 'no-store' } })
    }
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/members/login'
    loginUrl.search = ''
    return NextResponse.redirect(loginUrl)
  }

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
