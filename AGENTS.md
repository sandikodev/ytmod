# AGENTS.md — ytmod

YouTube tools monorepo. SvelteKit frontend + Hono API on Cloudflare Workers.

## Structure

```
apps/api/src/routes/comments.ts   # GET /comments — YouTube Data API proxy
apps/web/src/routes/+page.svelte  # Main UI
packages/shared/src/index.ts      # Zod schemas shared between api & web
```

## Key Rules

- All secrets via env — never hardcode API keys, URLs, or tokens
- `apps/api/.dev.vars` for local secrets (gitignored)
- `apps/web/.env` for local frontend env (gitignored)
- Shared types always go in `packages/shared/` first, then use in api & web
- Conventional commits: `feat:`, `fix:`, `docs:`, `chore:`, `test:`

## Dev Commands

```bash
pnpm dev          # run api + web concurrently
pnpm dev:api      # wrangler dev → localhost:8787
pnpm dev:web      # vite dev → localhost:5173
pnpm test         # run all tests
pnpm lint         # eslint
pnpm typecheck    # tsc --noEmit
```

## API

`GET /comments?videoId=&maxResults=&pageToken=&order=`

Response shape defined in `packages/shared/src/index.ts` — `CommentsResponseSchema`.

## Adding Features

1. Schema first → `packages/shared/src/index.ts`
2. API route → `apps/api/src/routes/`
3. UI → `apps/web/src/routes/`
4. Tests → colocated `*.test.ts`
