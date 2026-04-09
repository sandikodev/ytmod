/**
 * Database client — Turso (libsql)
 *
 * Singleton client yang dibuat per-request di Cloudflare Workers.
 * Credentials diambil dari env var, tidak pernah hardcoded.
 *
 * Env vars yang dibutuhkan:
 *   TURSO_URL        — libsql://your-db.turso.io
 *   TURSO_AUTH_TOKEN — token dari Turso dashboard
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
    authToken: env.TURSO_AUTH_TOKEN,
  })
  return drizzle(client, { schema })
}
