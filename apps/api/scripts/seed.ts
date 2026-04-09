/**
 * Simple seed script for ytmod users table.
 *
 * Usage:
 *   pnpm db:seed
 *
 * Env (optional):
 *   TURSO_URL, TURSO_AUTH_TOKEN  → target DB (defaults to file:./dev.db)
 *   SEED_EMAIL, SEED_PASSWORD    → credentials to insert (defaults below)
 */
import crypto from 'node:crypto'
import { createClient } from '@libsql/client'
import { drizzle } from 'drizzle-orm/libsql'
import { eq } from 'drizzle-orm'
import * as schema from '../src/db/schema'

const TURSO_URL = process.env.TURSO_URL ?? 'file:./dev.db'
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN

const SEED_EMAIL = process.env.SEED_EMAIL ?? 'demo@example.com'
const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'password123'

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16)
  const hash = crypto.pbkdf2Sync(password, salt, 100_000, 32, 'sha256')
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

async function main() {
  const client = createClient({ url: TURSO_URL, authToken: TURSO_AUTH_TOKEN })
  const db = drizzle(client, { schema })

  const existing = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, SEED_EMAIL))
    .get()

  if (existing) {
    console.log(`User ${SEED_EMAIL} already exists; skipping.`)
    return
  }

  await db.insert(schema.users).values({
    id: crypto.randomUUID(),
    email: SEED_EMAIL,
    passwordHash: hashPassword(SEED_PASSWORD),
    createdAt: Date.now(),
  })

  console.log(`Seeded user ${SEED_EMAIL} (password: ${SEED_PASSWORD}) into ${TURSO_URL}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
