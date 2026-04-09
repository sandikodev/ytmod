# Contributing to ytmod

Thanks for your interest! Here's how to get started.

## Setup

```bash
git clone https://github.com/sandikodev/ytmod
cd ytmod
pnpm install
```

Copy env files:

```bash
cp apps/api/.env.example apps/api/.dev.vars   # fill YOUTUBE_API_KEY, CORS_ORIGINS
cp apps/web/.env.example apps/web/.env         # fill VITE_API_URL
```

Run dev:

```bash
pnpm dev   # api → :8787, web → :5173
```

## Workflow

- Branch from `main`
- Commit with [conventional commits](https://www.conventionalcommits.org): `feat:`, `fix:`, `docs:`, `chore:`
- Run `pnpm lint && pnpm typecheck && pnpm test` before pushing
- Open a PR against `main`

## Project Structure

```
apps/api/src/
  index.ts          # Hono app entry, CORS setup
  routes/
    comments.ts     # GET /comments — YouTube Data API proxy

apps/web/src/
  routes/
    +page.svelte    # Main UI

packages/shared/src/
  index.ts          # Zod schemas & shared types
```

## Adding a New Feature

1. Add/update Zod schema in `packages/shared/src/index.ts`
2. Add API route in `apps/api/src/routes/`
3. Update UI in `apps/web/src/routes/`
4. Write tests
5. Update README if needed
