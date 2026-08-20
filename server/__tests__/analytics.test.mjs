// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { openDb, newId } from '../db.mjs'
import { seed } from '../app.mjs'
import { domainSnapshot, participation, perceptionGap, pulseTrend, suppressCell, K_ANON } from '../aggregation.mjs'
import { schoolDay, scoreAnswer, STUDENT_QUESTIONS, TEACHER_QUESTIONS } from '../pulse-logic.mjs'
import { startServer } from './helpers.mjs'

const TZ = 'America/Port_of_Spain'
const SCHOOL = 'sch_stjoseph'

let db
let today

/** Insert a synthetic student run with explicit responses. */
function insertRun(db, userId, date, responses, questions) {
  const answers = Object.fromEntries(responses.map((r) => [r.questionId, r.value]))
  const values = []
  for (const q of questions) {
    if (typeof answers[q.id] !== 'number') continue
    const v = scoreAnswer(q, answers[q.id])
    if (v !== null) values.push(v)
  }
  const score = values.length ? Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 100) : null
  db.prepare(
    `INSERT OR REPLACE INTO runs (id, school_id, user_id, role, date, score, responses_json, submitted_at)
     VALUES (?, ?, ?, 'student', ?, ?, ?, ?)`
  ).run(newId('run'), SCHOOL, userId, date, score, JSON.stringify(responses), `${date}T15:00:00.000Z`)
  return score
}

beforeAll(() => {
  db = openDb(':memory:')
  seed(db)
  today = schoolDay(TZ)
})
afterAll(() => db.close())

describe('suppression rule', () => {
  it('applies the K=20 threshold and complement protection', () => {
    expect(suppressCell(19, null)).toBe(true)
    expect(suppressCell(20, null)).toBe(false)
    expect(suppressCell(21, null)).toBe(false)
    expect(suppressCell(20, 23)).toBe(true) // complement 3 < K → subtraction attack
    expect(suppressCell(20, 40)).toBe(false)
    expect(suppressCell(20, 20)).toBe(false) // no remainder to isolate
  })
})

describe('pulse trend (traced to raw rows)', () => {
  it('matches an independent recomputation from the runs table', () => {
    const trend = pulseTrend(db, SCHOOL, 7, today)
    for (const point of trend) {
      const raw = db
        .prepare('SELECT score FROM runs WHERE school_id = ? AND date = ? AND score IS NOT NULL')
        .all(SCHOOL, point.date)
      expect(point.voices).toBe(raw.length)
      if (raw.length < K_ANON) {
        expect(point.value).toBeNull()
      } else {
        const expected = Math.round(raw.reduce((s, r) => s + r.score, 0) / raw.length)
        expect(point.value).toBe(expected)
      }
    }
  })

  it('suppresses a day with fewer than 20 voices', () => {
    const hcrTrend = pulseTrend(db, 'sch_holycross', 7, today)
    // Holy Cross seeds ≤6 pupils — every point must be suppressed
    for (const point of hcrTrend) expect(point.value).toBeNull()
  })
})

describe('Prefer-not-to-say through the full aggregation pipeline', () => {
  it('PNTS answers change no domain value and no trend value', () => {
    const local = openDb(':memory:')
    seed(local)
    const users = local.prepare("SELECT id FROM users WHERE school_id = ? AND role = 'student'").all(SCHOOL)
    const q6 = STUDENT_QUESTIONS.find((q) => q.id === 's6') // has PNTS
    const q1 = STUDENT_QUESTIONS.find((q) => q.id === 's1')
    const date = today

    // 25 pupils answer q1 positively; 20 of them add a PNTS on q6
    for (const [i, u] of users.slice(0, 25).entries()) {
      const responses = [{ questionId: 's1', value: 0, mark: q1.mark, submittedAt: `${date}T15:00:00.000Z` }]
      if (i < 20) responses.push({ questionId: 's6', value: q6.options.indexOf('Prefer not to say'), mark: q6.mark, submittedAt: `${date}T15:00:00.000Z` })
      insertRun(local, u.id, date, responses, STUDENT_QUESTIONS)
    }

    const domains = domainSnapshot(local, SCHOOL, date, 1)
    const safety = domains.find((d) => d.domain === 'Safety & peers')
    // s1 is best-option for all 25 → 100; the 20 PNTS answers on s6 must not drag it
    expect(safety.suppressed).toBe(false)
    expect(safety.value).toBe(100)

    const trendPoint = pulseTrend(local, SCHOOL, 1, date).find((p) => p.date === date)
    expect(trendPoint.value).toBe(100)
    local.close()
  })
})

