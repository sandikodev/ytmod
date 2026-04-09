/**
 * Clipper proxy route — /clipper
 *
 * Meneruskan request dari frontend ke Clipper Engine (clipper-server, Rust binary).
 * ytmod-api bertindak sebagai proxy agar:
 *   1. Frontend tidak perlu tahu URL engine secara langsung
 *   2. CORS ditangani di satu tempat (Worker)
 *   3. Engine URL bisa diganti per-environment tanpa rebuild frontend
 *
 * Engine URL dikonfigurasi via env var CLIPPER_ENGINE_URL.
 * Contoh nilai per environment:
 *
 *   # Local development
 *   CLIPPER_ENGINE_URL=http://localhost:8080
 *
 *   # Preview — expose local port via ngrok
 *   CLIPPER_ENGINE_URL=https://abc123.ngrok-free.app
 *
 *   # Preview — expose via Cloudflare Tunnel
 *   CLIPPER_ENGINE_URL=https://clipper.your-tunnel.cfargotunnel.com
 *
 *   # Production — VPS/Docker behind reverse proxy
 *   CLIPPER_ENGINE_URL=https://clipper-api.yourdomain.com/v1
 *   CLIPPER_ENGINE_URL=https://api.yourdomain.com/clipper
 *
 *   # Production — Serverless/PaaS
 *   CLIPPER_ENGINE_URL=https://your-app.vercel.app/api
 *   CLIPPER_ENGINE_URL=https://your-worker.your-subdomain.workers.dev
 *
 * Endpoints yang di-proxy:
 *   POST /clipper/analyze → engine POST /analyze
 *   POST /clipper/clip    → engine POST /clip
 */

import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  ClipperAnalyzeRequestSchema,
  ClipperClipRequestSchema,
  type ClipperAnalyzeResponse,
  type ClipperClipResponse,
} from '@ytmod/shared'

type Bindings = {
  CLIPPER_ENGINE_URL: string
}

export const clipper = new Hono<{ Bindings: Bindings }>()

/** Resolve engine base URL from env, strip trailing slash */
function engineUrl(env: Bindings): string {
  return (env.CLIPPER_ENGINE_URL ?? 'http://localhost:8080').replace(/\/$/, '')
}

/**
 * POST /clipper/analyze
 * Body: { url: string, gemini_api_key: string }
 * Response: { config: ClipConfig } — AI-suggested clips
 */
clipper.post('/analyze', zValidator('json', ClipperAnalyzeRequestSchema), async (c) => {
  const body = c.req.valid('json')

  const res = await fetch(`${engineUrl(c.env)}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as ClipperAnalyzeResponse | { error: string }
  return c.json(data, res.status as 200 | 400 | 502)
})

/**
 * POST /clipper/clip
 * Body: { config: ClipConfig } — clips to process
 * Response: { results: Array<{ output: string, success: boolean }> }
 */
clipper.post('/clip', zValidator('json', ClipperClipRequestSchema), async (c) => {
  const body = c.req.valid('json')

  const res = await fetch(`${engineUrl(c.env)}/clip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = (await res.json()) as ClipperClipResponse | { error: string }
  return c.json(data, res.status as 200 | 400 | 502)
})
