// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServer } from './helpers.mjs'

let s

beforeAll(async () => {
  s = await startServer()
})
afterAll(async () => {
  await s.close()
})

describe('authentication', () => {
  it('rejects invalid credentials', async () => {
    const res = await s.api('POST', '/api/auth/login', { body: { schoolCode: 'STJ', userCode: 'teacher', passcode: 'wrong' } })
    expect(res.status).toBe(401)
  })

  it('accepts valid credentials and serves identity from the session', async () => {
    const token = await s.login('STJ', 'teacher')
    const me = await s.api('GET', '/api/auth/me', { token })
    expect(me.status).toBe(200)
    expect(me.body.me.role).toBe('teacher')
    expect(me.body.me.isChampion).toBe(false)
    expect(me.body.me.school.code).toBe('STJ')
  })

  it('requires a session for protected routes', async () => {
    expect((await s.api('GET', '/api/pulse/today')).status).toBe(401)
  })

  it('logout invalidates the session', async () => {
    const token = await s.login('STJ', 'student')
    await s.api('POST', '/api/auth/logout', { token })
    expect((await s.api('GET', '/api/auth/me', { token })).status).toBe(401)
  })

  it('rejects state-changing requests without the client header (CSRF guard)', async () => {
    const res = await fetch(`${s.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ schoolCode: 'STJ', userCode: 'teacher', passcode: 'petal-teacher' }),
    })
    expect(res.status).toBe(403)
  })
})

describe('role authorization (server-side, not client state)', () => {
  it('students cannot open the Champion workspace API', async () => {
    const token = await s.login('STJ', 'student')
    expect((await s.api('GET', '/api/champion/overview', { token })).status).toBe(403)
  })

  it('teachers without isChampion cannot open the Champion workspace API', async () => {
    const token = await s.login('STJ', 'teacher')
    expect((await s.api('GET', '/api/champion/overview', { token })).status).toBe(403)
  })

  it('the Champion (isChampion leader) can open it', async () => {
    const token = await s.login('STJ', 'leader')
    const res = await s.api('GET', '/api/champion/overview', { token })
    expect(res.status).toBe(200)
    expect(Array.isArray(res.body.alerts)).toBe(true)
  })

  it('students cannot read or edit question banks', async () => {
    const token = await s.login('STJ', 'student')
    expect((await s.api('GET', '/api/banks/student', { token })).status).toBe(403)
    expect((await s.api('PUT', '/api/banks/student', { token, body: { bank: [] } })).status).toBe(403)
  })

  it('students cannot record One Child entries', async () => {
    const token = await s.login('STJ', 'student')
    const res = await s.api('POST', '/api/pulse/one-child', { token, body: { yearGroup: 'F2', handle: '099', notedFor: 'x' } })
    expect(res.status).toBe(403)
  })
})

describe('school tenancy isolation', () => {
  it('a champion from School B cannot read, acknowledge or close School A alerts by id', async () => {
    const stjTeacher = await s.login('STJ', 'teacher')
    const created = await s.api('POST', '/api/tell-a-leader', { token: stjTeacher, body: { note: 'STJ-only note' } })
    const alertId = created.body.alertId

    const hcrChampion = await s.login('HCR', 'leader')
    expect((await s.api('GET', `/api/champion/alerts/${alertId}/events`, { token: hcrChampion })).status).toBe(404)
    expect((await s.api('POST', `/api/champion/alerts/${alertId}/read`, { token: hcrChampion })).status).toBe(404)
    expect(
      (await s.api('POST', `/api/champion/alerts/${alertId}/close`, { token: hcrChampion, body: { outcome: 'no_further_action', note: 'x' } }))
        .status
    ).toBe(404)
  })

  it("School B's overview never contains School A alerts", async () => {
    const hcrChampion = await s.login('HCR', 'leader')
    const overview = await s.api('GET', '/api/champion/overview', { token: hcrChampion })
    expect(overview.body.alerts.every((a) => a.context !== 'STJ-only note')).toBe(true)
  })

  it('bank edits are scoped to the caller school, whatever the payload claims', async () => {
    const hcrTeacher = await s.login('HCR', 'teacher')
    await s.api('PUT', '/api/banks/teacher', {
      token: hcrTeacher,
      body: { bank: [{ id: 'hcr-only', text: 'HCR question', options: ['Yes', 'No'], mark: 'L', routesTo: ['SD'], theme: 'Voice', domain: 'wellness', type: 'single_select' }], schoolId: 'sch_stjoseph' },
    })
    const stjTeacher = await s.login('STJ', 'teacher')
    const stjBank = await s.api('GET', '/api/banks/teacher', { token: stjTeacher })
    expect(stjBank.body.bank.some((q) => q.id === 'hcr-only')).toBe(false)
  })
})

describe('sensitive data handling', () => {
  it('my-reports returns read state but never the disclosure text', async () => {
    const token = await s.login('STJ', 'teacher2')
    await s.api('POST', '/api/tell-a-leader', { token, body: { note: 'SENSITIVE disclosure content' } })
    const reports = await s.api('GET', '/api/my-reports', { token })
    expect(reports.status).toBe(200)
    expect(JSON.stringify(reports.body)).not.toContain('SENSITIVE disclosure content')
    expect(reports.body.reports.length).toBeGreaterThan(0)
    expect(reports.body.reports[0]).toHaveProperty('readAt')
  })
})
