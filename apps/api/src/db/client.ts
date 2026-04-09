/**
 * Database client — Turso (libsql)
 *
 * Selalu pakai @libsql/client/web karena:
 *   1. Cloudflare Workers hanya support Web APIs (tidak ada Node fs/path)
 *   2. @libsql/client/web support libsql://, wss://, https://, http://
 *
 * Untuk development lokal, gunakan Turso preview database
 * (bukan file: URL — tidak didukung oleh web client).
 *
 * Set di .dev.vars (tidak di-commit):
 *   TURSO_URL=libsql://your-preview-db.turso.io
 *   TURSO_AUTH_TOKEN=<preview token dari Turso dashboard>
 *
 * Env vars production (wrangler secret):
 *   TURSO_URL=libsql://your-production-db.turso.io
 *   TURSO_AUTH_TOKEN=<production token dari Turso dashboard>
 */

import { createClient } from '@libsql/client/web'
import { drizzle } from 'drizzle-orm/libsql'
import * as schema from './schema'

export type DbBindings = {
  TURSO_URL: string
  TURSO_AUTH_TOKEN: string
}

/** Buat Drizzle client dari env bindings Cloudflare Worker */
export function createDb(env: DbBindings) {
  const client = createClient({
    url: env.TURSO_URL,
    authToken: env.TURSO_AUTH_TOKEN || undefined,
  })
  return drizzle(client, { schema })
}
