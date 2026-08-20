// @vitest-environment node
/**
 * Serverless-host compatibility.
 *
 * Some hosts (Vercel's Node runtime among them) populate req.body before the
 * request reaches Express. These tests assert the app behaves correctly under
 * that condition.
 *
 * Honest scope note: these pass both with and without the guard in
 * server/app.mjs, because Express 5's json parser already tolerates a
 * pre-populated body. So this is a compatibility assertion, NOT a regression
 * test for a reproduced defect — the guard is defensive for hosts that also
 * consume the stream. The live login failure was diagnosed separately; do not
 * read a pass here as proof that a hosted deployment works.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openDb } from '../db.mjs'
import { createApp, seed } from '../app.mjs'
import { createDevDeliveryAdapter } from '../notify.mjs'

let baseUrl
let server

beforeAll(async () => {
  const db = openDb(':memory:')
  seed(db)
  const app = createApp(db, { deliveryAdapter: createDevDeliveryAdapter(db, { quiet: true }), ephemeral: true })

  // Emulate a host that pre-parses the body: populate req.body and end the
  // stream before Express sees the request.
  const wrapped = (req, res) => {
    if (req.headers['content-type']?.includes('application/json')) {
      const chunks = []
      req.on('data', (c) => chunks.push(c))
      req.on('end', () => {
        try {
          req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}')
        } catch {
          req.body = {}
        }
        app(req, res)
      })
      return
    }
    app(req, res)
  }

  const http = await import('node:http')
  server = http.createServer(wrapped)
  await new Promise((resolve) => server.listen(0, resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

afterAll(() => new Promise((resolve) => server.close(resolve)))

const post = (path, body) =>
  fetch(baseUrl + path, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-bloom-client': '1' },
    body: JSON.stringify(body),
  })

describe('host pre-parses the request body', () => {
  it('login still succeeds with correct credentials', async () => {
    const res = await post('/api/auth/login', { schoolCode: 'STJ', userCode: 'leader', passcode: 'petal-leader' })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.me.role).toBe('leader')
    expect(body.me.isChampion).toBe(true)
    expect(body.token).toBeTruthy()
  })

  it('still rejects wrong credentials with 401, not a hang or a 500', async () => {
    const res = await post('/api/auth/login', { schoolCode: 'STJ', userCode: 'leader', passcode: 'nope' })
    expect(res.status).toBe(401)
  })

  it('authenticated writes that carry a body still work', async () => {
    const login = await post('/api/auth/login', { schoolCode: 'STJ', userCode: 'teacher', passcode: 'petal-teacher' })
    const { token } = await login.json()
    const res = await fetch(`${baseUrl}/api/tell-a-leader`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-bloom-client': '1', authorization: `Bearer ${token}` },
      body: JSON.stringify({ note: 'pre-parsed body check' }),
    })
    expect(res.status).toBe(200)
    expect((await res.json()).alertId).toBeTruthy()
  })
})

describe('/api/meta reports deployment facts', () => {
  it('flags ephemeral storage so the demo banner is server-driven', async () => {
    const res = await fetch(`${baseUrl}/api/meta`)
    expect(res.status).toBe(200)
    const meta = await res.json()
    expect(meta.ephemeral).toBe(true)
    expect(meta.accounts).toBeGreaterThan(20)
  })
})

/**
 * Regression test for the deployed sign-in failure.
 *
 * Unlike the pre-parsed-body cases above, this one DOES reproduce a real,
 * observed defect. On the deployed build `/api/meta` returned JSON while
 * `/api/auth/login` returned a platform 404 before Express ran: Vercel had
 * inferred `api/[...path].mjs` as a single-segment dynamic route rather than
 * a catch-all. Routing is now an explicit vercel.json rewrite that hands the
 * real path over in `__path`, and restorePath puts it back.
 *
 * Deleting the `req.url = restorePath(req.url)` line in api/index.mjs makes
 * the multi-segment cases below fail.
 */
describe('vercel rewrite path restoration', () => {
  it('restores a multi-segment api path', async () => {
    const { restorePath } = await import('../../api/index.mjs')
    expect(restorePath('/api/index?__path=auth/login')).toBe('/api/auth/login')
    expect(restorePath('/api/index?__path=champion/alerts/alr_1/close')).toBe('/api/champion/alerts/alr_1/close')
  })

  it('restores a single-segment api path', async () => {
    const { restorePath } = await import('../../api/index.mjs')
    expect(restorePath('/api/index?__path=meta')).toBe('/api/meta')
  })

  it('preserves the caller query string alongside the restored path', async () => {
    const { restorePath } = await import('../../api/index.mjs')
    expect(restorePath('/api/index?__path=pulse/history&range=7d')).toBe('/api/pulse/history?range=7d')
  })

  it('passes through untouched when the host preserves the original url', async () => {
    const { restorePath } = await import('../../api/index.mjs')
    expect(restorePath('/api/auth/login')).toBe('/api/auth/login')
    expect(restorePath('/api/pulse/history?range=30d')).toBe('/api/pulse/history?range=30d')
  })

  it('routes a rewritten multi-segment login through Express end to end', async () => {
    const handler = (await import('../../api/index.mjs')).default
    const http = await import('node:http')
    const srv = http.createServer((req, res) => handler(req, res))
    await new Promise((r) => srv.listen(0, r))
    const url = `http://127.0.0.1:${srv.address().port}`
    try {
      // Exactly what the platform delivers after the rewrite fires.
      const res = await fetch(`${url}/api/index?__path=auth/login`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-bloom-client': '1' },
        body: JSON.stringify({ schoolCode: 'STJ', userCode: 'leader', passcode: 'petal-leader' }),
      })
      expect(res.status).toBe(200)
      expect((await res.json()).me.role).toBe('leader')
    } finally {
      await new Promise((r) => srv.close(r))
    }
  })
})
