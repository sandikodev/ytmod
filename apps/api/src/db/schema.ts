/**
 * Database schema — ytmod
 *
 * Didefinisikan dengan Drizzle ORM untuk Turso (libsql/SQLite).
 * Jalankan migration: pnpm exec drizzle-kit push
 */

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

/**
 * Tabel users — menyimpan akun pengguna ytmod.
 * Password disimpan sebagai bcrypt hash, tidak pernah plaintext.
 */
export const users = sqliteTable('users', {
  id: text('id').primaryKey(), // nanoid — lebih pendek dari UUID
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  createdAt: integer('created_at').notNull(), // Unix timestamp (ms)
})
