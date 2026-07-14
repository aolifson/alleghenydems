import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['sanity'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  // Bundle the admin-guide pages with the route that streams them.
  outputFileTracingIncludes: {
    '/members/admin-guide/[[...page]]': ['./docs/admin-guide/*.html'],
  },
  async redirects() {
    return [
      // Admin guide moved behind the members-area login
      { source: '/admin-guide.html', destination: '/members/admin-guide', permanent: true },
    ]
  },
}

export default nextConfig
