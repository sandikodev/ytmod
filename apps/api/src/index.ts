import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { comments } from './routes/comments'
import { transcript } from './routes/transcript'

type Bindings = {
  YOUTUBE_API_KEY: string
  CORS_ORIGINS: string // comma-separated, e.g. "https://example.com,http://localhost:5173"
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', async (c, next) => {
  const origins = c.env.CORS_ORIGINS?.split(',').map((s) => s.trim()) ?? []
  return cors({ origin: origins, allowMethods: ['GET', 'OPTIONS'] })(c, next)
})

app.route('/comments', comments)
app.route('/transcript', transcript)

app.get('/', (c) => c.json({ name: 'ytmod-api', version: '0.0.1' }))

export default app
