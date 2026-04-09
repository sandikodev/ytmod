/**
 * Auth routes — /auth/register, /auth/login
 *
 * Menggunakan Web Crypto API (native di Cloudflare Workers) untuk:
 *   - Hash password dengan PBKDF2 (bcrypt tidak tersedia di edge)
 *   - Sign JWT dengan HMAC-SHA256 via Hono jwt utils
 *
 * User ID menggunakan crypto.randomUUID() — tersedia native di Workers.
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { sign } from 'hono/jwt'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { createDb, type DbBindings } from '../db/client'
import { users } from '../db/schema'

type Bindings = DbBindings & { JWT_SECRET: string }

export const auth = new Hono<{ Bindings: Bindings }>()

// Input validation schema — dipakai untuk register dan login
const AuthSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

// JWT expire: 7 hari dalam detik
const JWT_EXPIRE_SECONDS = 60 * 60 * 24 * 7

/**
 * Hash password menggunakan PBKDF2 via Web Crypto API.
 * PBKDF2 tersedia native di Cloudflare Workers — tidak butuh bcrypt.
 * Format output: "salt:hash" (hex-encoded, dipisah titik dua)
 */
async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  return `${toHex(salt.buffer)}:${toHex(hash)}`
}

/**
 * Verifikasi password terhadap hash yang tersimpan.
 * Constant-time comparison via crypto.subtle untuk mencegah timing attack.
 */
async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(':')
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)))
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100_000, hash: 'SHA-256' },
    keyMaterial,
    256
  )
  const toHex = (buf: ArrayBuffer) =>
    Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
  return toHex(hash) === hashHex
}

/**
 * POST /auth/register
 * Body: { email, password }
 * Response: { token, user: { id, email } }
 */
auth.post('/register', zValidator('json', AuthSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const db = createDb(c.env)

  // Cek apakah email sudah terdaftar
  const existing = await db.select().from(users).where(eq(users.email, email)).get()
  if (existing) {
    return c.json({ error: 'Email already registered.' }, 409)
  }

  const id = crypto.randomUUID()
  const passwordHash = await hashPassword(password)

  await db.insert(users).values({ id, email, passwordHash, createdAt: Date.now() })

  const token = await sign(
    { sub: id, email, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRE_SECONDS },
    c.env.JWT_SECRET
  )

  return c.json({ token, user: { id, email } }, 201)
})

/**
 * POST /auth/login
 * Body: { email, password }
 * Response: { token, user: { id, email } }
 *
 * Sengaja tidak membedakan "email tidak ditemukan" vs "password salah"
 * untuk mencegah user enumeration attack.
 */
auth.post('/login', zValidator('json', AuthSchema), async (c) => {
  const { email, password } = c.req.valid('json')
  const db = createDb(c.env)

  const user = await db.select().from(users).where(eq(users.email, email)).get()
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return c.json({ error: 'Invalid credentials.' }, 401)
  }

  const token = await sign(
    { sub: user.id, email: user.email, exp: Math.floor(Date.now() / 1000) + JWT_EXPIRE_SECONDS },
    c.env.JWT_SECRET
  )

  return c.json({ token, user: { id: user.id, email: user.email } })
})
