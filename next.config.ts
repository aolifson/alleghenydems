import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  serverExternalPackages: ['sanity'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.sanity.io' },
    ],
  },
  // Bundle the relocated admin guide with the route that streams it.
  outputFileTracingIncludes: {
    '/members/admin-guide': ['./private/admin-guide.html'],
  },
  async redirects() {
    return [
      // Admin guide moved behind the members-area login
      { source: '/admin-guide.html', destination: '/members/admin-guide', permanent: true },
    ]
  },
}

export default nextConfig
