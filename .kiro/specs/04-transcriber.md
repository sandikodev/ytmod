# Spec: Transcriber

## Status: Planning

## Problem

Tidak ada cara mudah untuk mengambil transcript/subtitle dari video YouTube tanpa library berat atau scraping manual.

## Goal

User bisa mengambil transcript video YouTube (kalau tersedia) dan mengekspornya sebagai teks atau SRT.

## Requirements

1. Input video URL/ID sama seperti comment downloader
2. API mengambil transcript dari YouTube (via `timedtext` endpoint atau library)
3. Response berisi array segment: `{ text, start, duration }`
4. UI menampilkan transcript sebagai teks mengalir
5. Export sebagai `.txt` (plain) dan `.srt` (subtitle format)
6. Error yang jelas kalau transcript tidak tersedia (video tidak punya caption)

## Approach

YouTube tidak punya official API untuk transcript. Opsi:

- **Option A**: Fetch `https://www.youtube.com/watch?v={id}` → parse `ytInitialPlayerResponse` → ambil `captions.playerCaptionsTracklistRenderer`
- **Option B**: Gunakan `youtube-transcript` npm package (tapi perlu eval di Workers — risky)
- **Option C**: Fetch timedtext XML langsung: `https://www.youtube.com/api/timedtext?v={id}&lang=id&fmt=json3`

**Rekomendasi**: Option C — paling ringan, tidak perlu dependency tambahan, bisa di-fetch langsung dari Workers.

## Schema (packages/shared/src/index.ts)

```typescript
export const TranscriptSegmentSchema = z.object({
  text: z.string(),
  start: z.number(), // seconds
  duration: z.number(), // seconds
})

export const TranscriptResponseSchema = z.object({
  videoId: z.string(),
  videoTitle: z.string().optional(),
  language: z.string(),
  segments: z.array(TranscriptSegmentSchema),
})

export const TranscriptQuerySchema = z.object({
  videoId: z.string().min(1),
  lang: z.string().default('id'),
})

export type TranscriptSegment = z.infer<typeof TranscriptSegmentSchema>
export type TranscriptResponse = z.infer<typeof TranscriptResponseSchema>
export type TranscriptQuery = z.infer<typeof TranscriptQuerySchema>
```

## API Changes

`apps/api/src/routes/transcript.ts` (baru):

- `GET /transcript?videoId=&lang=`
- Fetch timedtext dari YouTube
- Parse XML/JSON response
- Return `TranscriptResponse`

`apps/api/src/index.ts`:

- Import dan register route `/transcript`

## UI Changes

`apps/web/src/routes/transcript/+page.svelte` (baru):

- Form input video URL/ID
- Tampilkan transcript sebagai paragraf
- Export `.txt` dan `.srt`

Atau tambah sebagai tab di halaman utama — TBD saat implementasi.

## Tests

`packages/shared/src/index.test.ts`:

- Test `TranscriptSegmentSchema`, `TranscriptResponseSchema`, `TranscriptQuerySchema`

`apps/api/src/routes/transcript.test.ts` (baru):

- Mock timedtext response
- Test parsing segment
- Test error kalau transcript tidak tersedia (404)
- Test validasi query params

## Tasks

- [ ] Tambah schemas di `packages/shared/src/index.ts`
- [ ] Tulis tests di `packages/shared/src/index.test.ts`
- [ ] Tulis tests di `apps/api/src/routes/transcript.test.ts`
- [ ] Implementasi `apps/api/src/routes/transcript.ts`
- [ ] Register route di `apps/api/src/index.ts`
- [ ] Implementasi UI (halaman baru atau tab)
- [ ] `pnpm test && pnpm typecheck`
- [ ] Commit per layer

## Open Questions

- Bahasa default: `id` (Indonesia) atau `en`? → Buat configurable
- Kalau auto-generated caption (bukan manual), apakah tetap diambil? → Ya, tapi tandai di response
- Multi-language support di UI? → Fase 2
