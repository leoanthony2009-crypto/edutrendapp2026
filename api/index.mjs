/**
 * Vercel serverless entry — DEMO DEPLOYMENT ONLY.
 *
 * Vercel has no persistent disk, so this runs Bloom's real API against an
 * in-memory SQLite database that is seeded on each cold start. Everything
 * the app enforces (authentication, school tenancy, the 20-voice anonymity
 * threshold, structured safeguarding closure, immutable audit events) is
 * genuinely enforced here — but the storage is ephemeral:
 *
 *   - anything submitted during a session is lost on the next cold start
 *   - concurrent lambda instances hold independent databases
 *   - the 24-hour SLA sweep does not run (no long-lived process)
 *
 * That is why the UI carries a "Demo build" banner. For a pilot with real
 * pupils use a Node host with a persistent volume — see render.yaml and
 * DEPLOY.md.
 *
 * ROUTING: this file is deliberately NOT named `[...path].mjs`. Vercel
 * inferred that filename as a *single*-segment dynamic route, so `/api/meta`
 * reached Express while `/api/auth/login` was rejected with a platform-level
 * 404 before the function ever ran — which broke sign-in on the deployed
 * build while every local test passed. Routing is now stated explicitly as a
 * rewrite in vercel.json rather than inferred from a filename.
 */
import { openDb } from '../server/db.mjs'
import { createApp, seed } from '../server/app.mjs'
import { createDevDeliveryAdapter } from '../server/notify.mjs'

let cached = null

function boot() {
  if (cached) return cached
  const db = openDb(':memory:')
  seed(db)
  const adapter = createDevDeliveryAdapter(db, { quiet: true })
  cached = createApp(db, { deliveryAdapter: adapter, ephemeral: true })
  return cached
}

/**
 * The vercel.json rewrite carries the real path in `__path` because a rewrite
 * destination replaces the URL the function sees. Restore it so Express routes
 * on the path the client actually asked for. When the platform preserves the
 * original URL (local runs, or a direct hit on /api/index) there is no `__path`
 * and the request is passed through untouched.
 */
export function restorePath(rawUrl) {
  const url = new URL(rawUrl, 'http://bloom.local')
  const path = url.searchParams.get('__path')
  if (path === null) return rawUrl
  url.searchParams.delete('__path')
  const qs = url.searchParams.toString()
  return `/api/${path}${qs ? `?${qs}` : ''}`
}

export default function handler(req, res) {
  req.url = restorePath(req.url)
  return boot()(req, res)
}
