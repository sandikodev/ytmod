# Spec: Filter UI

## Status: Done

## Problem

UI saat ini hardcode `maxResults=100&order=time`. User tidak bisa mengontrol jumlah komentar atau urutan tampilan.

## Goal

User bisa memilih `order` (time/relevance) dan `maxResults` (20/50/100) sebelum fetch.

## Requirements

1. Dropdown/select untuk `order`: "Terbaru" (time) | "Paling Relevan" (relevance)
2. Dropdown/select untuk `maxResults`: 20 | 50 | 100
3. Default: `order=relevance`, `maxResults=20` (sesuai schema default)
4. Filter diterapkan saat tombol "Ambil Komentar" ditekan
5. Saat fetch ulang (video baru), filter tetap pada nilai yang dipilih user
6. Reset `allComments` dan `nextPageToken` saat fetch baru dimulai

## Schema Changes

Tidak ada — `CommentsQuerySchema` sudah punya `order` dan `maxResults` dengan defaults.

## UI Changes

`apps/web/src/routes/+page.svelte`:

- State baru: `order: 'time' | 'relevance'` (default: `'relevance'`)
- State baru: `maxResults: number` (default: `20`)
- Tambah `<select>` untuk order dan maxResults di bawah input URL
- Gunakan nilai ini saat build URL fetch

## API Changes

Tidak ada.

## Tests

Tidak ada test baru (UI-only change).

## Tasks

- [ ] Tambah state `order` dan `maxResults` di `+page.svelte`
- [ ] Tambah filter controls (2 select elements) di form
- [ ] Update `fetchComments()` pakai nilai filter
- [ ] `pnpm typecheck`
- [ ] Commit: `feat(web): add order and maxResults filter controls`
