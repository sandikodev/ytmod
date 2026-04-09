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
import { z } from 'zod'

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

  const normalized = addMissingScheme(trimmed)

  // Coba parse sebagai URL
  try {
    const url = new URL(normalized)
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

function addMissingScheme(value: string): string {
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(value)) return value
  if (value.startsWith('//')) return `https:${value}`
  if (
    value.startsWith('youtube.com') ||
    value.startsWith('www.youtube.com') ||
    value.startsWith('m.youtube.com')
  ) {
    return `https://${value}`
  }
  if (value.startsWith('youtu.be')) return `https://${value}`
  return value
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

  // Ambil daftar track yang tersedia lalu pilih prioritas
  const tracks = await fetchTrackList(videoId)
  const attempts = pickTracks(tracks, lang)

  for (const attempt of attempts) {
    const url = `https://www.youtube.com/api/timedtext?v=${videoId}&lang=${attempt.lang}&fmt=json3${attempt.auto ? '&kind=asr' : ''}${attempt.vssId ? `&vss_id=${encodeURIComponent(attempt.vssId)}` : ''}`
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.youtube.com/',
      },
    })

    if (!res.ok) {
      logDebug(`timedtext ${url} -> ${res.status}`)
      continue
    }

    const text = await res.text()
    if (!text || text === '{}' || text.length < 10) {
      logDebug(`timedtext ${url} empty`)
      continue
    }

    let data: { events?: TimedtextEvent[] }
    try {
      data = JSON.parse(text)
    } catch (err) {
      logDebug(`timedtext ${url} JSON parse error: ${(err as Error).message}`)
      continue
    }

    if (!data.events?.length) {
      logDebug(`timedtext ${url} no events`)
      continue
    }

    // Gunakan parseTimedtext() untuk konversi events → segments yang bersih
    const segments = parseTimedtext(data.events)

    if (!segments.length) {
      logDebug(`timedtext ${url} segments empty after parse`)
      continue
    }

    const response: TranscriptResponse = {
      videoId,
      videoTitle,
      language: attempt.lang,
      autoGenerated: attempt.auto,
      segments,
    }

    return c.json(response)
  }

  return c.json(
    {
      error:
        'Transcript not available. YouTube may have no captions for this video or blocked access. Try another language or video.',
    },
    404
  )
})

// ── Helpers ──────────────────────────────────────────────────────────────────

type Track = { lang: string; kind: 'manual' | 'asr'; vssId?: string }
type CaptionTrack = {
  baseUrl: string
  languageCode: string
  name?: { simpleText?: string; runs?: Array<{ text: string }> }
  kind?: string
}

/** Log untuk debug dev; no-op di prod */
function logDebug(msg: string) {
  // Cloudflare Workers: console.log aman; bisa di-mute di prod jika perlu
  console.log(`[transcript] ${msg}`)
}

/**
 * Fetch caption tracks via youtubei/player API (innertube).
 * Ini lebih andal dibanding hit langsung timedtext tanpa signature.
 */
async function fetchCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  // 1) Fetch watch HTML untuk ambil INNERTUBE_API_KEY & CLIENT_VERSION
  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
    Referer: 'https://www.youtube.com/',
  }

  const watchRes = await fetch(`https://www.youtube.com/watch?v=${videoId}`, { headers })
  if (!watchRes.ok) {
    logDebug(`watch page status ${watchRes.status}`)
    return []
  }
  const html = await watchRes.text()

  const apiKey = /"INNERTUBE_API_KEY":"([^"]+)"/.exec(html)?.[1]
  const clientVersion =
    /"INNERTUBE_CONTEXT_CLIENT_VERSION":"([^"]+)"/.exec(html)?.[1] ??
    /"clientVersion":"([^"]+)"/.exec(html)?.[1]
  const clientName =
    /"INNERTUBE_CLIENT_NAME":"([^"]+)"/.exec(html)?.[1] ??
    /"clientName":"([^"]+)"/.exec(html)?.[1] ??
    'WEB'

  if (!apiKey || !clientVersion) {
    logDebug('failed to extract innertube key/clientVersion')
    return []
  }

  // 2) Call youtubei player endpoint
  const playerRes = await fetch(`https://www.youtube.com/youtubei/v1/player?key=${apiKey}`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      context: {
        client: {
          hl: 'en',
          gl: 'US',
          clientName,
          clientVersion,
        },
      },
      videoId,
    }),
  })

  if (!playerRes.ok) {
    logDebug(`player api status ${playerRes.status}`)
    return []
  }

  let data: unknown
  try {
    data = await playerRes.json()
  } catch (err) {
    logDebug(`player api json error ${(err as Error).message}`)
    return []
  }

  const captions = (
    data as Record<string, unknown> & {
      captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: unknown[] } }
    }
  )?.captions?.playerCaptionsTracklistRenderer?.captionTracks
  if (!Array.isArray(captions)) {
    logDebug('player api no captionTracks')
    return []
  }

  // Validate minimal structure
  const TrackSchema = z.object({
    baseUrl: z.string(),
    languageCode: z.string(),
    kind: z.string().optional(),
    name: z
      .object({
        simpleText: z.string().optional(),
        runs: z.array(z.object({ text: z.string() })).optional(),
      })
      .optional(),
  })

  const tracks: CaptionTrack[] = []
  for (const c of captions) {
    const parsed = TrackSchema.safeParse(c)
    if (parsed.success) tracks.push(parsed.data)
  }

  logDebug(`player api tracks ${tracks.length}`)
  return tracks
}

