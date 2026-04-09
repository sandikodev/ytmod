# Implementation Plan: Transcriber

## Overview

Implementasi fitur Transcriber mengikuti TDD workflow: Schema → Test → Impl → Green.
Banyak scaffolding sudah ada (`transcript.ts`, `transcript.test.ts`, `+page.svelte`), sehingga tasks ini fokus pada gap yang belum diimplementasi: ekstraksi videoId yang robust, HTML stripping, validasi format, lib helper terpisah, dan property-based tests.

## Tasks

- [x] 1. Ekstrak helper functions ke `apps/web/src/lib/transcript.ts`
  - [x] 1.1 Buat file `apps/web/src/lib/transcript.ts` dengan fungsi `extractVideoId`, `formatTxt`, `formatSrt`, dan `formatSrtTimestamp`
    - `extractVideoId(input)` harus mendukung: ID langsung, `youtube.com/watch?v=`, `youtu.be/`, `embed/`, `m.youtube.com/watch?v=`
    - `formatTxt(segments)` → setiap `segment.text` dipisahkan newline, tanpa timestamp
    - `formatSrtTimestamp(seconds)` → `"HH:MM:SS,mmm"`
    - `formatSrt(segments)` → format SRT standar per segment: index, timestamp range, teks, baris kosong
    - Setiap fungsi wajib punya JSDoc yang menjelaskan tujuan dan return value
    - _Requirements: 3.2, 5.3, 5.4, 5.5, 5.6_

  - [x]\* 1.2 Tulis unit tests untuk `extractVideoId` di `apps/web/src/lib/transcript.test.ts`
    - Test semua format URL yang didukung
    - Test ID langsung 11 karakter
    - Test input tidak valid mengembalikan `null`
    - _Requirements: 3.2_

  - [x]\* 1.3 Tulis unit tests untuk `formatTxt` dan `formatSrt`
    - Test `formatTxt`: output tanpa timestamp, setiap segment satu baris
    - Test `formatSrt`: index dimulai dari 1, format timestamp `HH:MM:SS,mmm --> HH:MM:SS,mmm`, baris kosong sebagai separator
    - Test `formatSrtTimestamp`: konversi detik ke format SRT yang benar (edge case: 0, 3600, 3661.5)
    - _Requirements: 5.3, 5.4_

  - [x]\* 1.4 Tulis property test untuk `extractVideoId` (Property 6)
    - **Property 6: Ekstraksi videoId dari berbagai format URL**
    - **Validates: Requirements 3.2**
    - Generate berbagai URL YouTube valid, pastikan hasil selalu 11 karakter match `[a-zA-Z0-9_-]{11}`
    - Tag: `// Feature: transcriber, Property 6: extractVideoId dari berbagai format URL`

  - [x]\* 1.5 Tulis property test untuk `formatTxt` dan `formatSrt` (Property 8)
    - **Property 8: Export format selalu benar**
    - **Validates: Requirements 5.3, 5.4**
    - Generate array `TranscriptSegment` arbitrary, pastikan `formatTxt` tidak mengandung timestamp dan `formatSrt` mengandung index + timestamp range per segment
    - Tag: `// Feature: transcriber, Property 8: Export format selalu benar`

  - [x]\* 1.6 Tulis property test untuk nama file export (Property 9)
    - **Property 9: Nama file export konsisten**
    - **Validates: Requirements 5.5, 5.6**
    - Generate videoId valid, pastikan nama file selalu `transcript-{videoId}.txt` dan `transcript-{videoId}.srt`
    - Tag: `// Feature: transcriber, Property 9: Nama file export konsisten`

