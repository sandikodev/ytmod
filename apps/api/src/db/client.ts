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
 * Set di .dev.vars:
 *   TURSO_URL=libsql://ytmod-prev-sandikodev.aws-ap-northeast-1.turso.io
 *   TURSO_AUTH_TOKEN=<preview token>
 *
 * Env vars production (wrangler secret):
 *   TURSO_URL=libsql://ytmod-sandikodev.aws-us-east-1.turso.io
 *   TURSO_AUTH_TOKEN=<production token>
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
