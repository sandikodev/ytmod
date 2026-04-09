import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Hono } from 'hono'
import { comments } from './comments'

const testApp = new Hono<{ Bindings: { YOUTUBE_API_KEY: string } }>()
testApp.route('/comments', comments)

const mockEnv = { YOUTUBE_API_KEY: 'test-key' }

const mockCommentThreadsResponse = {
  pageInfo: { totalResults: 2 },
  nextPageToken: undefined,
  items: [
    {
      id: 'comment-1',
      snippet: {
        topLevelComment: {
          snippet: {
            authorDisplayName: 'User A',
            textDisplay: 'Hello world',
            likeCount: 5,
            publishedAt: '2024-01-01T00:00:00Z',
          },
        },
        totalReplyCount: 1,
      },
    },
  ],
}

const mockVideosResponse = {
  items: [{ snippet: { title: 'My Awesome Video' } }],
}

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('GET /comments — videoTitle', () => {
  it('includes videoTitle in response when videos API succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCommentThreadsResponse), { status: 200 })
        )
        .mockResolvedValueOnce(new Response(JSON.stringify(mockVideosResponse), { status: 200 }))
    )

    const res = await testApp.request('/comments?videoId=abc123', {}, mockEnv)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { videoTitle: string }
    expect(body.videoTitle).toBe('My Awesome Video')
  })

  it('returns response without videoTitle when videos API fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCommentThreadsResponse), { status: 200 })
        )
        .mockResolvedValueOnce(new Response('{}', { status: 500 }))
    )

    const res = await testApp.request('/comments?videoId=abc123', {}, mockEnv)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { videoTitle?: string }
    expect(body.videoTitle).toBeUndefined()
  })

  it('returns response without videoTitle when videos API returns empty items', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCommentThreadsResponse), { status: 200 })
        )
        .mockResolvedValueOnce(new Response(JSON.stringify({ items: [] }), { status: 200 }))
    )

    const res = await testApp.request('/comments?videoId=abc123', {}, mockEnv)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { videoTitle?: string }
    expect(body.videoTitle).toBeUndefined()
  })

  it('still returns comments even when videos API throws', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(JSON.stringify(mockCommentThreadsResponse), { status: 200 })
        )
        .mockRejectedValueOnce(new Error('Network error'))
    )

    const res = await testApp.request('/comments?videoId=abc123', {}, mockEnv)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { videoTitle?: string; comments: unknown[] }
    expect(body.videoTitle).toBeUndefined()
    expect(body.comments).toHaveLength(1)
  })
})
