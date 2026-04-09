# Spec: Video Title in Response

## Status: Ready

## Problem

API response tidak menyertakan judul video. User harus buka YouTube manual untuk tahu video apa yang sedang diunduh komentarnya.

## Goal

Tampilkan judul video di UI setelah komentar berhasil diambil.

## Requirements

1. API mengambil judul video dari YouTube Data API (videos endpoint)
2. `videoTitle` dikembalikan dalam response `CommentsResponse`
3. UI menampilkan judul video di atas daftar komentar
4. Kalau fetch title gagal, tidak boleh gagalkan seluruh request — fallback ke `undefined`

## Schema Changes

`packages/shared/src/index.ts` — `videoTitle` sudah ada sebagai optional, tidak perlu perubahan.

## API Changes

`apps/api/src/routes/comments.ts`:

- Setelah fetch commentThreads, fetch juga `videos?part=snippet&id={videoId}`
- Ambil `items[0].snippet.title`
- Masukkan ke response sebagai `videoTitle`

YouTube API endpoint:

```
GET https://www.googleapis.com/youtube/v3/videos?part=snippet&id={videoId}&key={apiKey}
```

## UI Changes

`apps/web/src/routes/+page.svelte`:

- Tampilkan `result.videoTitle` di atas judul section hasil
- Format: `"{videoTitle}" — {totalComments} komentar`

## Tests

`packages/shared/src/index.test.ts`:

- `videoTitle` optional di CommentsResponseSchema ✅ (sudah ada)

`apps/api/src/routes/comments.test.ts` (baru):

- Mock YouTube videos API response
- Assert `videoTitle` ada di response kalau API sukses
- Assert response tetap valid kalau videos API gagal (videoTitle undefined)

## Tasks

- [ ] Tulis test di `apps/api/src/routes/comments.test.ts`
- [ ] Fetch video title di `apps/api/src/routes/comments.ts`
- [ ] Update UI di `+page.svelte`
- [ ] `pnpm test && pnpm typecheck`
- [ ] Commit: `feat(api): fetch video title`, `feat(web): display video title`
