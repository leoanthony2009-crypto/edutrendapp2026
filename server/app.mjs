import express from 'express'
import { newId, resetForTests } from './db.mjs'
import {
  clearedSessionCookie,
  createSession,
  currentUser,
  destroySession,
  requireAuth,
  requireChampion,
  requireRole,
  sessionCookie,
  sessionToken,
  verifyPass,
} from './auth.mjs'
import { createDevDeliveryAdapter } from './notify.mjs'
import {
  activeQuestions,
  collateScore,
  dominantContext,
  pickFallbackMove,
  schoolDay,
  triageFreeText,
} from './pulse-logic.mjs'
import {
  acknowledgeAlert,
  closeAlert,
  createAlert,
  escalateOverdueAlerts,
  readAlert,
  recordOneChildEntry,
  watchlist,
} from './safeguarding.mjs'
import { seed } from './seed.mjs'
import { mountExtra } from './routes-extra.mjs'

const CHAMPION_OUTCOMES = ['spoke_with_pupil', 'parent_contact', 'safeguarding_referral', 'no_further_action']
const WATCH_ACTIONS = ['Reviewed', 'Parent contact', 'Safeguarding']

export function createApp(db, { deliveryAdapter, ephemeral = false } = {}) {
  const adapter = deliveryAdapter ?? createDevDeliveryAdapter(db, { quiet: process.env.NODE_ENV === 'test' })
  const app = express()

  // Some hosts — Vercel's Node runtime among them — parse the JSON body
  // before the request reaches Express and leave the stream consumed.
  // Running express.json() again then yields an empty body, which surfaces
  // as a bogus "credentials not recognised" rather than an obvious error.
  // Parse only when the body has not already been supplied.
  const parseJson = express.json({ limit: '256kb' })
  app.use((req, res, next) => {
    if (req.body !== undefined && req.body !== null) return next()
    parseJson(req, res, next)
  })

  // Light CSRF guard: state-changing requests must carry the app header
  // (SameSite=Lax cookies + this header block cross-site form/img requests).
  app.use((req, res, next) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method) && req.headers['x-bloom-client'] !== '1') {
      return res.status(403).json({ error: 'missing_client_header' })
    }
    next()
  })

  const auth = requireAuth(db)

  app.get('/api/health', (_req, res) => res.json({ ok: true }))

  /**
   * Public deployment facts. `ephemeral` is derived from the actual backing
   * store, so the client's "Demo build" banner follows the deployment's real
   * behaviour rather than a build-time flag someone could forget to set.
   */
  app.get('/api/meta', (_req, res) =>
    res.json({
      ephemeral: Boolean(ephemeral),
      schools: db.prepare('SELECT COUNT(*) AS n FROM schools').get().n,
      accounts: db.prepare('SELECT COUNT(*) AS n FROM users').get().n,
    })
  )

  /* ── Auth ── */

  // Brute-force guard: 10 failed attempts per account per 15 minutes.
  const failedLogins = new Map()
  const LOGIN_WINDOW_MS = 15 * 60_000
  const LOGIN_MAX_FAILS = 10

  app.post('/api/auth/login', (req, res) => {
    const { schoolCode, userCode, passcode } = req.body ?? {}
    const key = `${String(schoolCode ?? '').toUpperCase()}/${String(userCode ?? '').toLowerCase()}`
    const now = Date.now()
    const attempts = (failedLogins.get(key) ?? []).filter((t) => now - t < LOGIN_WINDOW_MS)
    if (attempts.length >= LOGIN_MAX_FAILS) {
      failedLogins.set(key, attempts)
      return res.status(429).json({ error: 'too_many_attempts' })
    }
    const user = db
      .prepare(
        `SELECT u.*, s.code AS school_code FROM users u JOIN schools s ON s.id = u.school_id
         WHERE s.code = ? AND u.code = ?`
      )
      .get(String(schoolCode ?? '').toUpperCase(), String(userCode ?? '').toLowerCase())
    if (!user || !verifyPass(passcode, user.pass_hash)) {
      failedLogins.set(key, [...attempts, now])
      return res.status(401).json({ error: 'invalid_credentials' })
    }
    failedLogins.delete(key)
    const { token, expiresAt } = createSession(db, user.id)
    res.setHeader('Set-Cookie', sessionCookie(token, expiresAt))
    const me = currentUser(db, { headers: { authorization: `Bearer ${token}` } })
    res.json({ me: publicMe(me), token })
  })

  app.post('/api/auth/logout', (req, res) => {
    const token = sessionToken(req)
    if (token) destroySession(db, token)
    res.setHeader('Set-Cookie', clearedSessionCookie())
    res.json({ ok: true })
  })

  app.get('/api/auth/me', (req, res) => {
    const me = currentUser(db, req)
    if (!me) return res.status(401).json({ error: 'not_authenticated' })
    res.json({ me: publicMe(me) })
  })

  function publicMe(me) {
    return {
      id: me.id,
      name: me.name,
      role: me.role,
      isChampion: me.isChampion,
      displayHandle: me.displayHandle,
      yearTier: me.yearTier,
      school: me.school,
    }
  }

  /* ── Question banks ── */

  function bankFor(schoolId, role) {
    const row = db.prepare('SELECT bank_json FROM banks WHERE school_id = ? AND role = ?').get(schoolId, role)
    return row ? JSON.parse(row.bank_json) : []
  }

  app.get('/api/banks/:role', auth, (req, res) => {
    const { role } = req.params
    if (!['student', 'teacher', 'leader'].includes(role)) return res.status(404).json({ error: 'unknown_bank' })
    // Students may not read staff banks; teachers/leaders read all.
    if (req.user.role === 'student') return res.status(403).json({ error: 'forbidden' })
    res.json({ role, bank: bankFor(req.user.schoolId, role) })
  })

  app.put('/api/banks/:role', auth, requireRole('teacher', 'leader'), (req, res) => {
    const { role } = req.params
    if (!['student', 'teacher', 'leader'].includes(role)) return res.status(404).json({ error: 'unknown_bank' })
    const bank = req.body?.bank
    if (!Array.isArray(bank) || bank.length > 50) return res.status(422).json({ error: 'invalid_bank' })
    for (const q of bank) {
      if (typeof q?.id !== 'string' || typeof q?.text !== 'string' || q.text.length > 300) {
        return res.status(422).json({ error: 'invalid_question' })
      }
      if (q.options !== undefined && q.options !== null && !Array.isArray(q.options)) {
        return res.status(422).json({ error: 'invalid_options' })
      }
    }
    db.prepare(
      'INSERT INTO banks (school_id, role, bank_json) VALUES (?, ?, ?) ON CONFLICT (school_id, role) DO UPDATE SET bank_json = excluded.bank_json'
    ).run(req.user.schoolId, role, JSON.stringify(bank))
    res.json({ ok: true })
  })

  /* ── Pulse ── */

  function questionsForToday(user, date) {
    const bank = bankFor(user.schoolId, user.role)
    const questions = activeQuestions(user.role, bank, date)
    if (user.role === 'student' && user.yearTier === 'junior') {
      return questions.map((q) => ({ ...q, text: q.juniorText ?? q.text }))
    }
    return questions
  }

  function runForDate(userId, date) {
    return db.prepare('SELECT * FROM runs WHERE user_id = ? AND date = ?').get(userId, date)
  }

  function pulsesCompleted(userId) {
    return db.prepare('SELECT COUNT(*) AS n FROM runs WHERE user_id = ?').get(userId).n
  }

  function computeStreak(userId, timezone, now = new Date()) {
    const dates = new Set(db.prepare('SELECT date FROM runs WHERE user_id = ?').all(userId).map((r) => r.date))
    let streak = 0
    let graceUsed = false
    const cursor = new Date(now)
    const today = schoolDay(timezone, cursor)
    if (!dates.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1) // today not yet counted against you
    for (let i = 0; i < 120; i++) {
      const day = schoolDay(timezone, cursor)
      const dow = new Date(`${day}T00:00:00Z`).getUTCDay()
      if (dow !== 0 && dow !== 6) {
        if (dates.has(day)) {
          streak += 1
        } else if (!graceUsed && streak > 0) {
          graceUsed = true // one quiet sick-day per term does not break the streak
        } else {
          break
        }
      }
      cursor.setUTCDate(cursor.getUTCDate() - 1)
    }
    return streak
  }

  function todayBundle(user) {
    const date = schoolDay(user.school.timezone)
    const questions = questionsForToday(user, date)
    const run = runForDate(user.id, date)
    const move = db.prepare('SELECT * FROM micro_moves WHERE user_id = ? AND date = ?').get(user.id, date)
    return {
      date,
      questions,
      run: run
        ? {
            score: run.score,
            submittedAt: run.submitted_at,
            answers: Object.fromEntries(JSON.parse(run.responses_json).map((r) => [r.questionId, r.value])),
          }
        : null,
      pulsesCompleted: pulsesCompleted(user.id),
      streak: computeStreak(user.id, user.school.timezone),
      microMove: move
        ? { text: move.text, reason: move.reason, source: move.source, tried: !!move.tried, saved: !!move.saved, helped: move.helped }
        : null,
    }
  }

  app.get('/api/pulse/today', auth, (req, res) => res.json(todayBundle(req.user)))

  app.post('/api/pulse/submit', auth, (req, res) => {
    const user = req.user
    const date = schoolDay(user.school.timezone)
    const questions = questionsForToday(user, date)
    if (questions.length === 0) return res.status(422).json({ error: 'empty_bank' })

    const raw = req.body?.answers ?? {}
    const answers = {}
    for (const q of questions) {
      const v = raw[q.id]
      if (v === undefined || v === null || v === '') continue
      if (q.options) {
        const idx = Number(v)
        if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) {
          return res.status(422).json({ error: 'invalid_answer', questionId: q.id })
        }
        answers[q.id] = idx
      } else {
        if (typeof v !== 'string' || v.length > 500) return res.status(422).json({ error: 'invalid_answer', questionId: q.id })
        answers[q.id] = v
      }
    }

    const previous = runForDate(user.id, date)
    const previousAnswers = previous
      ? Object.fromEntries(JSON.parse(previous.responses_json).map((r) => [r.questionId, r.value]))
      : {}

    const submittedAt = new Date().toISOString()
    const responses = questions
      .filter((q) => answers[q.id] !== undefined)
      .map((q) => ({ questionId: q.id, value: answers[q.id], mark: q.mark, submittedAt }))
    const score = collateScore(questions, answers)

    // Once per school-day per user, enforced by the UNIQUE(user_id, date)
    // constraint; a same-day resubmit is an edit of the same record.
    db.prepare(
      `INSERT INTO runs (id, school_id, user_id, role, date, score, responses_json, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (user_id, date) DO UPDATE SET score = excluded.score,
         responses_json = excluded.responses_json, submitted_at = excluded.submitted_at`
    ).run(newId('run'), user.schoolId, user.id, user.role, date, score, JSON.stringify(responses), submittedAt)

    // Champion routing (spec § 4.2/4.3) — only for new/changed free text, so a
    // same-day edit does not duplicate alerts.
    for (const q of questions) {
      const value = answers[q.id]
      if (typeof value !== 'string' || !value.trim()) continue
      if (previousAnswers[q.id] === value) continue
      const label = triageFreeText(value)
      if (q.triggersChampion || label === 'concerned' || label === 'alarmed') {
        createAlert(db, adapter, {
          schoolId: user.schoolId,
          createdBy: user.id,
          triggerType: 'free_text',
          context: value,
          marks: [q.mark],
        })
      }
    }

    // POUI micro-move for teachers (spec § 5) — Gemini adapter would slot in
    // here; the curated bank answers offline.
    if (user.role === 'teacher') {
      const freeText = Object.values(answers).filter((v) => typeof v === 'string').join(' ')
      const triage = triageFreeText(freeText)
      const { domain, mark } = dominantContext(questions, answers, false)
      const text = pickFallbackMove(domain, mark, triage)
      const reason = triage === 'routine' ? 'Suggested from your pulse today.' : 'Suggested because today felt heavy in your pulses.'
      db.prepare(
        `INSERT INTO micro_moves (user_id, date, text, reason, source, tried, saved)
         VALUES (?, ?, ?, ?, 'fallback', 0, 0)
         ON CONFLICT (user_id, date) DO UPDATE SET text = excluded.text, reason = excluded.reason`
      ).run(user.id, date, text, reason)
    }

    res.json(todayBundle(user))
  })

  app.get('/api/pulse/history', auth, (req, res) => {
    const rows = db
      .prepare('SELECT date, score, submitted_at FROM runs WHERE user_id = ? ORDER BY date DESC LIMIT 60')
      .all(req.user.id)
    res.json({ history: rows.map((r) => ({ date: r.date, score: r.score, submittedAt: r.submitted_at })), streak: computeStreak(req.user.id, req.user.school.timezone) })
  })

  app.post('/api/pulse/one-child', auth, requireRole('teacher', 'leader'), (req, res) => {
    try {
      const handle = recordOneChildEntry(db, adapter, req.user, req.body ?? {})
      res.json({ ok: true, pupilHandle: handle })
    } catch (err) {
      res.status(err.status ?? 500).json({ error: err.message })
    }
  })

  app.post('/api/pulse/micro-move', auth, requireRole('teacher'), (req, res) => {
    const date = schoolDay(req.user.school.timezone)
    const move = db.prepare('SELECT * FROM micro_moves WHERE user_id = ? AND date = ?').get(req.user.id, date)
    if (!move) return res.status(404).json({ error: 'no_move_today' })
    const { tried, saved, helped } = req.body ?? {}
    db.prepare('UPDATE micro_moves SET tried = ?, saved = ?, helped = ? WHERE user_id = ? AND date = ?').run(
      tried === undefined ? move.tried : tried ? 1 : 0,
      saved === undefined ? move.saved : saved ? 1 : 0,
      helped === undefined ? move.helped : String(helped),
      req.user.id,
      date
    )
    res.json({ ok: true })
  })

  /** Yesterday's tried-move follow-up ("Did it help?") — FIX 5. */
  app.get('/api/pulse/micro-move/followup', auth, requireRole('teacher'), (req, res) => {
    const today = schoolDay(req.user.school.timezone)
    const row = db
      .prepare(
        `SELECT date, text FROM micro_moves WHERE user_id = ? AND tried = 1 AND helped IS NULL AND date < ?
         ORDER BY date DESC LIMIT 1`
      )
      .get(req.user.id, today)
    res.json({ followup: row ?? null })
  })

  app.post('/api/pulse/micro-move/followup', auth, requireRole('teacher'), (req, res) => {
    const { date, helped } = req.body ?? {}
    if (!['Yes', 'A little', 'No'].includes(helped)) return res.status(422).json({ error: 'invalid_helped' })
    db.prepare('UPDATE micro_moves SET helped = ? WHERE user_id = ? AND date = ? AND tried = 1').run(helped, req.user.id, String(date))
    res.json({ ok: true })
  })

  /* ── Safeguarding ── */

  app.post('/api/tell-a-leader', auth, (req, res) => {
    const note = String(req.body?.note ?? '').trim()
    const alert = createAlert(db, adapter, {
      schoolId: req.user.schoolId,
      createdBy: req.user.id,
      triggerType: 'safeguarding',
      context: note || 'Safeguarding channel opened without a note.',
      marks: ['L'],
    })
    res.json({ ok: true, alertId: alert.id })
  })

  /** The sender's own reports with read-receipt state — never the note text. */
  app.get('/api/my-reports', auth, (req, res) => {
    const rows = db
      .prepare(
        `SELECT id, trigger_type, status, created_at, read_at FROM alerts
         WHERE school_id = ? AND created_by = ? ORDER BY created_at DESC LIMIT 20`
      )
      .all(req.user.schoolId, req.user.id)
    res.json({
      reports: rows.map((r) => ({
        id: r.id,
        triggerType: r.trigger_type,
        createdAt: r.created_at,
        readAt: r.read_at,
        status: r.status,
      })),
    })
  })

  app.get('/api/champion/overview', auth, requireChampion, (req, res) => {
    const alerts = db
      .prepare('SELECT * FROM alerts WHERE school_id = ? ORDER BY created_at DESC LIMIT 200')
      .all(req.user.schoolId)
    res.json({
      alerts: alerts.map(publicAlert),
      watchlist: watchlist(db, req.user.schoolId),
    })
  })

  function publicAlert(a) {
    return {
      id: a.id,
      triggerType: a.trigger_type,
      pupilHandle: a.pupil_handle,
      context: a.context,
      marks: JSON.parse(a.marks_json),
      status: a.status,
      createdAt: a.created_at,
      readByDeadline: a.read_by_deadline,
      readAt: a.read_at,
      outcome: a.outcome,
      outcomeNote: a.outcome_note,
      closedAt: a.closed_at,
      escalatedAt: a.escalated_at,
    }
  }

  app.get('/api/champion/alerts/:id/events', auth, requireChampion, (req, res) => {
    const alert = readAlert(db, req.params.id, { schoolId: req.user.schoolId, id: req.user.id }, { view: true })
    if (!alert) return res.status(404).json({ error: 'not_found' })
    const events = db
      .prepare('SELECT type, actor_id, data_json, created_at FROM alert_events WHERE alert_id = ? ORDER BY id')
      .all(req.params.id)
    res.json({ events: events.map((e) => ({ type: e.type, actorId: e.actor_id, data: JSON.parse(e.data_json), at: e.created_at })) })
  })

  app.post('/api/champion/alerts/:id/read', auth, requireChampion, (req, res) => {
    const alert = acknowledgeAlert(db, req.params.id, { schoolId: req.user.schoolId, id: req.user.id })
    if (!alert) return res.status(404).json({ error: 'not_found' })
    res.json({ alert: publicAlert(alert) })
  })

  app.post('/api/champion/alerts/:id/close', auth, requireChampion, (req, res) => {
    const { outcome, note } = req.body ?? {}
    if (!CHAMPION_OUTCOMES.includes(outcome)) return res.status(422).json({ error: 'invalid_outcome' })
    try {
      const alert = closeAlert(db, req.params.id, { schoolId: req.user.schoolId, id: req.user.id }, outcome, note)
      if (!alert) return res.status(404).json({ error: 'not_found' })
      res.json({ alert: publicAlert(alert) })
    } catch (err) {
      res.status(err.status ?? 500).json({ error: err.message })
    }
  })

  app.post('/api/champion/watchlist/:handle/action', auth, requireChampion, (req, res) => {
    const { action } = req.body ?? {}
    if (!WATCH_ACTIONS.includes(action)) return res.status(422).json({ error: 'invalid_action' })
    db.prepare('INSERT INTO watch_actions (school_id, pupil_handle, action, champion_id, created_at) VALUES (?, ?, ?, ?, ?)').run(
      req.user.schoolId,
      req.params.handle,
      action,
      req.user.id,
      new Date().toISOString()
    )
    res.json({ ok: true })
  })

  /* ── Preferences / feedback ── */

  app.get('/api/prefs', auth, (req, res) => {
    const row = db.prepare('SELECT bridge_digest FROM prefs WHERE user_id = ?').get(req.user.id)
    res.json({ bridgeDigest: row ? row.bridge_digest === 1 : true })
  })

  app.put('/api/prefs', auth, (req, res) => {
    const on = req.body?.bridgeDigest ? 1 : 0
    db.prepare('INSERT INTO prefs (user_id, bridge_digest) VALUES (?, ?) ON CONFLICT (user_id) DO UPDATE SET bridge_digest = ?').run(
      req.user.id,
      on,
      on
    )
    res.json({ ok: true })
  })

  app.post('/api/feedback', auth, (req, res) => {
    const text = String(req.body?.text ?? '').trim().slice(0, 2000)
    if (!text) return res.status(422).json({ error: 'empty_feedback' })
    db.prepare('INSERT INTO feedback (school_id, user_id, text, created_at) VALUES (?, ?, ?, ?)').run(
      req.user.schoolId,
      req.user.id,
      text,
      new Date().toISOString()
    )
    res.json({ ok: true })
  })

  /* ── Surveys, POUI drafting, analytics, feedback loop, BSC export ── */
  mountExtra(app, db, auth)

  /* ── Test hooks (only with BLOOM_TEST=1) ── */

  if (process.env.BLOOM_TEST === '1') {
    app.post('/api/test/reset', (req, res) => {
      resetForTests(db, (d) => seed(d, req.body?.now ? new Date(req.body.now) : new Date()))
      res.json({ ok: true })
    })
    app.post('/api/test/escalate-sweep', (req, res) => {
      const now = req.body?.now ? new Date(req.body.now) : new Date()
      const n = escalateOverdueAlerts(db, adapter, now)
      res.json({ escalated: n })
    })
  }

  return app
}

export { escalateOverdueAlerts, seed }
