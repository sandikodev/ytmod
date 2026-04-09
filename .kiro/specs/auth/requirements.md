# Requirements Document

## Introduction

Fitur auth memungkinkan user login ke ytmod untuk mengakses fitur premium
(transcriber, YT clipper). Fitur publik seperti comment downloader tetap
bisa diakses tanpa login, hanya dibatasi rate limiting.

Karena frontend adalah static GitHub Pages dan backend adalah Cloudflare
Workers (stateless edge), auth menggunakan **JWT** yang disimpan di
`localStorage` frontend dan divalidasi di setiap request ke API.

User data dan session disimpan di **Turso** (edge SQLite) via Drizzle ORM.

## Glossary

- **JWT**: JSON Web Token — signed token yang berisi user identity
- **Turso**: Edge SQLite database (libsql protocol)
- **Drizzle**: TypeScript ORM untuk Turso/SQLite
- **Protected route**: API endpoint yang butuh valid JWT di header
- **Public route**: API endpoint yang bisa diakses tanpa auth (comments)

## Requirements

### Requirement 1: Registrasi User

**User Story:** As a new user, I want to create an account with email and
password, so that I can access premium features.

#### Acceptance Criteria

1. THE API SHALL expose `POST /auth/register` yang menerima `{ email, password }`
2. THE API SHALL hash password dengan bcrypt sebelum disimpan ke database
3. WHEN registrasi berhasil, THE API SHALL return JWT token dan user info
4. IF email sudah terdaftar, THE API SHALL return HTTP 409 dengan pesan yang jelas
5. THE API SHALL validasi format email dan panjang password minimum 8 karakter

### Requirement 2: Login

**User Story:** As a registered user, I want to login with my credentials,
so that I can get a token to access premium features.

#### Acceptance Criteria

1. THE API SHALL expose `POST /auth/login` yang menerima `{ email, password }`
2. WHEN credentials valid, THE API SHALL return JWT token (expire 7 hari) dan user info
3. IF credentials invalid, THE API SHALL return HTTP 401 (tanpa membedakan email vs password salah)
4. THE JWT SHALL berisi `{ sub: userId, email, iat, exp }`

### Requirement 3: Proteksi Route Premium

**User Story:** As the system, I want to protect premium endpoints so that
only authenticated users can access them.

#### Acceptance Criteria

1. Route `/transcript` dan `/clipper/*` SHALL membutuhkan header `Authorization: Bearer <token>`
2. IF token tidak ada atau invalid, THE API SHALL return HTTP 401
3. IF token expired, THE API SHALL return HTTP 401 dengan pesan `"Token expired"`
4. Route `/comments` dan `/auth/*` SHALL tetap publik (tidak butuh token)

### Requirement 4: UI Login/Register

**User Story:** As a user, I want a simple login and register form in the
frontend, so that I can authenticate without leaving the app.

#### Acceptance Criteria

1. THE Web SHALL punya halaman `/login` dengan form email + password
2. THE Web SHALL punya halaman `/register` dengan form email + password
3. WHEN login berhasil, THE Web SHALL simpan JWT ke `localStorage` dan redirect ke halaman utama
4. WHEN token tidak ada atau expired, THE Web SHALL redirect ke `/login`
5. THE Web SHALL tampilkan tombol logout yang menghapus token dari `localStorage`
6. Nav SHALL menampilkan status login (email user atau "Login")

### Requirement 5: Database Schema

**User Story:** As a developer, I want a clear database schema for users,
so that auth data is stored consistently.

#### Acceptance Criteria

1. Tabel `users` SHALL punya kolom: `id` (text, PK), `email` (text, unique), `password_hash` (text), `created_at` (integer)
2. Schema SHALL didefinisikan dengan Drizzle ORM di `apps/api/src/db/schema.ts`
3. Migration SHALL bisa dijalankan ke Turso dengan satu command
