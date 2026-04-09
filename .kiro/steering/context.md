# Project Context — ytmod

## Identitas

Gunakan identity **sandikodev** untuk semua operasi git/gh di project ini.

```bash
use sandikodev
as sandikodev git push
as sandikodev gh pr create
```

Remote: `git@github-sandikodev:sandikodev/ytmod.git`

## Project

YouTube tools monorepo — comment downloader, transcriber, dan tools lainnya.

- **API**: Hono + Cloudflare Workers → `https://ytmod-api.<subdomain>.workers.dev`
- **Web**: SvelteKit + GitHub Pages → `https://sandikodev.github.io/ytmod`
- **Shared**: Zod schemas di `packages/shared/src/index.ts`

## Struktur

```
apps/api/src/
  index.ts              # Hono entry, CORS middleware
  routes/
    comments.ts         # GET /comments — YouTube Data API proxy

apps/web/src/
  routes/
    +page.svelte        # Main UI (Svelte 5 runes)

packages/shared/src/
  index.ts              # Zod schemas & TypeScript types
```

## Environment Variables

### API (`apps/api/.dev.vars` lokal, `wrangler secret` production)

```
YOUTUBE_API_KEY=...
CORS_ORIGINS=http://localhost:5173,https://sandikodev.github.io
```

### Web (`apps/web/.env` lokal, `.env.production` production)

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
# API
as sandikodev pnpm exec wrangler deploy   # dari apps/api/

# Web — otomatis via GitHub Actions saat push ke main
as sandikodev git push
```

## Konvensi

- Commit: conventional commits — `feat:`, `fix:`, `docs:`, `chore:`, `test:`
- Scope: `(api)`, `(web)`, `(shared)` — contoh: `feat(api): add pagination`
- Branch: `main` untuk production, feature branch untuk PR
- Secrets: tidak pernah di-commit
- Types: selalu dari `packages/shared/`, bukan didefinisikan ulang di api/web
