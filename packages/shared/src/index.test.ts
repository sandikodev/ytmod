import { describe, it, expect } from 'vitest'
import { CommentsQuerySchema, CommentsResponseSchema, CommentSchema } from './index'

describe('CommentsQuerySchema', () => {
  it('parses valid query', () => {
    const result = CommentsQuerySchema.parse({ videoId: 'abc123' })
    expect(result.maxResults).toBe(20)
    expect(result.order).toBe('relevance')
  })

  it('rejects empty videoId', () => {
    expect(() => CommentsQuerySchema.parse({ videoId: '' })).toThrow()
  })

  it('coerces maxResults from string', () => {
    const result = CommentsQuerySchema.parse({ videoId: 'abc', maxResults: '50' })
    expect(result.maxResults).toBe(50)
  })

  it('clamps maxResults to 100', () => {
    expect(() => CommentsQuerySchema.parse({ videoId: 'abc', maxResults: 101 })).toThrow()
  })

  it('rejects invalid order', () => {
    expect(() => CommentsQuerySchema.parse({ videoId: 'abc', order: 'invalid' })).toThrow()
  })
})

describe('CommentSchema', () => {
  it('parses valid comment', () => {
    const comment = CommentSchema.parse({
      id: '1',
      author: 'user',
      text: 'hello',
      likeCount: 5,
      publishedAt: '2024-01-01T00:00:00Z',
    })
    expect(comment.replyCount).toBeUndefined()
  })
})

describe('CommentsResponseSchema', () => {
  it('parses valid response', () => {
    const res = CommentsResponseSchema.parse({
      videoId: 'abc',
      totalComments: 100,
      comments: [],
    })
    expect(res.nextPageToken).toBeUndefined()
    expect(res.videoTitle).toBeUndefined()
  })
})
