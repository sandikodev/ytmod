# Tasks — Auth

## Status: Done

## Implementasi

### ✅ API
- `POST /auth/register` — email + password, return JWT
- `POST /auth/login` — email + password, return JWT
- Password di-hash dengan PBKDF2 (Web Crypto API, bukan bcrypt)
- JWT signed dengan HS256, expire 7 hari
- Rate limit 10 req/min per IP (brute force protection)
- Route `/transcript` dan `/clipper/*` protected via JWT middleware
- Route `/comments` dan `/auth/*` tetap publik

### ✅ Frontend
- `/login` — form **email + password** (BUKAN token input)
- `/register` — form email + password
- JWT disimpan di `localStorage` key `ytmod_token`
- `src/lib/auth.ts` — helper `getToken()`, `requireAuth()`, `authFetch()`
- Layout nav menampilkan email user + tombol logout
- `/transcript` dan `/clipper` redirect ke `/login` via `onMount` jika belum auth

### ✅ Database
- Turso (libsql) via Drizzle ORM
- Tabel `users`: id, email, password_hash, created_at
- Production: `libsql://your-production-db.turso.io`
- Preview/Dev: `libsql://your-preview-db.turso.io`

## Catatan Penting untuk Agent

**Login menggunakan EMAIL dan PASSWORD — bukan token manual.**

Halaman `/login` HARUS punya:
```html
<input type="email" ... />
<input type="password" ... />
```

BUKAN:
```html
<input type="password" placeholder="Paste token di sini" />
```

Jika ada agent lain yang mengubah halaman login menjadi token-based,
itu adalah kesalahan dan harus dikembalikan ke email/password form.
