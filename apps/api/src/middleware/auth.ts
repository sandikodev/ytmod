/**
 * Auth middleware — validasi JWT untuk route premium
 *
 * Digunakan di route /transcript dan /clipper/*.
 * Route publik (/comments, /auth/*) tidak menggunakan middleware ini.
 *
 * Header yang diharapkan: Authorization: Bearer <token>
 *
 * JWT_SECRET dikonfigurasi via env var — generate dengan:
 *   openssl rand -base64 32
 */

import { jwt } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'

type Bindings = { JWT_SECRET: string }

/**
 * Middleware factory — return middleware yang validasi JWT.
 * Hono jwt middleware otomatis return 401 jika token invalid/expired.
 */
export function authMiddleware(): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    // Ambil JWT_SECRET dari env saat runtime (bukan saat module load)
    return jwt({ secret: c.env.JWT_SECRET })(c, next)
  }
}
