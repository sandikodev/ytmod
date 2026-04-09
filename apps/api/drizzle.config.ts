import { defineConfig } from 'drizzle-kit'

/**
 * Drizzle Kit config
 *
 * Untuk push migration ke Turso:
 *   pnpm exec drizzle-kit push
 *
 * Environment yang digunakan ditentukan oleh env vars:
 *   TURSO_URL + TURSO_AUTH_TOKEN  → production / preview (Turso)
 *   DATABASE_URL tidak di-set     → development (SQLite file lokal)
 */
export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url: process.env.TURSO_URL ?? 'file:./dev.db',
    authToken: process.env.TURSO_AUTH_TOKEN,
  },
})