describe('perception gap (real calculation, both floors)', () => {
  it('computes pupil vs staff top-2 shares and applies K floors', () => {
    const local = openDb(':memory:')
    seed(local)
    const date = schoolDay(TZ)
    const students = local.prepare("SELECT id FROM users WHERE school_id = ? AND role = 'student'").all(SCHOOL)
    const q1 = STUDENT_QUESTIONS.find((q) => q.id === 's1')
    // 24 pupils: 18 top-2 (12 Yes + 6 Mostly), 6 bottom → 75%
    for (const [i, u] of students.slice(0, 24).entries()) {
      const value = i < 12 ? 0 : i < 18 ? 1 : 3
      insertRun(local, u.id, date, [{ questionId: 's1', value, mark: q1.mark, submittedAt: `${date}T15:00:00.000Z` }], STUDENT_QUESTIONS)
    }
    // Staff side under the n≥10 floor → suppressed
    let gap = perceptionGap(local, SCHOOL, date, 1)
    expect(gap.pupil.suppressed).toBe(false)
    expect(gap.pupil.pct).toBe(75)
    expect(gap.staff.suppressed).toBe(true)

    // Add 10 synthetic staff perception answers: 8 top-2 → 80%
    const t6 = TEACHER_QUESTIONS.find((q) => q.id === 't6')
    for (let i = 0; i < 10; i++) {
      const id = newId('usr')
      local
        .prepare(
          "INSERT INTO users (id, school_id, role, is_champion, name, code, pass_hash, year_tier) VALUES (?, ?, 'teacher', 0, ?, ?, 'x', 'senior')"
        )
        .run(id, SCHOOL, `T${i}`, `tx${i}`)
      local
        .prepare(
          `INSERT INTO runs (id, school_id, user_id, role, date, score, responses_json, submitted_at)
           VALUES (?, ?, ?, 'teacher', ?, NULL, ?, ?)`
        )
        .run(
          newId('run'),
          SCHOOL,
          id,
          date,
          JSON.stringify([{ questionId: 't6', value: i < 8 ? 0 : 3, mark: t6.mark, submittedAt: `${date}T15:00:00.000Z` }]),
          `${date}T15:00:00.000Z`
        )
    }
    gap = perceptionGap(local, SCHOOL, date, 1)
    expect(gap.staff.suppressed).toBe(false)
    expect(gap.staff.pct).toBe(80)
    local.close()
  })
})

describe('participation', () => {
  it('is distinct responders over enrolled students', () => {
    const rows = participation(db, SCHOOL, 7, today)
    const enrolled = db.prepare("SELECT COUNT(*) AS n FROM users WHERE school_id = ? AND role = 'student'").get(SCHOOL).n
    for (const r of rows) {
      const distinct = db
        .prepare("SELECT COUNT(DISTINCT user_id) AS n FROM runs WHERE school_id = ? AND role = 'student' AND date = ?")
        .get(SCHOOL, r.date).n
      expect(r.pct).toBe(Math.round((distinct / enrolled) * 100))
    }
  })
})

describe('analytics API access', () => {
  it('every role can read their school summary; values are real and suppressed correctly', async () => {
    const s = await startServer()
    try {
      const token = await s.login('STJ', 'student')
      const res = await s.api('GET', '/api/analytics/summary?range=7d', { token })
      expect(res.status).toBe(200)
      expect(res.body.kAnon).toBe(20)
      for (const d of res.body.domains) {
        if (d.suppressed) expect(d.value).toBeNull()
        else expect(d.voices).toBeGreaterThanOrEqual(20)
      }
      // Small school: everything suppressed rather than exposed
      const hcrToken = await s.login('HCR', 'leader')
      const hcrRes = await s.api('GET', '/api/analytics/summary?range=7d', { token: hcrToken })
      expect(hcrRes.body.domains.every((d) => d.suppressed)).toBe(true)
      expect(hcrRes.body.perceptionGap.pupil.suppressed).toBe(true)
    } finally {
      await s.close()
    }
  })
})
