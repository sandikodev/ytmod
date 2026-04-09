# CHANGELOG

All notable changes to this project will be documented here.
Format: [Keep a Changelog](https://keepachangelog.com) — [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added

- Pagination support (nextPageToken)
- Video title in response
- Filter by order & maxResults from UI
- Transcriber feature

## [0.1.0] - 2026-04-09

### Added

- Comment downloader — fetch YouTube comments via YouTube Data API v3
- Export as CSV and JSON
- Sort by time or relevance
- Cloudflare Workers API (Hono) with rate limiting (30 req/min per IP)
- SvelteKit frontend deployed to GitHub Pages
- Zod shared schemas between API and frontend
