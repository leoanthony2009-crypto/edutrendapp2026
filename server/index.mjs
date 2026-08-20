import { existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import express from 'express'
import { openDb } from './db.mjs'
import { createApp, escalateOverdueAlerts, seed } from './app.mjs'
import { createDevDeliveryAdapter } from './notify.mjs'

const db = openDb()
if (process.env.BLOOM_SEED === '1' || process.env.NODE_ENV !== 'production') seed(db)

const adapter = createDevDeliveryAdapter(db)
const app = createApp(db, { deliveryAdapter: adapter, ephemeral: (process.env.BLOOM_DB ?? '') === ':memory:' })

// Server-side 24h SLA monitoring — safeguarding never depends on the app
// being open (audit P0-3). Sweep every 5 minutes.
const SWEEP_MS = 5 * 60_000
setInterval(() => {
  try {
    escalateOverdueAlerts(db, adapter)
  } catch (err) {
    console.error('[bloom] SLA sweep failed', err)
  }
}, SWEEP_MS).unref()
escalateOverdueAlerts(db, adapter)

// Single-host deploy: when a production build exists, serve the SPA from the
// same origin as the API. That keeps the httpOnly SameSite=Lax session cookie
// first-party, so no CORS or cross-site cookie configuration is needed.
const dist = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'dist')
if (existsSync(dist)) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }))
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(join(dist, 'index.html')))
  console.log('[bloom] serving SPA from', dist)
}

const port = Number(process.env.PORT ?? 8787)
const host = process.env.HOST ?? '0.0.0.0'
app.listen(port, host, () => {
  console.log(`[bloom] listening on ${host}:${port}`)
})
