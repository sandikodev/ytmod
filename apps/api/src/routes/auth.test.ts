/**
 * Auth route tests — POST /auth/register, POST /auth/login
 *
 * Mock createDb agar test tidak butuh database real.
 * Setiap test suite punya in-memory user store sendiri.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import app from '../index'

const mockEnv = {
  YOUTUBE_API_KEY: 'test-key',
  CORS_ORIGINS: 'http://localhost:5173',
  CLIPPER_ENGINE_URL: 'http://localhost:8080',
  TURSO_URL: 'libsql://mock',
  TURSO_AUTH_TOKEN: 'mock-token',
  JWT_SECRET: 'test-secret-min-32-chars-long-ok',
}

// In-memory user store untuk test
let userStore: Array<{ id: string; email: string; passwordHash: string; createdAt: number }> = []

// Mock createDb — return fake drizzle-like object
vi.mock('../db/client', () => ({
  createDb: () => ({
    select: () => ({
      from: () => ({
        where: () => ({
          get: async () => userStore[0] ?? null,
        }),
      }),
    }),
    insert: () => ({
      values: async (data: (typeof userStore)[0]) => {
        userStore.push(data)
      },
    }),
  }),
}))

beforeEach(() => {
  userStore = [] // reset store setiap test
})

describe('POST /auth/register', () => {
  it('returns 400 on invalid email', async () => {
    const res = await app.request(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'notanemail', password: 'password123' }),
      },
      mockEnv
    )
    expect(res.status).toBe(400)
  })

  it('returns 400 on short password', async () => {
    const res = await app.request(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'short' }),
      },
      mockEnv
    )
    expect(res.status).toBe(400)
  })

  it('registers successfully and returns token', async () => {
    const res = await app.request(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'user@example.com', password: 'password123' }),
      },
      mockEnv
    )
    expect(res.status).toBe(201)
    const data = (await res.json()) as { token: string; user: { email: string } }
    expect(data.token).toBeTruthy()
    expect(data.user.email).toBe('user@example.com')
  })

  it('returns 409 on duplicate email', async () => {
    // Simulasi user sudah ada
    userStore.push({ id: 'existing', email: 'dup@example.com', passwordHash: 'x', createdAt: 0 })
    const res = await app.request(
      '/auth/register',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'dup@example.com', password: 'password123' }),
      },
      mockEnv
    )
    expect(res.status).toBe(409)
  })
})

describe('POST /auth/login', () => {
  it('returns 401 when user not found', async () => {
    const res = await app.request(
      '/auth/login',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nobody@example.com', password: 'password123' }),
      },
      mockEnv
    )
    expect(res.status).toBe(401)
  })
})
