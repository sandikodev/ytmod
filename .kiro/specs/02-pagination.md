# Spec: Pagination

## Status: Ready

## Problem

API sudah mengembalikan `nextPageToken` tapi UI tidak memanfaatkannya. User hanya bisa lihat batch pertama komentar (max 100).

## Goal

User bisa load lebih banyak komentar secara incremental tanpa reload halaman.

## Requirements

1. UI menampilkan tombol "Muat lebih banyak" kalau `nextPageToken` ada
2. Komentar baru di-append ke list yang sudah ada (bukan replace)
3. Loading state per-request (tombol disabled saat loading)
4. Tombol hilang kalau tidak ada `nextPageToken` lagi
5. Export CSV/JSON menyertakan semua komentar yang sudah di-load

## Schema Changes

Tidak ada perubahan schema — `nextPageToken` sudah ada di `CommentsResponseSchema`.

## UI Changes

`apps/web/src/routes/+page.svelte`:

- State baru: `allComments: Comment[]` — akumulasi semua komentar
- State baru: `nextPageToken: string | undefined`
- State baru: `loadingMore: boolean`
- Saat fetch pertama: reset `allComments`, set `nextPageToken`
- Fungsi `loadMore()`: fetch dengan `pageToken`, append ke `allComments`
- Tombol "Muat lebih banyak" muncul kalau `nextPageToken` ada
- Export menggunakan `allComments`, bukan `result.comments`

## API Changes

Tidak ada perubahan API — `pageToken` query param sudah didukung.

## Tests

Tidak ada test baru di API (tidak ada perubahan API).

UI tidak di-test kecuali diminta.

## Tasks

- [ ] Refactor state di `+page.svelte`: pisahkan `allComments` dari `result`
- [ ] Implementasi `loadMore()` function
- [ ] Tambah tombol "Muat lebih banyak" dengan loading state
- [ ] Update `downloadCsv()` dan `downloadJson()` pakai `allComments`
- [ ] `pnpm typecheck`
- [ ] Commit: `feat(web): add pagination with load more`
