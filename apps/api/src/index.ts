import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { comments } from './routes/comments'
import { transcript } from './routes/transcript'
import { clipper } from './routes/clipper'

type Bindings = {
  YOUTUBE_API_KEY: string
  // Comma-separated allowed origins, e.g. "https://sandikodev.github.io,http://localhost:5173"
  CORS_ORIGINS: string
  // Base URL of the Clipper Engine (clipper-server binary).
  // Set via wrangler secret or .dev.vars. See .env.example for details.
  CLIPPER_ENGINE_URL: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Dynamic CORS — origins configured via Cloudflare Worker env var, not hardcoded
app.use('*', async (c, next) => {
  const origins = c.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? []
  return cors({ origin: origins, allowMethods: ['GET', 'POST', 'OPTIONS'] })(c, next)
})

app.route('/comments', comments)
app.route('/transcript', transcript)
// /clipper proxies to the external Clipper Engine (Rust binary)
app.route('/clipper', clipper)

app.get('/', (c) => c.json({ name: 'ytmod-api', version: '0.0.1' }))

export default app
