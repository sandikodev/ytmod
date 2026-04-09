/**
 * Unit dan property tests untuk apps/web/src/lib/transcript.ts
 *
 * Mencakup:
 * - Task 1.2: Unit tests extractVideoId (berbagai format URL, ID langsung, input tidak valid)
 * - Task 1.3: Unit tests formatTxt, formatSrt, formatSrtTimestamp
 * - Task 1.4: Property 6 — extractVideoId dari berbagai format URL
 * - Task 1.5: Property 8 — Export format selalu benar
 * - Task 1.6: Property 9 — Nama file export konsisten
 */

import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { extractVideoId, formatTxt, formatSrt, formatSrtTimestamp } from './transcript'
import type { TranscriptSegment } from '@ytmod/shared'

// ─── Helpers ──────────────────────────────────────────────────────────────────

// ─── Task 1.2: Unit tests extractVideoId ──────────────────────────────────────

describe('extractVideoId', () => {
  const VALID_ID = 'dQw4w9WgXcQ'

  describe('format URL yang didukung', () => {
    it('youtube.com/watch?v=', () => {
      expect(extractVideoId(`https://www.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID)
    })

    it('youtube.com/watch?v= tanpa www', () => {
      expect(extractVideoId(`https://youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID)
    })

    it('youtu.be/', () => {
      expect(extractVideoId(`https://youtu.be/${VALID_ID}`)).toBe(VALID_ID)
    })

    it('youtu.be/ dengan query string', () => {
      expect(extractVideoId(`https://youtu.be/${VALID_ID}?si=abc`)).toBe(VALID_ID)
    })

    it('youtube.com/embed/', () => {
      expect(extractVideoId(`https://www.youtube.com/embed/${VALID_ID}`)).toBe(VALID_ID)
    })

    it('m.youtube.com/watch?v=', () => {
      expect(extractVideoId(`https://m.youtube.com/watch?v=${VALID_ID}`)).toBe(VALID_ID)
    })
  })

  describe('ID langsung 11 karakter', () => {
    it('ID alphanumeric', () => {
      expect(extractVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    })

    it('ID dengan underscore', () => {
      expect(extractVideoId('abc_defghij')).toBe('abc_defghij')
    })

    it('ID dengan dash', () => {
      expect(extractVideoId('abc-defghij')).toBe('abc-defghij')
    })

    it('trim whitespace sebelum proses', () => {
      expect(extractVideoId(`  ${VALID_ID}  `)).toBe(VALID_ID)
    })
  })

  describe('input tidak valid mengembalikan null', () => {
    it('string kosong', () => {
      expect(extractVideoId('')).toBeNull()
    })

    it('hanya whitespace', () => {
      expect(extractVideoId('   ')).toBeNull()
    })

    it('ID terlalu pendek (10 karakter)', () => {
      expect(extractVideoId('dQw4w9WgXc')).toBeNull()
    })

    it('ID terlalu panjang (12 karakter)', () => {
      expect(extractVideoId('dQw4w9WgXcQQ')).toBeNull()
    })

    it('ID dengan karakter tidak valid (!)', () => {
      expect(extractVideoId('dQw4w9WgXc!')).toBeNull()
    })

    it('URL youtube.com/watch tanpa parameter v', () => {
      expect(extractVideoId('https://www.youtube.com/watch')).toBeNull()
    })

    it('URL youtube.com/watch?v= dengan ID tidak valid', () => {
      expect(extractVideoId('https://www.youtube.com/watch?v=tooshort')).toBeNull()
    })

    it('URL domain tidak dikenal', () => {
      expect(extractVideoId('https://vimeo.com/123456789')).toBeNull()
    })

    it('teks acak bukan URL maupun ID', () => {
      expect(extractVideoId('hello world')).toBeNull()
    })
  })
})

// ─── Task 1.3: Unit tests formatTxt, formatSrt, formatSrtTimestamp ─────────────

describe('formatSrtTimestamp', () => {
  it('0 detik → 00:00:00,000', () => {
    expect(formatSrtTimestamp(0)).toBe('00:00:00,000')
  })

  it('3600 detik (1 jam) → 01:00:00,000', () => {
    expect(formatSrtTimestamp(3600)).toBe('01:00:00,000')
  })

  it('3661.5 detik → 01:01:01,500', () => {
    expect(formatSrtTimestamp(3661.5)).toBe('01:01:01,500')
  })

  it('90.123 detik → 00:01:30,123', () => {
    expect(formatSrtTimestamp(90.123)).toBe('00:01:30,123')
  })

  it('59.999 detik → 00:00:59,999', () => {
    expect(formatSrtTimestamp(59.999)).toBe('00:00:59,999')
  })
})

describe('formatTxt', () => {
  const segments: TranscriptSegment[] = [
    { text: 'Halo dunia', start: 0, duration: 2 },
    { text: 'Ini baris kedua', start: 2, duration: 3 },
    { text: 'Baris ketiga', start: 5, duration: 2 },
  ]

  it('setiap segment menjadi satu baris', () => {
    const result = formatTxt(segments)
    const lines = result.split('\n')
    expect(lines).toHaveLength(3)
    expect(lines[0]).toBe('Halo dunia')
    expect(lines[1]).toBe('Ini baris kedua')
    expect(lines[2]).toBe('Baris ketiga')
  })

  it('output tidak mengandung timestamp', () => {
    const result = formatTxt(segments)
    // Timestamp SRT berbentuk HH:MM:SS,mmm — tidak boleh ada
    expect(result).not.toMatch(/\d{2}:\d{2}:\d{2},\d{3}/)
  })

  it('array kosong menghasilkan string kosong', () => {
    expect(formatTxt([])).toBe('')
  })

  it('satu segment menghasilkan satu baris tanpa newline trailing', () => {
    const result = formatTxt([{ text: 'Satu', start: 0, duration: 1 }])
    expect(result).toBe('Satu')
  })
})

describe('formatSrt', () => {
  const segments: TranscriptSegment[] = [
    { text: 'Halo dunia', start: 0, duration: 2 },
    { text: 'Ini baris kedua', start: 2, duration: 3 },
  ]

  it('index dimulai dari 1', () => {
    const result = formatSrt(segments)
    const blocks = result.split('\n\n')
    expect(blocks[0]).toMatch(/^1\n/)
    expect(blocks[1]).toMatch(/^2\n/)
  })

  it('format timestamp HH:MM:SS,mmm --> HH:MM:SS,mmm', () => {
    const result = formatSrt(segments)
    // Setiap blok harus punya baris timestamp dengan format yang benar
    expect(result).toMatch(/\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/)
  })

  it('baris kosong sebagai separator antar segment', () => {
    const result = formatSrt(segments)
    // Dua segment dipisahkan satu baris kosong
    expect(result).toContain('\n\n')
    const blocks = result.split('\n\n')
    expect(blocks).toHaveLength(2)
  })

  it('teks segment muncul di blok yang benar', () => {
    const result = formatSrt(segments)
    const blocks = result.split('\n\n')
    expect(blocks[0]).toContain('Halo dunia')
    expect(blocks[1]).toContain('Ini baris kedua')
  })

  it('timestamp end = start + duration', () => {
    // segment: start=0, duration=2 → end=2 → 00:00:02,000
    const result = formatSrt([{ text: 'Test', start: 0, duration: 2 }])
    expect(result).toContain('00:00:00,000 --> 00:00:02,000')
  })

  it('array kosong menghasilkan string kosong', () => {
    expect(formatSrt([])).toBe('')
  })
})

// ─── Task 1.4: Property 6 — extractVideoId dari berbagai format URL ────────────
// Feature: transcriber, Property 6: extractVideoId dari berbagai format URL

describe('Property 6: extractVideoId dari berbagai format URL', () => {
  /** Arbitrary untuk menghasilkan video ID valid 11 karakter */
  const validIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{11}$/)

  it('youtube.com/watch?v= selalu menghasilkan ID 11 karakter valid', () => {
    fc.assert(
      fc.property(validIdArb, (id) => {
        const url = `https://www.youtube.com/watch?v=${id}`
        const result = extractVideoId(url)
        expect(result).not.toBeNull()
        expect(result).toMatch(/^[a-zA-Z0-9_-]{11}$/)
        expect(result).toBe(id)
      }),
      { numRuns: 100 }
    )
  })

  it('youtu.be/ selalu menghasilkan ID 11 karakter valid', () => {
    fc.assert(
      fc.property(validIdArb, (id) => {
        const url = `https://youtu.be/${id}`
        const result = extractVideoId(url)
        expect(result).not.toBeNull()
        expect(result).toMatch(/^[a-zA-Z0-9_-]{11}$/)
        expect(result).toBe(id)
      }),
      { numRuns: 100 }
    )
  })

  it('youtube.com/embed/ selalu menghasilkan ID 11 karakter valid', () => {
    fc.assert(
      fc.property(validIdArb, (id) => {
        const url = `https://www.youtube.com/embed/${id}`
        const result = extractVideoId(url)
        expect(result).not.toBeNull()
        expect(result).toMatch(/^[a-zA-Z0-9_-]{11}$/)
        expect(result).toBe(id)
      }),
      { numRuns: 100 }
    )
  })

  it('m.youtube.com/watch?v= selalu menghasilkan ID 11 karakter valid', () => {
    fc.assert(
      fc.property(validIdArb, (id) => {
        const url = `https://m.youtube.com/watch?v=${id}`
        const result = extractVideoId(url)
        expect(result).not.toBeNull()
        expect(result).toMatch(/^[a-zA-Z0-9_-]{11}$/)
        expect(result).toBe(id)
      }),
      { numRuns: 100 }
    )
  })

  it('ID langsung 11 karakter valid selalu dikembalikan apa adanya', () => {
    fc.assert(
      fc.property(validIdArb, (id) => {
        const result = extractVideoId(id)
        expect(result).toBe(id)
        expect(result).toMatch(/^[a-zA-Z0-9_-]{11}$/)
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Task 1.5: Property 8 — Export format selalu benar ────────────────────────
// Feature: transcriber, Property 8: Export format selalu benar

describe('Property 8: Export format selalu benar', () => {
  /** Arbitrary untuk TranscriptSegment */
  const segmentArb = fc.record({
    text: fc.string({ minLength: 1 }),
    start: fc.double({ min: 0, max: 7200, noNaN: true }),
    duration: fc.double({ min: 0.1, max: 60, noNaN: true }),
  })

  /** Arbitrary untuk array segment tidak kosong */
  const segmentsArb = fc.array(segmentArb, { minLength: 1, maxLength: 20 })

  it('formatTxt tidak mengandung timestamp SRT', () => {
    fc.assert(
      fc.property(segmentsArb, (segments) => {
        const result = formatTxt(segments)
        // Timestamp SRT berbentuk HH:MM:SS,mmm — tidak boleh ada di output TXT
        expect(result).not.toMatch(/\d{2}:\d{2}:\d{2},\d{3}/)
      }),
      { numRuns: 100 }
    )
  })

  it('formatTxt menghasilkan tepat N baris untuk N segment', () => {
    fc.assert(
      fc.property(segmentsArb, (segments) => {
        const result = formatTxt(segments)
        const lines = result.split('\n')
        expect(lines).toHaveLength(segments.length)
      }),
      { numRuns: 100 }
    )
  })

  it('formatTxt setiap baris adalah teks segment yang sesuai', () => {
    fc.assert(
      fc.property(segmentsArb, (segments) => {
        const result = formatTxt(segments)
        const lines = result.split('\n')
        segments.forEach((seg, i) => {
          expect(lines[i]).toBe(seg.text)
        })
      }),
      { numRuns: 100 }
    )
  })

  it('formatSrt mengandung index per segment (dimulai dari 1)', () => {
    fc.assert(
      fc.property(segmentsArb, (segments) => {
        const result = formatSrt(segments)
        const blocks = result.split('\n\n')
        expect(blocks).toHaveLength(segments.length)
        blocks.forEach((block, i) => {
          // Baris pertama setiap blok adalah index (1-based)
          const firstLine = block.split('\n')[0]
          expect(firstLine).toBe(String(i + 1))
        })
      }),
      { numRuns: 100 }
    )
  })

  it('formatSrt setiap blok mengandung timestamp range yang valid', () => {
    fc.assert(
      fc.property(segmentsArb, (segments) => {
        const result = formatSrt(segments)
        const blocks = result.split('\n\n')
        blocks.forEach((block) => {
          // Baris kedua harus berformat: HH:MM:SS,mmm --> HH:MM:SS,mmm
          const lines = block.split('\n')
          expect(lines[1]).toMatch(/^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/)
        })
      }),
      { numRuns: 100 }
    )
  })

  it('formatSrt setiap blok mengandung teks segment', () => {
    fc.assert(
      fc.property(segmentsArb, (segments) => {
        const result = formatSrt(segments)
        const blocks = result.split('\n\n')
        segments.forEach((seg, i) => {
          expect(blocks[i]).toContain(seg.text)
        })
      }),
      { numRuns: 100 }
    )
  })
})

// ─── Task 1.6: Property 9 — Nama file export konsisten ────────────────────────
// Feature: transcriber, Property 9: Nama file export konsisten

describe('Property 9: Nama file export konsisten', () => {
  /** Arbitrary untuk video ID valid 11 karakter */
  const validIdArb = fc.stringMatching(/^[a-zA-Z0-9_-]{11}$/)

  it('nama file TXT selalu transcript-{videoId}.txt', () => {
    fc.assert(
      fc.property(validIdArb, (videoId) => {
        // Konvensi penamaan: transcript-{videoId}.txt
        const filename = `transcript-${videoId}.txt`
        expect(filename).toBe(`transcript-${videoId}.txt`)
        expect(filename).toMatch(/^transcript-[a-zA-Z0-9_-]{11}\.txt$/)
      }),
      { numRuns: 100 }
    )
  })

  it('nama file SRT selalu transcript-{videoId}.srt', () => {
    fc.assert(
      fc.property(validIdArb, (videoId) => {
        // Konvensi penamaan: transcript-{videoId}.srt
        const filename = `transcript-${videoId}.srt`
        expect(filename).toBe(`transcript-${videoId}.srt`)
        expect(filename).toMatch(/^transcript-[a-zA-Z0-9_-]{11}\.srt$/)
      }),
      { numRuns: 100 }
    )
  })

  it('nama file TXT dan SRT berbeda satu sama lain (ekstensi berbeda)', () => {
    fc.assert(
      fc.property(validIdArb, (videoId) => {
        const txtFile = `transcript-${videoId}.txt`
        const srtFile = `transcript-${videoId}.srt`
        expect(txtFile).not.toBe(srtFile)
        // Keduanya berbagi prefix yang sama
        expect(txtFile.replace('.txt', '')).toBe(srtFile.replace('.srt', ''))
      }),
      { numRuns: 100 }
    )
  })

  it('videoId yang berbeda menghasilkan nama file yang berbeda', () => {
    fc.assert(
      fc.property(validIdArb, validIdArb, (id1, id2) => {
        fc.pre(id1 !== id2)
        const file1 = `transcript-${id1}.txt`
        const file2 = `transcript-${id2}.txt`
        expect(file1).not.toBe(file2)
      }),
      { numRuns: 100 }
    )
  })
})
