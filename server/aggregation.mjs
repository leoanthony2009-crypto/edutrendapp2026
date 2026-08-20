import { scoreAnswer, schoolDay } from './pulse-logic.mjs'

/**
 * Anonymity-enforcing aggregation (Phase 5). The 20-voice threshold is
 * applied here, in the data layer — the UI only ever receives either an
 * aggregate that cleared the threshold or an explicit suppression marker.
 *
 * Small-cell / intersection protection: a filtered cell is released only if
 * BOTH the cell AND its complement within the same total meet the threshold,
 * so subtraction (total − subgroup) can never isolate a group below K.
 * Results are deterministic per (data, filter), so repeated queries add no
 * information.
 */
export const K_ANON = 20

export function suppressCell(cellN, totalN) {
  if (cellN < K_ANON) return true
  if (totalN !== null && totalN - cellN > 0 && totalN - cellN < K_ANON) return true
  return false
}

/** The eight Bloom pastoral domains ← student question themes. */
export const DOMAIN_MAP = {
  'Safety & peers': ['Safety', 'Peer treatment'],
  Belonging: ['Belonging'],
  'Trusted adults': ['Trusted adult'],
  'Emotional load': ['Stress'],
  Engagement: ['Attendance', 'Participation'],
  Learning: ['Learning'],
  'Voice & fairness': ['Voice', 'Fairness'],
  'Home context': ['Home'],
}

function questionIndex(banks) {
  const map = new Map()
  for (const bank of Object.values(banks)) for (const q of bank) map.set(q.id, q)
  return map
}

function loadBanks(db, schoolId) {
  const rows = db.prepare('SELECT role, bank_json FROM banks WHERE school_id = ?').all(schoolId)
  return Object.fromEntries(rows.map((r) => [r.role, JSON.parse(r.bank_json)]))
}

function studentRunsSince(db, schoolId, sinceDate, untilDate) {
  return db
    .prepare("SELECT user_id, date, score, responses_json FROM runs WHERE school_id = ? AND role = 'student' AND date >= ? AND date <= ?")
    .all(schoolId, sinceDate, untilDate)
}

function shiftDate(date, days) {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + days)
  return d.toISOString().slice(0, 10)
}

/**
 * Per-day pulse trend: mean run score across ALL roles' runs that day,
 * suppressed below K distinct voices. PNTS exclusion happened at scoring.
 */
export function pulseTrend(db, schoolId, days, today) {
  const since = shiftDate(today, -(days - 1))
  const rows = db
    .prepare(
      `SELECT date, COUNT(*) AS n, AVG(score) AS avg FROM runs
       WHERE school_id = ? AND date >= ? AND date <= ? AND score IS NOT NULL
       GROUP BY date ORDER BY date`
    )
    .all(schoolId, since, today)
  return rows.map((r) => ({
    date: r.date,
    voices: r.n,
    value: suppressCell(r.n, null) ? null : Math.round(r.avg),
  }))
}

/** Domain snapshot over a window, with delta vs the previous window. */
export function domainSnapshot(db, schoolId, today, windowDays = 7) {
  const banks = loadBanks(db, schoolId)
  const qIndex = questionIndex(banks)

  const windowStats = (from, to) => {
    const runs = studentRunsSince(db, schoolId, from, to)
    const perDomain = Object.fromEntries(Object.keys(DOMAIN_MAP).map((d) => [d, { values: [], users: new Set() }]))
    for (const run of runs) {
      for (const resp of JSON.parse(run.responses_json)) {
        const q = qIndex.get(resp.questionId)
        if (!q || typeof resp.value !== 'number') continue
        const v = scoreAnswer(q, resp.value)
        if (v === null) continue // PNTS / neutral / free text never contaminate
        for (const [domain, themes] of Object.entries(DOMAIN_MAP)) {
          if (themes.includes(q.theme)) {
            perDomain[domain].values.push(v)
            perDomain[domain].users.add(run.user_id)
          }
        }
      }
    }
    return perDomain
  }

  const current = windowStats(shiftDate(today, -(windowDays - 1)), today)
  const previous = windowStats(shiftDate(today, -(2 * windowDays - 1)), shiftDate(today, -windowDays))

  return Object.keys(DOMAIN_MAP).map((domain) => {
    const cur = current[domain]
    const prev = previous[domain]
    const n = cur.users.size
    if (suppressCell(n, null) || cur.values.length === 0) {
      return { domain, value: null, delta: null, voices: n, suppressed: true }
    }
    const value = Math.round((cur.values.reduce((s, v) => s + v, 0) / cur.values.length) * 100)
    let delta = null
    if (!suppressCell(prev.users.size, null) && prev.values.length > 0) {
      delta = value - Math.round((prev.values.reduce((s, v) => s + v, 0) / prev.values.length) * 100)
    }
    return { domain, value, delta, voices: n, suppressed: false }
  })
}

/** Participation: distinct student responders / enrolled students, per day. */
export function participation(db, schoolId, days, today) {
  const enrolled = db.prepare("SELECT COUNT(*) AS n FROM users WHERE school_id = ? AND role = 'student'").get(schoolId).n
  const since = shiftDate(today, -(days - 1))
  const rows = db
    .prepare(
      `SELECT date, COUNT(DISTINCT user_id) AS n FROM runs
       WHERE school_id = ? AND role = 'student' AND date >= ? AND date <= ? GROUP BY date ORDER BY date`
    )
    .all(schoolId, since, today)
  return rows.map((r) => ({ date: r.date, pct: enrolled ? Math.round((r.n / enrolled) * 100) : 0, voices: r.n }))
}

