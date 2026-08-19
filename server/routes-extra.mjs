import { newId } from './db.mjs'
import { requireRole } from './auth.mjs'
import { analyticsSummary, domainSnapshot, K_ANON, surveyResults } from './aggregation.mjs'
import { checkSurvey, draftQuestions } from './guardrails.mjs'
import { scoreAnswer, schoolDay } from './pulse-logic.mjs'
import { watchlist } from './safeguarding.mjs'

const AUDIENCES = ['My class', 'Whole school', 'Staff']

function shiftDate(date, days) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

export function mountExtra(app, db, auth) {
  /* ── POUI drafting assistance (suggestions only, never autonomous) ── */

  app.post('/api/poui/guardrails', auth, requireRole('teacher', 'leader'), (req, res) => {
    const { questions, audience } = req.body ?? {}
    if (!Array.isArray(questions)) return res.status(422).json({ error: 'invalid_questions' })
    res.json({ checks: checkSurvey(questions.slice(0, 50), { audience: audience === 'junior' ? 'junior' : 'senior' }) })
  })

  app.post('/api/poui/draft', auth, requireRole('teacher', 'leader'), (req, res) => {
    // AI adapter boundary: a Gemini-backed drafter slots in here; the
    // deterministic curated bank answers when it is unavailable.
    const { topic, count } = req.body ?? {}
    res.json({ suggestions: draftQuestions({ topic, count: Number(count) || 3 }), source: 'fallback' })
  })

  /* ── Survey lifecycle ── */

  function publicSurvey(s, counts = {}) {
    return {
      id: s.id,
      title: s.title,
      purpose: s.purpose,
      audience: s.audience,
      yearGroups: JSON.parse(s.year_groups_json),
      questions: JSON.parse(s.questions_json),
      status: s.status,
      tracker: s.tracker === 1,
      seriesId: s.series_id,
      closeDate: s.close_date,
      createdAt: s.created_at,
      launchedAt: s.launched_at,
      closedAt: s.closed_at,
      responses: counts[s.id] ?? 0,
    }
  }

  function surveyById(db, id, schoolId) {
    return db.prepare('SELECT * FROM surveys WHERE id = ? AND school_id = ?').get(id, schoolId)
  }

  /** Close any live survey whose close date has passed (lazy sweep). */
  function sweepClosures(schoolId, today) {
    db.prepare(
      "UPDATE surveys SET status = 'closed', closed_at = ? WHERE school_id = ? AND status = 'live' AND close_date IS NOT NULL AND close_date < ?"
    ).run(new Date().toISOString(), schoolId, today)
  }

  function eligibleForSurvey(user, s) {
    if (s.audience === 'Staff') return user.role === 'teacher' || user.role === 'leader'
    if (user.role !== 'student') return false
    const groups = JSON.parse(s.year_groups_json)
    if (groups.length > 0 && !groups.includes(user.yearTier)) return false
    return true
  }

  app.get('/api/surveys', auth, (req, res) => {
    const today = schoolDay(req.user.school.timezone)
    sweepClosures(req.user.schoolId, today)
    const countRows = db
      .prepare('SELECT survey_id, COUNT(*) AS n FROM survey_responses WHERE school_id = ? GROUP BY survey_id')
      .all(req.user.schoolId)
    const counts = Object.fromEntries(countRows.map((r) => [r.survey_id, r.n]))

    const mine =
      req.user.role === 'student'
        ? []
        : db
            .prepare('SELECT * FROM surveys WHERE school_id = ? AND owner_id = ? ORDER BY created_at DESC')
            .all(req.user.schoolId, req.user.id)
            .map((s) => publicSurvey(s, counts))

    const answered = new Set(
      db.prepare('SELECT survey_id FROM survey_responses WHERE user_id = ?').all(req.user.id).map((r) => r.survey_id)
    )
    const open = db
      .prepare("SELECT * FROM surveys WHERE school_id = ? AND status = 'live' ORDER BY launched_at DESC")
      .all(req.user.schoolId)
      .filter((s) => eligibleForSurvey(req.user, s))
      .map((s) => ({ ...publicSurvey(s, counts), answered: answered.has(s.id) }))

    res.json({ mine, open })
  })

  app.post('/api/surveys', auth, requireRole('teacher', 'leader'), (req, res) => {
    const { title, purpose, audience, yearGroups, questions, closeDate, tracker } = req.body ?? {}
    if (typeof title !== 'string' || !title.trim() || title.length > 120) return res.status(422).json({ error: 'invalid_title' })
    if (!AUDIENCES.includes(audience)) return res.status(422).json({ error: 'invalid_audience' })
    if (!Array.isArray(questions) || questions.length === 0 || questions.length > 20)
      return res.status(422).json({ error: 'invalid_questions' })
    for (const q of questions) {
      if (typeof q?.id !== 'string' || typeof q?.text !== 'string' || q.text.length > 300)
        return res.status(422).json({ error: 'invalid_question' })
    }
    const id = newId('svy')
    db.prepare(
      `INSERT INTO surveys (id, school_id, owner_id, title, purpose, audience, year_groups_json, questions_json, status, tracker, close_date, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?)`
    ).run(
      id,
      req.user.schoolId,
      req.user.id,
      title.trim(),
      String(purpose ?? '').slice(0, 400),
      audience,
      JSON.stringify(Array.isArray(yearGroups) ? yearGroups.filter((y) => ['junior', 'senior'].includes(y)) : []),
      JSON.stringify(questions),
      tracker ? 1 : 0,
      closeDate ?? null,
      new Date().toISOString()
    )
    const checks = checkSurvey(questions, { audience: 'senior' })
    res.json({ survey: publicSurvey(surveyById(db, id, req.user.schoolId)), checks })
  })

  app.patch('/api/surveys/:id', auth, requireRole('teacher', 'leader'), (req, res) => {
    const s = surveyById(db, req.params.id, req.user.schoolId)
    if (!s || s.owner_id !== req.user.id) return res.status(404).json({ error: 'not_found' })
    const body = req.body ?? {}

    if (body.status) {
      const allowed =
        (s.status === 'live' && ['paused', 'closed'].includes(body.status)) ||
        (s.status === 'paused' && ['live', 'closed'].includes(body.status))
      if (!allowed) return res.status(422).json({ error: 'invalid_transition' })
      db.prepare('UPDATE surveys SET status = ?, closed_at = ? WHERE id = ?').run(
        body.status,
        body.status === 'closed' ? new Date().toISOString() : s.closed_at,
        s.id
      )
      return res.json({ survey: publicSurvey(surveyById(db, s.id, req.user.schoolId)) })
    }

    if (s.status !== 'draft') return res.status(422).json({ error: 'only_drafts_editable' })
    const title = body.title !== undefined ? String(body.title).trim() : s.title
    const questions = body.questions !== undefined ? body.questions : JSON.parse(s.questions_json)
    if (!title || !Array.isArray(questions) || questions.length === 0) return res.status(422).json({ error: 'invalid_draft' })
    db.prepare(
      'UPDATE surveys SET title = ?, purpose = ?, audience = ?, year_groups_json = ?, questions_json = ?, close_date = ?, tracker = ? WHERE id = ?'
    ).run(
      title,
      body.purpose !== undefined ? String(body.purpose).slice(0, 400) : s.purpose,
      body.audience !== undefined && AUDIENCES.includes(body.audience) ? body.audience : s.audience,
      JSON.stringify(body.yearGroups ?? JSON.parse(s.year_groups_json)),
      JSON.stringify(questions),
      body.closeDate !== undefined ? body.closeDate : s.close_date,
      body.tracker !== undefined ? (body.tracker ? 1 : 0) : s.tracker,
      s.id
    )
    res.json({ survey: publicSurvey(surveyById(db, s.id, req.user.schoolId)) })
  })

  app.delete('/api/surveys/:id', auth, requireRole('teacher', 'leader'), (req, res) => {
    const s = surveyById(db, req.params.id, req.user.schoolId)
    if (!s || s.owner_id !== req.user.id) return res.status(404).json({ error: 'not_found' })
    if (!['draft', 'closed'].includes(s.status)) return res.status(422).json({ error: 'close_before_delete' })
    db.prepare('DELETE FROM survey_responses WHERE survey_id = ?').run(s.id)
    db.prepare('DELETE FROM surveys WHERE id = ?').run(s.id)
    res.json({ ok: true })
  })

  app.post('/api/surveys/:id/launch', auth, requireRole('teacher', 'leader'), (req, res) => {
    const s = surveyById(db, req.params.id, req.user.schoolId)
    if (!s || s.owner_id !== req.user.id) return res.status(404).json({ error: 'not_found' })
    if (s.status !== 'draft') return res.status(422).json({ error: 'not_a_draft' })
    const today = schoolDay(req.user.school.timezone)
    const closeDate = s.close_date ?? shiftDate(today, 7)
    db.prepare("UPDATE surveys SET status = 'live', launched_at = ?, close_date = ?, series_id = COALESCE(series_id, id) WHERE id = ?").run(
      new Date().toISOString(),
      closeDate,
      s.id
    )
    res.json({ survey: publicSurvey(surveyById(db, s.id, req.user.schoolId)) })
  })

  /** Tracker: duplicate a closed tracker survey into a fresh live round. */
  app.post('/api/surveys/:id/relaunch', auth, requireRole('teacher', 'leader'), (req, res) => {
    const s = surveyById(db, req.params.id, req.user.schoolId)
    if (!s || s.owner_id !== req.user.id) return res.status(404).json({ error: 'not_found' })
    if (s.tracker !== 1) return res.status(422).json({ error: 'not_a_tracker' })
    const today = schoolDay(req.user.school.timezone)
    const id = newId('svy')
    db.prepare(
      `INSERT INTO surveys (id, school_id, owner_id, title, purpose, audience, year_groups_json, questions_json, status, tracker, series_id, close_date, created_at, launched_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'live', 1, ?, ?, ?, ?)`
    ).run(
      id,
      s.school_id,
      s.owner_id,
      s.title,
      s.purpose,
      s.audience,
      s.year_groups_json,
      s.questions_json,
      s.series_id ?? s.id,
      shiftDate(today, 7),
      new Date().toISOString(),
      new Date().toISOString()
    )
    res.json({ survey: publicSurvey(surveyById(db, id, req.user.schoolId)) })
  })

  app.post('/api/surveys/:id/respond', auth, (req, res) => {
    const s = surveyById(db, req.params.id, req.user.schoolId)
    if (!s) return res.status(404).json({ error: 'not_found' })
    const today = schoolDay(req.user.school.timezone)
    sweepClosures(req.user.schoolId, today)
    const fresh = surveyById(db, s.id, req.user.schoolId)
    if (fresh.status !== 'live') return res.status(422).json({ error: 'not_open' })
    if (!eligibleForSurvey(req.user, fresh)) return res.status(403).json({ error: 'not_in_audience' })

    const questions = JSON.parse(fresh.questions_json)
    const raw = req.body?.answers ?? {}
    const answers = {}
    for (const q of questions) {
      const v = raw[q.id]
      if (v === undefined || v === null || v === '') continue
      if (q.options) {
        const idx = Number(v)
        if (!Number.isInteger(idx) || idx < 0 || idx >= q.options.length) return res.status(422).json({ error: 'invalid_answer' })
        answers[q.id] = idx
      } else {
        if (typeof v !== 'string' || v.length > 500) return res.status(422).json({ error: 'invalid_answer' })
        answers[q.id] = v
      }
    }
    try {
      db.prepare('INSERT INTO survey_responses (id, survey_id, school_id, user_id, answers_json, submitted_at) VALUES (?, ?, ?, ?, ?, ?)').run(
        newId('sres'),
        fresh.id,
        req.user.schoolId,
        req.user.id,
        JSON.stringify(answers),
        new Date().toISOString()
      )
    } catch (err) {
      if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'already_answered' })
      throw err
    }
    res.json({ ok: true })
  })

  app.get('/api/surveys/:id/results', auth, requireRole('teacher', 'leader'), (req, res) => {
    const s = surveyById(db, req.params.id, req.user.schoolId)
    if (!s) return res.status(404).json({ error: 'not_found' })
    if (s.owner_id !== req.user.id && req.user.role !== 'leader') return res.status(403).json({ error: 'forbidden' })
    const yearTier = ['junior', 'senior'].includes(req.query.yearTier) ? req.query.yearTier : null
    const results = surveyResults(db, s, { yearGroupFilter: yearTier })

    let seriesTrend = null
    if (s.tracker === 1 && s.series_id) {
      const rounds = db
        .prepare('SELECT * FROM surveys WHERE school_id = ? AND series_id = ? ORDER BY launched_at')
        .all(req.user.schoolId, s.series_id)
      if (rounds.length >= 2) {
        seriesTrend = rounds.map((round) => {
          const r = surveyResults(db, round)
          let positive = null
          if (!r.suppressed) {
            const shares = r.questions
              .filter((q) => q.type === 'choice' && q.answered > 0)
              .map((q) => {
                const top2 = q.options.slice(0, 2).reduce((sum, o) => sum + o.count, 0)
                return top2 / q.answered
              })
            positive = shares.length ? Math.round((shares.reduce((a, b) => a + b, 0) / shares.length) * 100) : null
          }
          return { launchedAt: round.launched_at, voices: r.voices, positive, suppressed: r.suppressed }
        })
      }
    }

    res.json({ survey: publicSurvey(s), results, seriesTrend, kAnon: K_ANON })
  })

  /* ── Analytics (real, suppressed) ── */

  app.get('/api/analytics/summary', auth, (req, res) => {
    const range = ['7d', '30d', 'term'].includes(req.query.range) ? req.query.range : '7d'
    res.json(analyticsSummary(db, { id: req.user.schoolId, timezone: req.user.school.timezone }, range))
  })

  /* ── Feedback loop: You said → We did + Weekly Bridge ── */

  app.get('/api/actions', auth, (req, res) => {
    const rows = db
      .prepare(
        `SELECT a.id, a.signal_summary, a.action_taken, a.created_at FROM school_actions a
         WHERE a.school_id = ? ORDER BY a.created_at DESC LIMIT 12`
      )
      .all(req.user.schoolId)
    res.json({ actions: rows.map((r) => ({ id: r.id, signal: r.signal_summary, action: r.action_taken, at: r.created_at })) })
  })

  app.post('/api/actions', auth, requireRole('leader'), (req, res) => {
    const signal = String(req.body?.signal ?? '').trim().slice(0, 200)
    const action = String(req.body?.action ?? '').trim().slice(0, 300)
    if (!signal || !action) return res.status(422).json({ error: 'signal_and_action_required' })
    db.prepare('INSERT INTO school_actions (id, school_id, leader_id, signal_summary, action_taken, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
      newId('act'),
      req.user.schoolId,
      req.user.id,
      signal,
      action,
      new Date().toISOString()
    )
    res.json({ ok: true })
  })

  app.get('/api/bridge/latest', auth, (req, res) => {
    const today = schoolDay(req.user.school.timezone)
    const weekStart = shiftDate(today, -6)
    const dow = new Date(`${today}T00:00:00Z`).getUTCDay()

    // Marks touched this week, school-wide (real rows)
    const runs = db
      .prepare('SELECT user_id, role, responses_json FROM runs WHERE school_id = ? AND date >= ? AND date <= ?')
      .all(req.user.schoolId, weekStart, today)
    const markCounts = { R: 0, L: 0, D: 0, SE: 0 }
    for (const run of runs) for (const r of JSON.parse(run.responses_json)) markCounts[r.mark] = (markCounts[r.mark] ?? 0) + 1
    const marksSorted = Object.entries(markCounts).sort((a, b) => a[1] - b[1])
    const MARK_LABELS = { R: 'Relating', L: 'Listening', D: 'Discerning', SE: 'Self-Emptying' }
    const hollow = MARK_LABELS[marksSorted[0][0]]
    const overflowing = MARK_LABELS[marksSorted.at(-1)[0]]

    if (req.user.role === 'leader') {
      const wl = watchlist(db, req.user.schoolId)
      const openAlerts = db.prepare("SELECT COUNT(*) AS n FROM alerts WHERE school_id = ? AND status = 'open'").get(req.user.schoolId).n
      const domains = domainSnapshot(db, req.user.schoolId, today, 7).filter((d) => !d.suppressed)
      const weakest = [...domains].sort((a, b) => a.value - b.value)[0]
      const strongest = [...domains].sort((a, b) => b.value - a.value)[0]
      return res.json({
        weekOf: weekStart,
        isFriday: dow === 5,
        version: 'leader',
        sections: [
          {
            title: 'SYNODAL READ OF THE WEEK',
            body: `${hollow} is currently hollow — fewest voices touched it this week. ${overflowing} is overflowing. ${runs.length} pulse${runs.length === 1 ? '' : 's'} collated.`,
          },
          {
            title: 'CHAMPION ATTENTION',
            body:
              wl.length === 0
                ? `No pupils currently meet the watchlist threshold. ${openAlerts} alert${openAlerts === 1 ? '' : 's'} awaiting a read.`
                : `${wl.map((r) => `${r.pupilHandle} — ${r.mentions} mentions across ${r.days} days (${r.staff} staff)`).join('; ')}. ${openAlerts} alert${openAlerts === 1 ? '' : 's'} awaiting a read.`,
          },
          {
            title: 'BSC IMPLICATION',
            body:
              domains.length === 0
                ? 'Domain signals are still gathering — below the 20-voice threshold this week.'
                : `${weakest.domain} is the week's weakest signal at ${weakest.value}/100; ${strongest.domain} is holding at ${strongest.value}/100. One small test beats one big plan.`,
          },
        ],
      })
    }

    // Teacher / student personal version
    const myRuns = db.prepare('SELECT responses_json FROM runs WHERE user_id = ? AND date >= ? AND date <= ?').all(req.user.id, weekStart, today)
    const myMarks = { R: 0, L: 0, D: 0, SE: 0 }
    for (const run of myRuns) for (const r of JSON.parse(run.responses_json)) myMarks[r.mark] = (myMarks[r.mark] ?? 0) + 1
    const myTop = Object.entries(myMarks).sort((a, b) => b[1] - a[1])[0]
    const mentions = db
      .prepare('SELECT COUNT(*) AS n FROM one_child WHERE submitted_by = ? AND submitted_at >= ?')
      .get(req.user.id, `${weekStart}T00:00:00.000Z`).n
    res.json({
      weekOf: weekStart,
      isFriday: dow === 5,
      version: 'teacher',
      sections: [
        {
          title: 'WHAT YOUR WEEK REVEALED',
          body: `You completed ${myRuns.length} pulse${myRuns.length === 1 ? '' : 's'} this week; the Mark you touched most was ${MARK_LABELS[myTop[0]]}. ${mentions ? `${mentions} One Child note${mentions === 1 ? '' : 's'} — handles, never names.` : 'Pupil mentions stay anonymised — handles, never names.'}`,
        },
        {
          title: 'WHAT NEXT WEEK MIGHT HOLD',
          body: 'Term pace is steady; keep the two-minute contract. One POUI move waits on your Today screen each morning.',
        },
        {
          title: 'ONE SENTENCE TO TAKE HOME',
          body: 'You showed up and said how it really was — that is the whole job of the Pulse.',
        },
      ],
    })
  })

  /* ── BSC export (spec § 7) — leader-only, computed from real aggregates ── */

  app.get('/api/bsc/export', auth, requireRole('leader'), (req, res) => {
    const today = schoolDay(req.user.school.timezone)
    const domains = domainSnapshot(db, req.user.schoolId, today, 7)
    const wl = watchlist(db, req.user.schoolId)
    const part = db
      .prepare("SELECT COUNT(DISTINCT user_id) AS n FROM runs WHERE school_id = ? AND role = 'student' AND date = ?")
      .get(req.user.schoolId, today).n
    const enrolled = db.prepare("SELECT COUNT(*) AS n FROM users WHERE school_id = ? AND role = 'student'").get(req.user.schoolId).n
    const PILLARS = {
      AE: ['Learning'],
      SD: ['Safety & peers', 'Belonging', 'Trusted adults', 'Emotional load'],
      TL: ['Voice & fairness', 'Engagement'],
      CS: ['Home context'],
    }
    res.json({
      schoolName: req.user.school.name,
      sdpCycle: '2025–2028',
      generatedAt: new Date().toISOString(),
      pulseStatus: {
        participationPct: enrolled ? Math.round((part / enrolled) * 100) : 0,
        onWatchlist: wl.length,
      },
      pillars: Object.entries(PILLARS).map(([pillar, names]) => {
        const values = domains.filter((d) => names.includes(d.domain) && !d.suppressed).map((d) => d.value)
        const avg = values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : null
        return {
          pillar,
          pulseFeed: {
            summary: avg === null ? 'Signal gathering — below the anonymity threshold this week.' : `Pulse signal ${avg}/100 this week.`,
            signal: avg === null ? 'gathering' : avg >= 70 ? 'lifting' : avg >= 55 ? 'steady' : 'needs attention',
          },
        }
      }),
      watchlist: wl.map((r) => ({ pupilHandle: r.pupilHandle, mentions: `${r.staff} staff · ${r.days} days`, status: r.action ?? 'Open' })),
    })
  })
}

export { scoreAnswer }
