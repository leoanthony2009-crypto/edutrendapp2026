// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServer } from './helpers.mjs'
import { createAlert } from '../safeguarding.mjs'

let s

beforeAll(async () => {
  s = await startServer()
})
afterAll(async () => {
  await s.close()
})

describe('safeguarding lifecycle (Gate 1)', () => {
  it('tell-a-leader → server record → assigned Champion → queue → ack → teacher receipt → disposition → note → closure → immutable audit', async () => {
    const teacher = await s.login('STJ', 'teacher')
    const created = await s.api('POST', '/api/tell-a-leader', { token: teacher, body: { note: 'Please check the F2 corridor at break' } })
    expect(created.status).toBe(200)
    const alertId = created.body.alertId

    // Assigned to the school's Champion, with a 24h deadline + notification
    const row = s.db.prepare('SELECT * FROM alerts WHERE id = ?').get(alertId)
    expect(row.assigned_to).toBeTruthy()
    expect(Date.parse(row.read_by_deadline) - Date.parse(row.created_at)).toBe(24 * 3_600_000)
    const delivered = s.db
      .prepare("SELECT * FROM notifications WHERE kind = 'champion_alert' AND user_id = ?")
      .all(row.assigned_to)
    expect(delivered.length).toBeGreaterThan(0)
    expect(delivered.every((n) => n.delivered_at)).toBe(true)

    // Champion sees it in the queue and acknowledges
    const champion = await s.login('STJ', 'leader')
    const overview = await s.api('GET', '/api/champion/overview', { token: champion })
    expect(overview.body.alerts.some((a) => a.id === alertId)).toBe(true)
    const acked = await s.api('POST', `/api/champion/alerts/${alertId}/read`, { token: champion })
    expect(acked.body.alert.status).toBe('reviewed')
    expect(acked.body.alert.readAt).toBeTruthy()

    // Teacher-facing read receipt (COUNCIL_FIXES FIX 1 acceptance)
    const reports = await s.api('GET', '/api/my-reports', { token: teacher })
    const mine = reports.body.reports.find((r) => r.id === alertId)
    expect(mine.readAt).toBeTruthy()

    // Closing requires a structured outcome + mandatory note
    const noNote = await s.api('POST', `/api/champion/alerts/${alertId}/close`, {
      token: champion,
      body: { outcome: 'parent_contact', note: '   ' },
    })
    expect(noNote.status).toBe(422)
    const closed = await s.api('POST', `/api/champion/alerts/${alertId}/close`, {
      token: champion,
      body: { outcome: 'parent_contact', note: 'Called home; check-in agreed for Friday' },
    })
    expect(closed.body.alert.status).toBe('actioned')
    expect(closed.body.alert.outcome).toBe('parent_contact')

    // Immutable audit history covers the full lifecycle
    const events = await s.api('GET', `/api/champion/alerts/${alertId}/events`, { token: champion })
    const types = events.body.events.map((e) => e.type)
    for (const expected of ['created', 'assigned', 'acknowledged', 'disposition', 'note_recorded', 'closed', 'viewed']) {
      expect(types).toContain(expected)
    }

    // Audit rows cannot be rewritten, even with raw database access
    expect(() => s.db.prepare("UPDATE alert_events SET type = 'tampered' WHERE alert_id = ?").run(alertId)).toThrow(/immutable/)
    expect(() => s.db.prepare('DELETE FROM alert_events WHERE alert_id = ?').run(alertId)).toThrow(/immutable/)
  })

  it('distress language in pulse free text raises an alert even when the question is not flagged', async () => {
    const teacher = await s.login('STJ', 'teacher3')
    const today = await s.api('GET', '/api/pulse/today', { token: teacher })
    const freeQ = today.body.questions.find((q) => !q.options && !q.triggersChampion)
    expect(freeQ).toBeTruthy()
    await s.api('POST', '/api/pulse/submit', { token: teacher, body: { answers: { [freeQ.id]: 'One pupil seems bullied and afraid at break' } } })
    const champion = await s.login('STJ', 'leader')
    const overview = await s.api('GET', '/api/champion/overview', { token: champion })
    expect(overview.body.alerts.some((a) => a.context.includes('bullied and afraid'))).toBe(true)
  })

  it('a same-day resubmission with unchanged free text does not duplicate alerts', async () => {
    const teacher = await s.login('STJ', 'teacher3')
    const before = s.db.prepare('SELECT COUNT(*) AS n FROM alerts').get().n
    const today = await s.api('GET', '/api/pulse/today', { token: teacher })
    const freeQ = today.body.questions.find((q) => !q.options && !q.triggersChampion)
    await s.api('POST', '/api/pulse/submit', { token: teacher, body: { answers: { [freeQ.id]: 'One pupil seems bullied and afraid at break' } } })
    expect(s.db.prepare('SELECT COUNT(*) AS n FROM alerts').get().n).toBe(before)
  })

  it('One Child pattern (2 staff / 5 days) fires exactly one pattern alert', async () => {
    const t1 = await s.login('STJ', 'teacher')
    const t2 = await s.login('STJ', 'teacher2')
    await s.api('POST', '/api/pulse/one-child', { token: t1, body: { yearGroup: 'F3', handle: '020', notedFor: 'quiet at lunch' } })
    let patterns = s.db.prepare("SELECT * FROM alerts WHERE trigger_type = 'pattern' AND pupil_handle = 'F3-020'").all()
    expect(patterns).toHaveLength(0)
    await s.api('POST', '/api/pulse/one-child', { token: t2, body: { yearGroup: 'F3', handle: '020', notedFor: 'missing homework' } })
    await s.api('POST', '/api/pulse/one-child', { token: t1, body: { yearGroup: 'F3', handle: '020', notedFor: 'again today' } })
    patterns = s.db.prepare("SELECT * FROM alerts WHERE trigger_type = 'pattern' AND pupil_handle = 'F3-020'").all()
    expect(patterns).toHaveLength(1)
  })

  it('rejects real names in One Child entries', async () => {
    const t1 = await s.login('STJ', 'teacher')
    const res = await s.api('POST', '/api/pulse/one-child', { token: t1, body: { yearGroup: 'F2', handle: 'Marcus', notedFor: 'x' } })
    expect(res.status).toBe(422)
  })
})

