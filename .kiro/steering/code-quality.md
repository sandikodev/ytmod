# Code Quality Standards — ytmod

Steering ini berlaku untuk semua kode yang ditulis di project ini.
AI agent dan developer wajib mengikuti standar ini tanpa pengecualian.

## 1. Komentar yang Verbose dan Intuitif

Setiap kode harus bisa dibaca dan dipahami oleh developer baru tanpa perlu bertanya.

### Wajib ada komentar di:

**File/module baru** — jelaskan tujuan, konteks, dan hubungannya dengan sistem:

```typescript
/**
 * Transcript route — GET /transcript
 *
 * Mengambil subtitle/caption dari YouTube via timedtext endpoint.
 * YouTube tidak punya official API untuk transcript, sehingga kita
 * fetch langsung dari endpoint tidak resmi yang tersedia publik.
 *
 * Fallback order: lang → 'en' → auto-generated lang → auto-generated 'en'
 */
```

**Fungsi non-trivial** — jelaskan apa yang dilakukan, bukan bagaimana:

```typescript
/**
 * Resolve engine base URL dari env, strip trailing slash.
 * Fallback ke localhost:8080 jika env var tidak di-set (development).
 */
function engineUrl(env: Bindings): string { ... }
```

**Blok logika kompleks** — jelaskan mengapa, bukan apa:

```typescript
// Coba semua kombinasi bahasa sebelum menyerah.
// YouTube kadang hanya punya auto-generated caption, bukan manual.
const attempts = [
  { lang, auto: false },
  { lang: 'en', auto: false },
  { lang, auto: true },
  { lang: 'en', auto: true },
]
```

**Environment variables** — selalu dokumentasikan tipe, contoh, dan konteks:

```typescript
type Bindings = {
  YOUTUBE_API_KEY: string // YouTube Data API v3 key
  CORS_ORIGINS: string // Comma-separated, e.g. "https://example.com,http://localhost:5173"
  CLIPPER_ENGINE_URL: string // Base URL clipper-server. Lihat .env.example untuk contoh per environment.
}
```

### Komentar yang DILARANG:

```typescript
// BAD — menjelaskan apa yang sudah jelas dari kode
const x = x + 1 // increment x

// BAD — komentar bohong (tidak sinkron dengan kode)
// fetch video title
const res = await fetch('/comments') // ← ini bukan fetch title

// BAD — komentar kosong / placeholder
// TODO (tanpa penjelasan kapan dan kenapa)
```

---

## 2. Zero Hardcode — Sanitasi Ketat

### Yang TIDAK BOLEH ada di kode yang di-commit:

| Kategori                | Contoh yang dilarang                                 |
| ----------------------- | ---------------------------------------------------- |
| API keys                | `AIzaSy...`, `sk-...`, `Bearer eyJ...`               |
| Domain internal         | nama server internal, IP private, subdomain internal |
| Credentials             | password, token, secret apapun                       |
| URL production spesifik | URL yang mengandung nama infrastruktur nyata         |
| PII                     | nama orang, email, nomor telepon                     |

### Yang BOLEH dan DIANJURKAN di komentar/contoh:

```typescript
// ✅ Contoh generik yang edukatif
// CLIPPER_ENGINE_URL=http://localhost:8080          (local)
// CLIPPER_ENGINE_URL=https://abc123.ngrok-free.app  (ngrok preview)
// CLIPPER_ENGINE_URL=https://clipper-api.yourdomain.com  (production VPS)
// CLIPPER_ENGINE_URL=https://your-app.vercel.app/api     (serverless)

// ✅ Placeholder yang jelas
const apiKey = env.YOUTUBE_API_KEY // set via: wrangler secret put YOUTUBE_API_KEY
```

### Cara yang benar untuk semua nilai dinamis:

```typescript
// ✅ Selalu dari environment variable
const apiKey = c.env.YOUTUBE_API_KEY

// ✅ Fallback ke nilai development yang aman (localhost)
const engineUrl = env.CLIPPER_ENGINE_URL ?? 'http://localhost:8080'

// ✅ Konfigurasi user via UI, persisted localStorage
const engineUrl = localStorage.getItem('clipper_engine_url') ?? 'http://localhost:8080'
```

---

## 3. .env.example Wajib Lengkap

Setiap kali menambah env var baru, `.env.example` harus diupdate dengan:

1. Nama variabel
2. Komentar penjelasan singkat
3. Contoh nilai untuk setiap environment (local, preview, production)
4. Link dokumentasi jika relevan

```bash
# ─── Nama Kategori ────────────────────────────────────────────────────────────
# Penjelasan singkat variabel ini untuk apa.
# Cara mendapatkan: https://link-ke-docs
VARIABLE_NAME=contoh_nilai_development

# Preview (ngrok):
# VARIABLE_NAME=https://abc123.ngrok-free.app

# Production:
# VARIABLE_NAME=https://api.yourdomain.com
```

---

## 4. Checklist Sebelum Commit

Sebelum setiap commit, pastikan:

- [ ] Tidak ada hardcoded secret, key, URL internal, atau PII
- [ ] Setiap fungsi baru punya JSDoc/komentar yang menjelaskan tujuannya
- [ ] Setiap env var baru terdokumentasi di `.env.example`
- [ ] Komentar dalam bahasa yang konsisten (Indonesia untuk konteks bisnis, English untuk technical terms)
- [ ] `pnpm test && pnpm typecheck && pnpm lint` semua pass
