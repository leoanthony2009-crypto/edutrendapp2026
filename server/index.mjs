import { openDb } from './db.mjs'
import { createApp, escalateOverdueAlerts, seed } from './app.mjs'
import { createDevDeliveryAdapter } from './notify.mjs'

const db = openDb()
if (process.env.BLOOM_SEED === '1' || process.env.NODE_ENV !== 'production') seed(db)

const adapter = createDevDeliveryAdapter(db)
const app = createApp(db, { deliveryAdapter: adapter })

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

const port = Number(process.env.PORT ?? 8787)
app.listen(port, () => {
  console.log(`[bloom] API listening on :${port}`)
})
