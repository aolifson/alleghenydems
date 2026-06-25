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

function unauthorizedStudioResponse() {
  return new NextResponse('Studio authentication required.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Allegheny Dems Studio"',
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function studioAuthMisconfiguredResponse() {
  return new NextResponse('Studio auth is not configured. Set STUDIO_USERNAME and STUDIO_PASSWORD.', {
    status: 503,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}

function isAuthorizedStudioRequest(request: NextRequest) {
  const studioUsername = process.env.STUDIO_USERNAME
  const studioPassword = process.env.STUDIO_PASSWORD

  if (!studioUsername || !studioPassword) {
    return { ok: false as const, misconfigured: true as const }
  }

  const authorization = request.headers.get('authorization')
  if (!authorization?.startsWith('Basic ')) {
    return { ok: false as const, misconfigured: false as const }
  }

  try {
    const encodedCredentials = authorization.slice('Basic '.length)
    const decodedCredentials = atob(encodedCredentials)
    const separatorIndex = decodedCredentials.indexOf(':')

    if (separatorIndex === -1) {
      return { ok: false as const, misconfigured: false as const }
    }

    const username = decodedCredentials.slice(0, separatorIndex)
    const password = decodedCredentials.slice(separatorIndex + 1)

    return {
      ok: username === studioUsername && password === studioPassword,
      misconfigured: false as const,
    }
  } catch {
    return { ok: false as const, misconfigured: false as const }
  }
}

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

  if (pathname.startsWith(STUDIO_PREFIX)) {
    const authState = isAuthorizedStudioRequest(request)

    if (authState.misconfigured) {
      return studioAuthMisconfiguredResponse()
    }

    if (!authState.ok) {
      return unauthorizedStudioResponse()
    }

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
