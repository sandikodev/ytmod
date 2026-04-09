# Project Context — ytmod

## Project

YouTube tools monorepo — comment downloader, transcript, dan YT clipper.

- **API**: Hono + Cloudflare Workers
- **Web**: SvelteKit + GitHub Pages → `https://sandikodev.github.io/ytmod`
- **Shared**: Zod schemas di `packages/shared/src/index.ts`
- **Clipper Engine**: Rust binary (`clipper-server`) — submodule di `apps/clipper`

## Struktur

```
apps/
  api/src/
    index.ts              # Hono entry, CORS middleware
    routes/
      comments.ts         # GET  /comments  — YouTube Data API proxy
      transcript.ts       # GET  /transcript — YouTube timedtext proxy
      clipper.ts          # POST /clipper/*  — Clipper Engine proxy
  web/src/
    routes/
      +page.svelte              # Comment downloader
      transcript/+page.svelte   # Transcript downloader
      clipper/+page.svelte      # YT Clipper (BYOK Gemini)
  clipper/                      # git submodule → sandikodev/clipper-rust
    src/
      lib.rs      # Shared logic (download, analyze, clip)
      main.rs     # CLI binary
      server.rs   # HTTP server binary (clipper-server)

packages/shared/src/
  index.ts        # Semua Zod schemas & TypeScript types
```

## Environment Variables

### API (`apps/api/.dev.vars` lokal, `wrangler secret` production)

```
YOUTUBE_API_KEY=...         # YouTube Data API v3 key
CORS_ORIGINS=...            # Comma-separated allowed origins
CLIPPER_ENGINE_URL=...      # Base URL clipper-server. Lihat .env.example.
```

### Web (`apps/web/.env` lokal)

```
VITE_API_URL=http://localhost:8787
```

## Dev Commands

```bash
pnpm dev          # api :8787 + web :5173 concurrent
pnpm dev:api      # wrangler dev saja
pnpm dev:web      # vite dev saja
pnpm test         # vitest run semua packages
pnpm lint         # eslint + prettier check
pnpm typecheck    # tsc --noEmit semua packages
pnpm format       # prettier --write
```

## Deploy

```bash
# API — dari apps/api/
pnpm exec wrangler deploy

# Web — otomatis via GitHub Actions saat push ke main
git push

# Clipper Engine — dari apps/clipper/
docker compose up -d                                    # development
docker compose -f docker-compose.yml \
               -f docker-compose.prod.yml up -d        # production
```

## Konvensi

- Commit: conventional commits — `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- Scope: `(api)`, `(web)`, `(shared)`, `(clipper)` — contoh: `feat(api): add pagination`
- Branch: `main` untuk production, feature branch untuk PR
- Secrets: tidak pernah di-commit — selalu via env var
- Types: selalu dari `packages/shared/`, tidak didefinisikan ulang di api/web
- Komentar: wajib verbose dan intuitif — lihat `.kiro/steering/code-quality.md`
