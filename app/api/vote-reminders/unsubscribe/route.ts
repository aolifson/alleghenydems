import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { writeClient } from '@/sanity/lib/client'

// Public, no-auth one-click unsubscribe. Finds the signup by its secret token,
// flips `unsubscribed` to true, then redirects to a friendly confirmation page.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')?.trim()
  const baseUrl = (process.env.MEMBERS_BASE_URL ?? request.nextUrl.origin).replace(/\/$/, '')

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/vote-reminders/unsubscribed?status=invalid`)
  }

  try {
    // The typed client can't infer the $token param type without typegen, so
    // call fetch through a plain signature for this lookup.
    const fetchByToken = writeClient.fetch as (
      query: string,
      params: Record<string, string>,
    ) => Promise<{ _id: string } | null>
    const doc = await fetchByToken(
      `*[_type == "voteReminder" && unsubscribeToken == $token][0]{ _id }`,
      { token },
    )

    if (!doc) {
      return NextResponse.redirect(`${baseUrl}/vote-reminders/unsubscribed?status=invalid`)
    }

    await writeClient.patch(doc._id).set({ unsubscribed: true }).commit()
    return NextResponse.redirect(`${baseUrl}/vote-reminders/unsubscribed?status=ok`)
  } catch (error) {
    console.error('Vote reminder unsubscribe failed:', error)
    return NextResponse.redirect(`${baseUrl}/vote-reminders/unsubscribed?status=error`)
  }
}
