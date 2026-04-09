/**
 * Transcript route — GET /transcript
 *
 * Mengambil subtitle/caption dari YouTube via endpoint timedtext tidak resmi.
 * YouTube tidak menyediakan official API untuk transcript, sehingga kita fetch
 * langsung dari https://www.youtube.com/api/timedtext yang tersedia publik.
 *
 * Fallback order: lang → 'en' → auto-generated lang → auto-generated 'en'
 * Ini memaksimalkan kemungkinan mendapat transcript meski bahasa yang diminta
 * tidak tersedia dalam versi manual.
 */
import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import {
  TranscriptQuerySchema,
  type TranscriptResponse,
  type TranscriptSegment,
} from '@ytmod/shared'

type Bindings = {
  YOUTUBE_API_KEY: string // YouTube Data API v3 key — digunakan untuk fetch video title (non-fatal)
}

export const transcript = new Hono<{ Bindings: Bindings }>()

// In-memory rate limit store: IP → { count, reset timestamp }
// Reset setiap 60 detik, max 20 request per IP per window
const rateMap = new Map<string, { count: number; reset: number }>()

/**
 * Rate limit middleware — 20 req/min per IP.
 * Diterapkan sebelum semua route handler untuk melindungi dari abuse.
 * Menggunakan CF-Connecting-IP (tersedia di Cloudflare Workers) sebagai identifier.
 */
transcript.use('*', async (c, next) => {
  const ip = c.req.header('CF-Connecting-IP') ?? c.req.header('X-Forwarded-For') ?? 'unknown'
  const now = Date.now()
  const entry = rateMap.get(ip)
  if (!entry || now > entry.reset) {
    rateMap.set(ip, { count: 1, reset: now + 60_000 })
  } else if (entry.count >= 20) {
    return c.json({ error: 'Rate limit exceeded. Try again in a minute.' }, 429)
  } else {
    entry.count++
  }
  return next()
})

/**
 * Ekstrak 11-char YouTube video ID dari berbagai format input.
 * Mendukung: ID langsung, youtube.com/watch?v=, youtu.be/, embed/, m.youtube.com/watch?v=
 * Return null jika format tidak dikenali atau ID tidak valid.
 */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Coba parse sebagai URL
  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const v = url.searchParams.get('v')
      if (v) return validateVideoId(v) ? v : null

      const embedMatch = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embedMatch) return embedMatch[1]
    }

    if (host === 'youtu.be') {
      const id = url.pathname.slice(1).split('?')[0]
      return validateVideoId(id) ? id : null
    }
  } catch {
    // Bukan URL — coba sebagai ID langsung
  }

  // ID langsung 11 karakter
  return validateVideoId(trimmed) ? trimmed : null
}

/**
 * Validasi bahwa string adalah YouTube video ID yang valid.
 * Format: tepat 11 karakter, hanya [a-zA-Z0-9_-].
 */
export function validateVideoId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

/**
 * Struktur satu event dari response JSON timedtext YouTube (fmt=json3).
 * Event tanpa `segs` adalah marker waktu — difilter saat parsing.
 */
export type TimedtextEvent = {
  tStartMs: number // waktu mulai dalam milidetik
  dDurationMs: number // durasi dalam milidetik
  segs?: Array<{ utf8: string }> // potongan teks; tidak ada = bukan segment teks
}

/**
 * Konversi array timedtext events menjadi TranscriptSegment yang bersih.
 * - Filter events tanpa `segs`
 * - Gabungkan semua utf8 dalam satu event
 * - Strip HTML entities dan tags dari teks
 * - Filter segment kosong setelah stripping
 * - Konversi waktu dari milidetik ke detik
 */
export function parseTimedtext(events: TimedtextEvent[]): TranscriptSegment[] {
  return events
    .filter((e) => e.segs)
    .map((e) => {
      const raw = e.segs!.map((s) => s.utf8).join('')
      const text = stripHtml(raw).trim()
      return {
        text,
        start: e.tStartMs / 1000,
        duration: e.dDurationMs / 1000,
      }
    })
    .filter((s) => s.text)
}

/**
 * Strip HTML entities dan tags dari teks timedtext.
 * YouTube kadang menyertakan markup seperti <b>, <i>, atau entities seperti &amp;.
 */
function stripHtml(input: string): string {
  return input
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/<[^>]+>/g, '')
}

transcript.get('/', zValidator('query', TranscriptQuerySchema), async (c) => {
  const { videoId: rawVideoId, lang } = c.req.valid('query')
  const apiKey = c.env.YOUTUBE_API_KEY

  // Ekstrak video ID dari URL atau ID langsung, lalu validasi format
  const videoId = extractVideoId(rawVideoId)

  // Tolak jika bukan 11-char ID yang valid setelah ekstraksi
  if (!videoId) {
    return c.json({ error: 'Invalid videoId format' }, 400)
  }

  // Fetch video title via YouTube Data API — non-fatal.
  // Gagal tidak memblokir response; transcript tetap dikembalikan tanpa title.
  let videoTitle: string | undefined
  try {
    const vRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${apiKey}`
    )
    if (vRes.ok) {
      const vData = (await vRes.json()) as { items: Array<{ snippet: { title: string } }> }
      videoTitle = vData.items[0]?.snippet?.title
    }
  } catch {
    /* swallow */
  }

  // Try requested lang, then 'en' fallback, then auto-generated
  const attempts = [
    { lang, auto: false },
    { lang: 'en', auto: false },
    { lang, auto: true },
    { lang: 'en', auto: true },
  ]

  for (const attempt of attempts) {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${attempt.lang}&fmt=json3${attempt.auto ? '&kind=asr' : ''}`
    const res = await fetch(url)

    if (!res.ok) continue

    const text = await res.text()
    if (!text || text === '{}' || text.length < 10) continue

    let data: { events?: TimedtextEvent[] }
    try {
      data = JSON.parse(text)
    } catch {
      continue
    }

    if (!data.events?.length) continue

    // Gunakan parseTimedtext() untuk konversi events → segments yang bersih
    const segments = parseTimedtext(data.events)

    if (!segments.length) continue

    const response: TranscriptResponse = {
      videoId,
      videoTitle,
      language: attempt.lang,
      autoGenerated: attempt.auto,
      segments,
    }

    return c.json(response)
  }

  return c.json({ error: 'Transcript not available for this video.' }, 404)
})
