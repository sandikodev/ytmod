# TDD Workflow — ytmod

Setiap fitur baru mengikuti urutan ini tanpa pengecualian.

## Urutan Wajib

```
1. Schema  →  packages/shared/src/index.ts
2. Test    →  *.test.ts (tulis dulu, belum pass)
3. Impl    →  api route / svelte component
4. Green   →  pnpm test harus pass semua
5. Commit  →  conventional commit per layer
```

## 1. Schema First

Tambah atau update Zod schema di `packages/shared/src/index.ts` sebelum menyentuh api atau web.

```typescript
// Contoh: tambah field baru
export const CommentsResponseSchema = z.object({
  videoId: z.string(),
  videoTitle: z.string().optional(),  // ← tambah di sini dulu
  ...
})
```

Jalankan typecheck setelah schema berubah:

```bash
pnpm typecheck
```

## 2. Tulis Test Dulu

Test ditulis sebelum implementasi. Test boleh fail dulu — itu normal.

```bash
# Lokasi test
packages/shared/src/index.test.ts   # schema tests
apps/api/src/index.test.ts          # api handler tests
apps/api/src/routes/*.test.ts       # route-level tests
```

Jalankan test untuk konfirmasi fail:

```bash
pnpm test
```

## 3. Implementasi

Baru setelah test ditulis, implementasi dikerjakan:

- API route → `apps/api/src/routes/`
- UI → `apps/web/src/routes/`

## 4. Semua Test Harus Hijau

```bash
pnpm test && pnpm typecheck && pnpm lint
```

Tidak boleh commit kalau ada test yang fail.

## 5. Commit Per Layer

```bash
# Urutan commit yang benar
git commit -m "feat(shared): add VideoTranscriptSchema"
git commit -m "test(api): add transcript endpoint tests"
git commit -m "feat(api): add GET /transcript route"
git commit -m "feat(web): add transcript UI"
```

## Aturan Test

- Colocate: `foo.ts` → `foo.test.ts` di folder yang sama
- Test schema validation (valid, invalid, edge cases)
- Test API handler: status codes, error responses
- Tidak perlu test UI (Svelte components) kecuali diminta
- Mock external calls (YouTube API) — jangan hit real API di test

## Contoh Siklus Lengkap

Fitur: tambah `videoTitle` di response

```bash
# 1. Schema
# Edit packages/shared/src/index.ts — tambah videoTitle

# 2. Test
# Edit packages/shared/src/index.test.ts — test videoTitle ada di response
# Edit apps/api/src/index.test.ts — test response shape

# 3. Implementasi
# Edit apps/api/src/routes/comments.ts — fetch video title dari YouTube API
# Edit apps/web/src/routes/+page.svelte — tampilkan videoTitle

# 4. Verifikasi
pnpm test && pnpm typecheck

# 5. Commit
git commit -m "feat(shared): add videoTitle to CommentsResponseSchema"
git commit -m "feat(api): fetch and return video title"
git commit -m "feat(web): display video title in result"
```
