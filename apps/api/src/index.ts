import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { comments } from './routes/comments'

type Bindings = {
  YOUTUBE_API_KEY: string
}

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', cors({
  origin: ['https://sandikodev.github.io', 'https://ytmod-api.konxcid.workers.dev', 'http://localhost:5173', 'http://localhost:4173'],
  allowMethods: ['GET', 'OPTIONS'],
}))

app.route('/comments', comments)

app.get('/', (c) => c.json({ name: 'ytmod-api', version: '0.0.1' }))

export default app
