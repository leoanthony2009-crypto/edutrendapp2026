#!/usr/bin/env bash
# Builds the repo exactly as a deploy host does: from a clean clone of what
# git actually holds, with npm install scripts blocked (Vercel's default).
#
# This exists because a local build passing proves nothing about a deploy.
# A .gitignore rule once swallowed a source file that was present on disk,
# so every local check passed while the Vercel build failed on the missing
# module. Run this before trusting a deploy.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

BRANCH="$(git -C "$REPO_ROOT" rev-parse --abbrev-ref HEAD)"
echo "→ cloning $BRANCH from git (not the working tree)"
git clone -q "file://$REPO_ROOT" "$TMP/repo"
git -C "$TMP/repo" checkout -q "$BRANCH"

cd "$TMP/repo"
echo "→ installing with --ignore-scripts (no native builds)"
npm ci --ignore-scripts --silent

echo "→ building"
npm run build

echo "→ booting the API to confirm it runs without native modules"
BLOOM_DB=:memory: BLOOM_SEED=1 PORT=9096 node server/index.mjs &
SRV=$!
trap 'kill $SRV 2>/dev/null || true; rm -rf "$TMP"' EXIT
for _ in $(seq 1 40); do
  curl -sf -o /dev/null http://localhost:9096/api/health && break
  sleep 1
done
curl -sf -o /dev/null http://localhost:9096/api/health || { echo "✗ API failed to start"; exit 1; }

echo "✓ clean clone builds and the API runs with install scripts blocked"
