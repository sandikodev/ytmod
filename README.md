# ytmod

> YouTube tools — comment downloader, transcriber, and more.

[![Deploy Frontend](https://github.com/sandikodev/ytmod/actions/workflows/deploy-pages.yml/badge.svg)](https://github.com/sandikodev/ytmod/actions/workflows/deploy-pages.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Live:** [sandikodev.github.io/ytmod](https://sandikodev.github.io/ytmod)

## Features

- 📥 **Comment Downloader** — fetch YouTube comments, export as CSV or JSON
- 🔄 Pagination support
- 🔍 Sort by time or relevance
- 🚀 Powered by Cloudflare Workers (zero cold start)

## Stack

| Layer        | Tech                      |
| ------------ | ------------------------- |
| Frontend     | SvelteKit + GitHub Pages  |
| API          | Hono + Cloudflare Workers |
| Shared types | Zod schemas               |
| Runtime      | Node.js (fnm) + pnpm      |

## Project Structure

```
ytmod/
├── apps/
│   ├── api/        # Hono API (Cloudflare Workers)
│   └── web/        # SvelteKit frontend (GitHub Pages)
└── packages/
    └── shared/     # Zod schemas & shared types
```

## Getting Started

```bash
pnpm install
```

### API (local dev)

```bash
cp apps/api/.env.example apps/api/.dev.vars
# fill in YOUTUBE_API_KEY and CORS_ORIGINS

pnpm dev:api   # → http://localhost:8787
```

### Frontend (local dev)

```bash
cp apps/web/.env.example apps/web/.env
# VITE_API_URL=http://localhost:8787

pnpm dev:web   # → http://localhost:5173
```

### Run both

```bash
pnpm dev
```

## Deploy

- **Frontend:** push to `main` → auto deploy via GitHub Actions
- **API:** `cd apps/api && pnpm exec wrangler deploy`

Set secrets on Cloudflare:

```bash
echo "your_key" | pnpm exec wrangler secret put YOUTUBE_API_KEY
echo "https://your-domain.com" | pnpm exec wrangler secret put CORS_ORIGINS
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE)
