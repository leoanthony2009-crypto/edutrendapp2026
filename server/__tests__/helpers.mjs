import { openDb } from '../db.mjs'
import { createApp, seed } from '../app.mjs'
import { createDevDeliveryAdapter } from '../notify.mjs'

/** Boot a real API server on an ephemeral port with an in-memory database. */
export async function startServer({ now } = {}) {
  const db = openDb(':memory:')
  seed(db, now ?? new Date())
  const adapter = createDevDeliveryAdapter(db, { quiet: true })
  const app = createApp(db, { deliveryAdapter: adapter })
  const server = await new Promise((resolve) => {
    const s = app.listen(0, () => resolve(s))
  })
  const baseUrl = `http://127.0.0.1:${server.address().port}`

  const api = async (method, path, { token, body } = {}) => {
    const res = await fetch(baseUrl + path, {
      method,
      headers: {
        'content-type': 'application/json',
        'x-bloom-client': '1',
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    let json = null
    try {
      json = await res.json()
    } catch {
      /* non-JSON */
    }
    return { status: res.status, body: json }
  }

  const login = async (schoolCode, userCode, passcode = `petal-${userCode}`) => {
    const res = await api('POST', '/api/auth/login', { body: { schoolCode, userCode, passcode } })
    if (res.status !== 200) throw new Error(`login failed for ${schoolCode}/${userCode}: ${res.status}`)
    return res.body.token
  }

  return {
    db,
    adapter,
    baseUrl,
    api,
    login,
    close: () => new Promise((resolve) => server.close(resolve)),
  }
}
