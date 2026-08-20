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

export default function handler(req, res) {
  return boot()(req, res)
}
