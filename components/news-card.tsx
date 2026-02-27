import Link from 'next/link'
import Image from 'next/image'
import type { NewsPost } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export default function NewsCard({ post, basePath = '' }: { post: NewsPost; basePath?: string }) {
  const date = new Date(post.publishedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const href = post.isExternal ? post.externalUrl! : `${basePath}/news/${post.slug.current}`
  const isExternal = post.isExternal && post.externalUrl

  return (
    <article className="bg-white rounded-lg shadow-sm border border-[var(--color-border)] overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {post.image && (
        <div className="relative h-44 bg-[var(--color-blue-light)]">
          <Image
            src={urlFor(post.image).width(600).height(350).url()}
            alt={post.title}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-[var(--color-text-muted)] mb-1">
          {date}
          {post.externalPublication && <span className="ml-2 text-[var(--color-blue-mid)]">· {post.externalPublication}</span>}
        </p>
        <h3 className="font-semibold text-[var(--color-text)] leading-snug mb-2">{post.title}</h3>
        {post.excerpt && <p className="text-sm text-[var(--color-text-muted)] line-clamp-3 mb-3">{post.excerpt}</p>}
        <Link
          href={href}
          target={isExternal ? '_blank' : undefined}
          rel={isExternal ? 'noopener noreferrer' : undefined}
          className="mt-auto text-sm font-semibold text-[var(--color-blue-mid)] hover:underline"
        >
          {isExternal ? 'Read Article ↗' : 'Read More →'}
        </Link>
      </div>
    </article>
  )
}
