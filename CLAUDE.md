# CLAUDE.md — ytmod

## Project

YouTube tools monorepo — SvelteKit + Hono + Cloudflare Workers.

## Non-negotiable Rules

- Never hardcode secrets, API keys, URLs, or domain names in source files
- All env values via `.dev.vars` (API) or `.env` (web) — both gitignored
- Schema changes always start in `packages/shared/src/index.ts`
- Never modify tests unless explicitly asked

## Stack

- **API**: Hono on Cloudflare Workers, TypeScript, Zod validation
- **Web**: SvelteKit 2, Svelte 5 (runes: `$state`, `$derived`), TypeScript
- **Shared**: Zod schemas, no runtime dependencies

## Code Style

- Minimal — write only what's needed
- No `any` types
- Prefer `zod.infer<>` over manual type definitions
- API errors return `{ error: string }` with appropriate HTTP status

## Testing

- Vitest for unit tests
- Colocate tests: `foo.ts` → `foo.test.ts`
- Test schema validation, API handlers, utility functions
- Do NOT add tests unless explicitly asked

## Commit Format

`type(scope): description` — e.g. `feat(api): add pagination support`