describe('24h SLA monitoring and escalation (server-side)', () => {
  it('escalates open alerts past deadline exactly once, with audit + leadership notification', async () => {
    const past = new Date(Date.now() - 30 * 3_600_000)
    const alert = createAlert(s.db, s.adapter, {
      schoolId: 'sch_stjoseph',
      createdBy: null,
      triggerType: 'safeguarding',
      context: 'aged alert for escalation test',
      marks: ['L'],
      now: past,
    })
    const swept = await s.api('POST', '/api/test/escalate-sweep', { body: { now: new Date().toISOString() } })
    expect(swept.status).toBe(200)
    expect(swept.body.escalated).toBeGreaterThanOrEqual(1)

    const row = s.db.prepare('SELECT * FROM alerts WHERE id = ?').get(alert.id)
    expect(row.escalated_at).toBeTruthy()
    const events = s.db.prepare("SELECT * FROM alert_events WHERE alert_id = ? AND type = 'escalated'").all(alert.id)
    expect(events).toHaveLength(1)
    const notes = s.db.prepare("SELECT * FROM notifications WHERE kind = 'champion_alert_overdue'").all()
    expect(notes.length).toBeGreaterThan(0)

    // Sweep again — no double escalation
    await s.api('POST', '/api/test/escalate-sweep', { body: { now: new Date().toISOString() } })
    expect(s.db.prepare("SELECT COUNT(*) AS n FROM alert_events WHERE alert_id = ? AND type = 'escalated'").get(alert.id).n).toBe(1)
  })
})

describe('once-daily pulse integrity', () => {
  it('a second same-day submission edits the same record; the counter never double-counts', async () => {
    const student = await s.login('STJ', 'student')
    const today = await s.api('GET', '/api/pulse/today', { token: student })
    const q = today.body.questions.find((x) => x.options)
    const first = await s.api('POST', '/api/pulse/submit', { token: student, body: { answers: { [q.id]: 0 } } })
    const after1 = first.body.pulsesCompleted
    const second = await s.api('POST', '/api/pulse/submit', { token: student, body: { answers: { [q.id]: 1 } } })
    expect(second.body.pulsesCompleted).toBe(after1)
    const rows = s.db.prepare("SELECT * FROM runs WHERE user_id = (SELECT id FROM users WHERE code = 'student' AND school_id = 'sch_stjoseph') AND date = ?").all(today.body.date)
    expect(rows).toHaveLength(1)
    expect(JSON.parse(rows[0].responses_json)[0].value).toBe(1)
  })

  it('rejects out-of-range answers', async () => {
    const student = await s.login('STJ', 'student')
    const today = await s.api('GET', '/api/pulse/today', { token: student })
    const q = today.body.questions.find((x) => x.options)
    const res = await s.api('POST', '/api/pulse/submit', { token: student, body: { answers: { [q.id]: 99 } } })
    expect(res.status).toBe(422)
  })
})