- [x] 2. Perbaiki API route: validasi videoId dan HTML stripping
  - [x] 2.1 Tambah fungsi `extractVideoId(input)` di `apps/api/src/routes/transcript.ts`
    - Ekstrak 11-char ID dari URL sebelum validasi
    - Mendukung format yang sama dengan web helper
    - Wajib ada JSDoc yang menjelaskan format yang didukung dan return value
    - _Requirements: 3.2_

  - [x] 2.2 Tambah fungsi `validateVideoId(id)` dan terapkan di route handler
    - Validasi pattern `[a-zA-Z0-9_-]{11}` setelah ekstraksi
    - Return HTTP 400 dengan pesan `"Invalid videoId format"` jika tidak valid
    - _Requirements: 3.3_

  - [x] 2.3 Tambah fungsi `parseTimedtext(events)` sebagai fungsi murni yang dapat ditest
    - Pisahkan logika parsing dari route handler
    - Strip HTML entities: `&amp;`, `&lt;`, `&gt;`, `&#39;`, `&quot;`
    - Strip HTML tags: `<b>`, `<i>`, `<font>`, dll (regex `/<[^>]+>/g`)
    - Filter segment dengan text kosong setelah stripping
    - Wajib ada JSDoc yang menjelaskan input, output, dan side effects
    - _Requirements: 2.1, 2.4_

  - [x]\* 2.4 Tulis unit tests untuk `extractVideoId` dan `validateVideoId` di `transcript.test.ts`
    - Test ekstraksi dari berbagai format URL
    - Test validasi: valid ID pass, ID terlalu pendek/panjang/karakter invalid → 400
    - _Requirements: 3.2, 3.3_

  - [x]\* 2.5 Tulis unit tests untuk `parseTimedtext`
    - Test konversi `tStartMs / 1000` → `start`, `dDurationMs / 1000` → `duration`
    - Test filter event tanpa `segs`
    - Test HTML stripping: entities dan tags dihapus
    - Test filter segment kosong setelah stripping
    - _Requirements: 2.1, 2.4_

  - [x]\* 2.6 Tulis property test untuk `parseTimedtext` — Segment fields (Property 3)
    - **Property 3: Timedtext events → Segment fields**
    - **Validates: Requirements 2.1**
    - Generate array timedtext events arbitrary, pastikan setiap segment output memiliki `text` (string), `start` (number), `duration` (number) dengan konversi ms → detik yang benar
    - Tag: `// Feature: transcriber, Property 3: Timedtext events → Segment fields`

  - [x]\* 2.7 Tulis property test untuk HTML stripping (Property 4)
    - **Property 4: HTML dibersihkan dari segment text**
    - **Validates: Requirements 2.4**
    - Generate text dengan berbagai kombinasi HTML entities dan tags, pastikan output tidak mengandung karakter HTML
    - Tag: `// Feature: transcriber, Property 4: HTML dibersihkan dari segment text`

  - [x]\* 2.8 Tulis property test untuk validasi videoId (Property 7)
    - **Property 7: videoId tidak valid selalu ditolak**
    - **Validates: Requirements 3.3**
    - Generate string yang tidak match `[a-zA-Z0-9_-]{11}`, pastikan API selalu return 400
    - Tag: `// Feature: transcriber, Property 7: videoId tidak valid selalu ditolak`

- [x] 3. Checkpoint — Pastikan semua tests pass
  - Jalankan `pnpm test && pnpm typecheck && pnpm lint`, pastikan semua hijau sebelum lanjut.

- [x] 4. Tambah property test round-trip di shared package
  - [x]\* 4.1 Tulis property test untuk `TranscriptResponse` JSON round-trip (Property 5) di `packages/shared/src/index.test.ts`
    - **Property 5: Timedtext parse round-trip**
    - **Validates: Requirements 2.5, 6.4**
    - Generate `TranscriptResponse` arbitrary, serialize ke JSON lalu parse kembali, pastikan hasilnya equivalent
    - Tag: `// Feature: transcriber, Property 5: TranscriptResponse JSON round-trip`

