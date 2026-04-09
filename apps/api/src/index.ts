import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { comments } from './routes/comments'
import { transcript } from './routes/transcript'
import { clipper } from './routes/clipper'
import { auth } from './routes/auth'
import { authMiddleware } from './middleware/auth'

type Bindings = {
  YOUTUBE_API_KEY: string
  // Comma-separated allowed origins, e.g. "https://yourusername.github.io,http://localhost:5173"
  CORS_ORIGINS: string
  // Base URL of the Clipper Engine (clipper-server binary).
  // Set via wrangler secret. Lihat .env.example untuk contoh per environment.
  CLIPPER_ENGINE_URL: string
  // Turso database credentials
  TURSO_URL: string
  TURSO_AUTH_TOKEN: string
  // JWT signing secret — generate: openssl rand -base64 32
  JWT_SECRET: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Dynamic CORS — origins dikonfigurasi via env var, tidak hardcoded
app.use('*', async (c, next) => {
  const origins = c.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? []
  return cors({ origin: origins, allowMethods: ['GET', 'POST', 'OPTIONS'] })(c, next)
})

// ── Public routes — tidak butuh auth ──────────────────────────────────────────
app.route('/auth', auth)
app.route('/comments', comments)

// ── Protected routes — butuh JWT Bearer token ─────────────────────────────────
app.use('/transcript/*', authMiddleware())
app.use('/clipper/*', authMiddleware())
app.route('/transcript', transcript)
app.route('/clipper', clipper)

app.get('/', (c) => c.json({ name: 'ytmod-api', version: '0.0.1' }))

export default app