/** Ambil daftar track caption yang tersedia via type=list */
async function fetchTrackList(videoId: string): Promise<Track[]> {
  // Coba innertube dulu
  const ytTracks = await fetchCaptionTracks(videoId)
  if (ytTracks.length) {
    return ytTracks.map((t) => ({
      lang: t.languageCode,
      kind: t.kind === 'asr' ? 'asr' : 'manual',
      vssId: undefined, // baseUrl sudah lengkap; vssId tidak diperlukan
    }))
  }

  try {
    const url = `https://www.youtube.com/api/timedtext?type=list&v=${videoId}`
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        Referer: 'https://www.youtube.com/',
      },
    })
    if (!res.ok) {
      logDebug(`tracklist ${url} -> ${res.status}`)
      return []
    }
    const text = await res.text()
    if (!text || text.length < 10) return []

    // Response adalah XML; parse minimal dengan regex sederhana (aman untuk struktur kecil)
    const tracks: Track[] = []
    const regex = /<track([^>]*)>/g
    let match: RegExpExecArray | null
    while ((match = regex.exec(text))) {
      const attrs = match[1]
      const lang = /lang_code="([^"]+)"/.exec(attrs)?.[1]
      if (!lang) continue
      const kind = /kind="([^"]+)"/.exec(attrs)?.[1] === 'asr' ? 'asr' : 'manual'
      const vssId = /vss_id="([^"]+)"/.exec(attrs)?.[1]
      tracks.push({ lang, kind, vssId })
    }
    // Jika kind tidak ada, anggap manual
    if (tracks.length === 0) {
      const fallback = [...text.matchAll(/<track[^>]*lang_code="([^"]+)"[^>]*>/g)]
      fallback.forEach((m) => tracks.push({ lang: m[1], kind: 'manual' }))
    }
    logDebug(`tracklist found ${tracks.length} tracks`)
    return tracks
  } catch (err) {
    logDebug(`tracklist error: ${(err as Error).message}`)
    return []
  }
}

/**
 * Susun urutan percobaan berdasar tracklist yang tersedia.
 * Prioritas: bahasa yang diminta (manual lalu asr) → en (manual lalu asr).
 */
function pickTracks(
  tracks: Track[],
  requestedLang: string
): Array<{ lang: string; auto: boolean; vssId?: string }> {
  const order: Array<{ lang: string; auto: boolean; vssId?: string }> = []

  const add = (track: Track) => {
    order.push({ lang: track.lang, auto: track.kind === 'asr', vssId: track.vssId })
  }

  const findTrack = (lang: string, kind: 'manual' | 'asr') =>
    tracks.find((t) => t.lang === lang && t.kind === kind)

  const reqManual = findTrack(requestedLang, 'manual')
  if (reqManual) add(reqManual)
  const reqAsr = findTrack(requestedLang, 'asr')
  if (reqAsr) add(reqAsr)
  const enManual = findTrack('en', 'manual')
  if (enManual) add(enManual)
  const enAsr = findTrack('en', 'asr')
  if (enAsr) add(enAsr)

  // Fallback terakhir: jika order kosong, gunakan pola lama
  if (!order.length) {
    order.push(
      { lang: requestedLang, auto: false },
      { lang: 'en', auto: false },
      { lang: requestedLang, auto: true },
      { lang: 'en', auto: true }
    )
  }

  return order
}
