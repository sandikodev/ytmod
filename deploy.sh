#!/usr/bin/env bash
# deploy.sh — manual deploy script
# Usage:
#   ./deploy.sh api       → deploy Cloudflare Workers
#   ./deploy.sh web       → trigger GitHub Pages deploy
#   ./deploy.sh all       → deploy both

set -e

cmd="${1:-help}"

deploy_api() {
  echo "→ Deploying API to Cloudflare Workers..."
  cd apps/api
  pnpm exec wrangler deploy
  cd ../..
  echo "✓ API deployed"
}

deploy_web() {
  echo "→ Triggering GitHub Pages deploy..."
  gh workflow run deploy-pages.yml \
    --field reason="manual deploy $(date '+%Y-%m-%d %H:%M')"
  echo "✓ Deploy triggered — check: gh run list --workflow=deploy-pages.yml"
}

case "$cmd" in
  api) deploy_api ;;
  web) deploy_web ;;
  all) deploy_api && deploy_web ;;
  *)
    echo "Usage: ./deploy.sh [api|web|all]"
    echo "  api  — deploy Cloudflare Workers API"
    echo "  web  — trigger GitHub Pages frontend deploy"
    echo "  all  — deploy both"
    ;;
esac
