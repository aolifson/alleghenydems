import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { PortableText } from '@portabletext/react'
import { getNewsPost } from '@/sanity/lib/queries'
import { urlFor } from '@/sanity/lib/image'

export const revalidate = 3600

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getNewsPost(slug)
  if (!post) return {}
  return { title: post.title, description: post.excerpt }
}

export default async function NewsPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getNewsPost(slug)
  if (!post) notFound()

  const date = new Date(post.publishedAt).toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  return (
    <article className="max-w-3xl mx-auto px-4 py-10">
      {post.image && (
        <div className="relative h-64 md:h-80 rounded-lg overflow-hidden mb-8">
          <Image
            src={urlFor(post.image).width(900).height(500).url()}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}
      <p className="text-sm text-[var(--color-text-muted)] mb-2">{date}</p>
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[var(--color-blue)] mb-6 leading-tight">
        {post.title}
      </h1>
      {post.body && (
        <div className="prose-content">
          <PortableText value={post.body as Parameters<typeof PortableText>[0]['value']} />
        </div>
      )}
    </article>
  )
}
