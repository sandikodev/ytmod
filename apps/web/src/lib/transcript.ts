import type { TranscriptSegment } from '@ytmod/shared'

/**
 * Ekstrak 11-char YouTube video ID dari berbagai format input.
 * Mendukung: ID langsung, youtube.com/watch?v=, youtu.be/, embed/, m.youtube.com/watch?v=
 * Return null jika tidak valid.
 */
export function extractVideoId(input: string): string | null {
  const trimmed = input.trim()
  if (!trimmed) return null

  // Coba parse sebagai URL
  try {
    const url = new URL(trimmed)
    const host = url.hostname.replace(/^www\./, '')

    if (host === 'youtube.com' || host === 'm.youtube.com') {
      // youtube.com/watch?v=ID atau m.youtube.com/watch?v=ID
      const v = url.searchParams.get('v')
      if (v) return isValidId(v) ? v : null

      // youtube.com/embed/ID
      const embedMatch = url.pathname.match(/^\/embed\/([a-zA-Z0-9_-]{11})/)
      if (embedMatch) return embedMatch[1]
    }

    if (host === 'youtu.be') {
      // youtu.be/ID
      const id = url.pathname.slice(1).split('?')[0]
      return isValidId(id) ? id : null
    }
  } catch {
    // Bukan URL — coba sebagai ID langsung
  }

  // ID langsung 11 karakter
  return isValidId(trimmed) ? trimmed : null
}

function isValidId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{11}$/.test(id)
}

/**
 * Format transcript sebagai plain text — setiap segment.text dipisahkan newline.
 */
export function formatTxt(segments: TranscriptSegment[]): string {
  return segments.map((s) => s.text).join('\n')
}

/**
 * Konversi detik ke format SRT timestamp: "HH:MM:SS,mmm"
 */
export function formatSrtTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  const ms = Math.floor((seconds % 1) * 1000)
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`
}

/**
 * Format transcript sebagai SRT — index (mulai 1), timestamp range, teks, baris kosong separator.
 */
export function formatSrt(segments: TranscriptSegment[]): string {
  return segments
    .map((seg, i) => {
      const start = formatSrtTimestamp(seg.start)
      const end = formatSrtTimestamp(seg.start + seg.duration)
      return `${i + 1}\n${start} --> ${end}\n${seg.text}`
    })
    .join('\n\n')
}
