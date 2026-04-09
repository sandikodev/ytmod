import { describe, it, expect } from 'vitest'
import { Hono } from 'hono'
import { comments } from './routes/comments'

// Test app dengan mock bindings
const testApp = new Hono<{ Bindings: { YOUTUBE_API_KEY: string; CORS_ORIGINS: string } }>()
testApp.route('/comments', comments)
testApp.get('/', (c) => c.json({ name: 'ytmod-api', version: '0.0.1' }))

const mockEnv = { YOUTUBE_API_KEY: 'test-key', CORS_ORIGINS: 'http://localhost:5173' }

describe('GET /', () => {
  it('returns api info', async () => {
    const res = await testApp.request('/', {}, mockEnv)
    expect(res.status).toBe(200)
    const body = (await res.json()) as { name: string }
    expect(body.name).toBe('ytmod-api')
  })
})

describe('GET /comments', () => {
  it('returns 400 when videoId is missing', async () => {
    const res = await testApp.request('/comments', {}, mockEnv)
    expect(res.status).toBe(400)
  })

  it('returns 400 when videoId is empty', async () => {
    const res = await testApp.request('/comments?videoId=', {}, mockEnv)
    expect(res.status).toBe(400)
  })

  it('returns 400 when maxResults exceeds 100', async () => {
    const res = await testApp.request('/comments?videoId=abc&maxResults=101', {}, mockEnv)
    expect(res.status).toBe(400)
  })
})