- [x] 5. Update web page untuk menggunakan lib helper
  - [x] 5.1 Refactor `apps/web/src/routes/transcript/+page.svelte` untuk menggunakan fungsi dari `$lib/transcript`
    - Import `extractVideoId`, `formatTxt`, `formatSrt` dari `$lib/transcript`
    - Hapus implementasi inline `toSrt` dan `extractVideoId` yang ada di component
    - Pastikan `downloadTxt` dan `downloadSrt` menggunakan helper yang sudah ditest
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 6. Checkpoint akhir — Semua tests pass
  - Jalankan `pnpm test && pnpm typecheck && pnpm lint`, pastikan semua hijau.

- [ ] 7. Auth integration — `$lib/auth` untuk transcript page
  - [ ] 7.1 Buat `apps/web/src/lib/auth.ts` dengan fungsi `getToken`, `requireAuth`, dan `authFetch`
    - `getToken()` → ambil JWT dari `localStorage`, return `null` jika tidak ada atau SSR
    - `requireAuth()` → redirect ke `/login` jika belum login, return token
    - `authFetch(url, options)` → wrapper `fetch` yang otomatis sertakan `Authorization: Bearer {token}`
    - Setiap fungsi wajib punya JSDoc yang menjelaskan tujuan, behavior SSR, dan side effects
    - _Catatan: file sudah ada, task ini untuk verifikasi kualitas komentar sesuai code-quality.md_

  - [ ] 7.2 Buat halaman login `apps/web/src/routes/login/+page.svelte`
    - Form input token (password field)
    - Simpan token ke `localStorage` dengan key `ytmod_token`
    - Redirect ke halaman sebelumnya atau `/` setelah login
    - Tampilkan error jika token kosong
    - _Requirements: implicit dari penggunaan `requireAuth()` di transcript page_

  - [ ] 7.3 Update `apps/web/.env.example` dengan dokumentasi auth
    - Tambah komentar penjelasan mekanisme auth (token-based, localStorage)
    - Sertakan contoh nilai untuk development dan production
    - _Sesuai code-quality.md: setiap env var baru harus terdokumentasi di .env.example_

- [ ] 8. Code quality audit — sesuai code-quality.md
  - [ ] 8.1 Audit `apps/api/src/routes/transcript.ts`
    - Verifikasi semua fungsi punya JSDoc yang menjelaskan tujuan (bukan implementasi)
    - Verifikasi `Bindings` type punya komentar untuk setiap env var
    - Verifikasi tidak ada hardcoded URL, key, atau domain
    - Verifikasi fallback chain punya komentar yang menjelaskan *mengapa* (bukan *apa*)

  - [ ] 8.2 Audit `apps/web/src/lib/transcript.ts`
    - Verifikasi setiap fungsi punya JSDoc
    - Verifikasi tidak ada komentar yang menjelaskan hal yang sudah jelas dari kode

  - [ ] 8.3 Audit `apps/web/src/lib/auth.ts`
    - Verifikasi JSDoc menjelaskan behavior SSR (`typeof localStorage === 'undefined'`)
    - Verifikasi komentar menjelaskan *mengapa* redirect, bukan *apa* yang dilakukan

  - [ ] 8.4 Update `apps/api/.env.example` dan `apps/web/.env.example`
    - Pastikan semua env var yang digunakan fitur transcriber terdokumentasi
    - Format sesuai code-quality.md: nama, penjelasan, contoh per environment

- [ ] 9. Checkpoint final — code quality + tests
  - Jalankan `pnpm test && pnpm typecheck && pnpm lint`
  - Review checklist code-quality.md: tidak ada hardcode, semua fungsi punya JSDoc, .env.example lengkap

## Notes

- Tasks bertanda `*` bersifat opsional dan bisa dilewati untuk MVP yang lebih cepat
- Tasks 7-9 adalah tambahan baru berdasarkan `code-quality.md` steering yang aktif
- Setiap task mereferensikan requirements spesifik untuk traceability
- Property tests menggunakan **fast-check** dengan minimum 100 iterasi
- Urutan commit yang disarankan: `test(web)` → `feat(web)` → `test(api)` → `feat(api)` → `test(shared)` → `chore(web): auth integration` → `chore: code quality audit`
