# ytmod

YouTube tools — comment downloader, transcriber, dan lainnya.

- Frontend: `sandikodev.github.io/ytmod` (Svelte + GitHub Pages)
- Backend: Cloudflare Workers (Hono)

## Struktur

```
ytmod/
├── apps/
│   ├── api/        # Hono API (Cloudflare Workers)
│   └── web/        # Svelte frontend (GitHub Pages)
└── packages/
    └── shared/     # Zod schemas & shared types
```

## Setup

```bash
pnpm install
```

### API

```bash
cp apps/api/.env.example apps/api/.env
# isi YOUTUBE_API_KEY

pnpm dev:api
```

### Frontend

```bash
cp apps/web/.env.example apps/web/.env

pnpm dev:web
```

## Deploy

- Frontend: push ke `main` di repo `ytmod-web` → auto deploy via GitHub Actions
- API: `cd apps/api && pnpm deploy` (butuh Cloudflare account)
