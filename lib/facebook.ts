export interface FacebookPost {
  id: string
  message?: string
  permalinkUrl: string
  createdTime: string
  imageUrl?: string
}

export interface FacebookPostsPage {
  posts: FacebookPost[]
  nextCursor?: string
}

interface RawFacebookPost {
  id: string
  message?: string
  permalink_url?: string
  created_time?: string
  full_picture?: string
  attachments?: {
    data?: Array<{
      media?: { image?: { src?: string } }
      subattachments?: {
        data?: Array<{
          media?: { image?: { src?: string } }
        }>
      }
    }>
  }
}

interface RawFacebookResponse {
  data?: RawFacebookPost[]
  paging?: {
    cursors?: {
      after?: string
    }
  }
}

const GRAPH_API_VERSION = process.env.FACEBOOK_GRAPH_API_VERSION ?? 'v23.0'

function getImageUrl(post: RawFacebookPost) {
  if (post.full_picture) return post.full_picture
  const attachment = post.attachments?.data?.[0]
  const subImage = attachment?.subattachments?.data?.[0]?.media?.image?.src
  if (subImage) return subImage
  return attachment?.media?.image?.src
}

export async function fetchFacebookPosts(opts?: { after?: string; limit?: number }) {
  const pageId = process.env.FACEBOOK_PAGE_ID
  const token = process.env.FACEBOOK_PAGE_ACCESS_TOKEN
  if (!pageId || !token) return null

  const limit = opts?.limit ?? 3
  const query = new URLSearchParams({
    fields: 'id,message,permalink_url,created_time,full_picture,attachments{media,subattachments{media}}',
    limit: String(limit),
    access_token: token,
  })
  if (opts?.after) query.set('after', opts.after)

  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${pageId}/posts?${query.toString()}`
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Facebook API error ${res.status}: ${text}`)
  }

  const raw = (await res.json()) as RawFacebookResponse
  const posts: FacebookPost[] = (raw.data ?? [])
    .filter((p) => p.id && p.permalink_url && p.created_time)
    .map((p) => ({
      id: p.id,
      message: p.message,
      permalinkUrl: p.permalink_url as string,
      createdTime: p.created_time as string,
      imageUrl: getImageUrl(p),
    }))

  return {
    posts,
    nextCursor: raw.paging?.cursors?.after,
  } as FacebookPostsPage
}