/**
 * Perception gap (safety): pupils' own reports (s-theme Safety, top-2 share)
 * vs staff belief (perception-flagged question, top-2 share). Pupil side
 * requires K=20; the staff side is a staff aggregate and uses the council's
 * n≥10 staff floor — both suppressed below their floors.
 */
export const K_STAFF = 10

export function perceptionGap(db, schoolId, today, windowDays = 14) {
  const banks = loadBanks(db, schoolId)
  const qIndex = questionIndex(banks)
  const since = shiftDate(today, -(windowDays - 1))

  const pupil = { top: 0, n: 0, users: new Set() }
  for (const run of studentRunsSince(db, schoolId, since, today)) {
    for (const resp of JSON.parse(run.responses_json)) {
      const q = qIndex.get(resp.questionId)
      if (!q || q.theme !== 'Safety' || typeof resp.value !== 'number') continue
      if (q.options?.[resp.value] === 'Prefer not to say') continue
      pupil.n += 1
      pupil.users.add(run.user_id)
      if (resp.value <= 1) pupil.top += 1
    }
  }

  const staff = { top: 0, n: 0, users: new Set() }
  const staffRuns = db
    .prepare("SELECT user_id, responses_json FROM runs WHERE school_id = ? AND role IN ('teacher','leader') AND date >= ? AND date <= ?")
    .all(schoolId, since, today)
  for (const run of staffRuns) {
    for (const resp of JSON.parse(run.responses_json)) {
      const q = qIndex.get(resp.questionId)
      if (!q?.perception || typeof resp.value !== 'number') continue
      staff.n += 1
      staff.users.add(run.user_id)
      if (resp.value <= 1) staff.top += 1
    }
  }

  return {
    pupil:
      pupil.users.size >= K_ANON && pupil.n > 0
        ? { pct: Math.round((pupil.top / pupil.n) * 100), voices: pupil.users.size, suppressed: false }
        : { pct: null, voices: pupil.users.size, suppressed: true },
    staff:
      staff.users.size >= K_STAFF && staff.n > 0
        ? { pct: Math.round((staff.top / staff.n) * 100), voices: staff.users.size, suppressed: false }
        : { pct: null, voices: staff.users.size, suppressed: true },
  }
}

/** Recurring attention themes = weakest unsuppressed domains, real values. */
export function attentionThemes(db, schoolId, today) {
  return domainSnapshot(db, schoolId, today, 7)
    .filter((d) => !d.suppressed)
    .sort((a, b) => a.value - b.value)
    .slice(0, 3)
    .map((d) => ({ label: d.domain, value: d.value, voices: d.voices }))
}

/**
 * Survey results with per-question suppression. `yearGroupFilter` (when the
 * survey targeted year groups) applies the cell+complement rule.
 */
export function surveyResults(db, survey, { yearGroupFilter = null } = {}) {
  const questions = JSON.parse(survey.questions_json)
  const all = db
    .prepare('SELECT sr.answers_json, sr.submitted_at, u.year_tier FROM survey_responses sr JOIN users u ON u.id = sr.user_id WHERE sr.survey_id = ?')
    .all(survey.id)
  const totalN = all.length
  let rows = all
  if (yearGroupFilter) {
    rows = all.filter((r) => r.year_tier === yearGroupFilter)
    if (suppressCell(rows.length, totalN)) {
      return { totalResponses: totalN, filtered: true, suppressed: true, voices: rows.length, questions: [] }
    }
  }
  const n = rows.length
  const suppressed = suppressCell(n, null)
  return {
    totalResponses: totalN,
    voices: n,
    filtered: Boolean(yearGroupFilter),
    suppressed,
    firstResponseAt: all.length ? all.map((r) => r.submitted_at).sort()[0] : null,
    lastResponseAt: all.length ? all.map((r) => r.submitted_at).sort().at(-1) : null,
    questions: suppressed
      ? []
      : questions.map((q) => {
          const answers = rows.map((r) => JSON.parse(r.answers_json)[q.id]).filter((v) => v !== undefined && v !== null && v !== '')
          if (q.options) {
            const counts = q.options.map((label, i) => ({
              label,
              count: answers.filter((v) => v === i).length,
            }))
            const answered = answers.length
            return {
              id: q.id,
              text: q.text,
              type: 'choice',
              answered,
              options: counts.map((c) => ({ ...c, pct: answered ? Math.round((c.count / answered) * 100) : 0 })),
            }
          }
          // Free text: individual quotes only at/after K responses (FIX 3a)
          return {
            id: q.id,
            text: q.text,
            type: 'free_text',
            answered: answers.length,
            quotes: n >= K_ANON ? answers.slice(0, 30).map((v) => String(v)) : [],
            quotesSuppressed: n < K_ANON,
          }
        }),
  }
}

/** Composite bundle for the Trends/Today screens. */
export function analyticsSummary(db, school, range) {
  const today = schoolDay(school.timezone)
  const days = range === 'term' ? 90 : range === '30d' ? 30 : 7
  const trend = pulseTrend(db, school.id, days, today)
  const trendToday = trend.find((t) => t.date === today)
  const totalVoicesToday = trendToday?.voices ?? 0
  return {
    range,
    today,
    trend,
    todayScore: trendToday?.value ?? null,
    todayVoices: totalVoicesToday,
    domains: domainSnapshot(db, school.id, today, 7),
    participation: participation(db, school.id, Math.min(days, 14), today),
    perceptionGap: perceptionGap(db, school.id, today),
    themes: attentionThemes(db, school.id, today),
    kAnon: K_ANON,
  }
}
