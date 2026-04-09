import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { CommentsQuerySchema, type CommentsResponse } from '@ytmod/shared'

type Bindings = { YOUTUBE_API_KEY: string }

export const comments = new Hono<{ Bindings: Bindings }>()

// Simple in-memory rate limit: 30 req/min per IP
const rateMap = new Map<string, { count: number; reset: number }>()

comments.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown'
  const now = Date.now()
  const entry = rateMap.get(ip)

  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 })
  } else if (entry.count >= 30) {
    return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429)
  } else {
    entry.count++
  }

  return next()
})

comments.get('/', zValidator('query', CommentsQuerySchema), async (c) => {
  const { videoId, maxResults, pageToken, order } = c.req.valid('query')
  const apiKey = c.env.YOUTUBE_API_KEY

  const params = new URLSearchParams({
    part: 'snippet',
    videoId,
    maxResults: String(maxResults),
    order,
    key: apiKey,
    ...(pageToken ? { pageToken } : {}),
  })

  const res = await fetch(`https://www.googleapis.com/youtube/v3/commentThreads?${params}`)

  if (!res.ok) {
    const err = (await res.json()) as { error: { message: string } }
    return c.json({ error: err.error.message }, res.status as 400 | 403 | 404)
  }

  const data = (await res.json()) as {
    pageInfo: { totalResults: number }
    nextPageToken?: string
    items: Array<{
      id: string
      snippet: {
        topLevelComment: {
          snippet: {
            authorDisplayName: string
            textDisplay: string
            likeCount: number
            publishedAt: string
          }
        }
        totalReplyCount: number
      }
    }>
  }

  // Fetch video title — failure is non-fatal
  let videoTitle: string | undefined
  try {
    const videoParams = new URLSearchParams({ part: 'snippet', id: videoId, key: apiKey })
    const videoRes = await fetch(`https://www.googleapis.com/youtube/v3/videos?${videoParams}`)
    if (videoRes.ok) {
      const videoData = (await videoRes.json()) as { items: Array<{ snippet: { title: string } }> }
      videoTitle = videoData.items[0]?.snippet?.title
    }
  } catch {
    // swallow — videoTitle stays undefined
  }

  const response: CommentsResponse = {
    videoId,
    videoTitle,
    totalComments: data.pageInfo.totalResults,
    nextPageToken: data.nextPageToken,
    comments: data.items.map((item) => ({
      id: item.id,
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      text: item.snippet.topLevelComment.snippet.textDisplay,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      replyCount: item.snippet.totalReplyCount,
    })),
  }

  return c.json(response)
})
