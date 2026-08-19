import { newId } from './db.mjs'
import { hashPass } from './auth.mjs'
import { DEFAULT_BANKS, activeQuestions, collateScore, schoolDay } from './pulse-logic.mjs'

/**
 * Deterministic demo seed: two schools so cross-tenant isolation is testable,
 * with enough real pupil runs at St Joseph's to clear the 20-voice anonymity
 * threshold and a small school (Holy Cross) that stays below it. Every number
 * the UI shows derives from these real rows — no fabricated aggregates.
 */

// Small deterministic PRNG so seeds are stable across runs.
function lcg(seed) {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 2 ** 32
  }
}

function hashCode(str) {
  let h = 2166136261
  for (const c of str) h = (h ^ c.charCodeAt(0)) * 16777619
  return h >>> 0
}

function pastWeekdays(timezone, count, now = new Date()) {
  const days = []
  const cursor = new Date(now)
  while (days.length < count) {
    const day = schoolDay(timezone, cursor)
    const dow = new Date(`${day}T00:00:00Z`).getUTCDay()
    if (dow !== 0 && dow !== 6) days.push(day)
    cursor.setUTCDate(cursor.getUTCDate() - 1)
  }
  return days.reverse()
}

function seedRun(db, school, user, date, rand) {
  const bank = DEFAULT_BANKS[user.role]
  const questions = activeQuestions(user.role, bank, date)
  const answers = {}
  const responses = []
  for (const q of questions) {
    if (q.options) {
      // Weighted toward positive answers, with a school-level mood offset.
      const mood = school.mood + (rand() - 0.5) * 0.4
      const scorable = q.options.length - (q.options.includes('Prefer not to say') ? 1 : 0)
      let idx
      if (q.scale) {
        idx = Math.min(scorable - 1, Math.max(0, Math.round((scorable - 1) * Math.min(1, Math.max(0, mood + rand() * 0.3)))))
      } else {
        const r = rand()
        idx = r < mood ? 0 : r < mood + 0.25 ? 1 : r < mood + 0.4 ? Math.min(2, scorable - 1) : scorable - 1
      }
      if (rand() < 0.04 && q.options.includes('Prefer not to say')) idx = q.options.indexOf('Prefer not to say')
      answers[q.id] = idx
      responses.push({ questionId: q.id, value: idx, mark: q.mark, submittedAt: `${date}T15:40:00.000Z` })
    } else if (rand() < 0.15) {
      const texts = ['long day but a good one', 'the fans in room 12 need looking at', 'more time for SBA please']
      const value = texts[Math.floor(rand() * texts.length)]
      answers[q.id] = value
      responses.push({ questionId: q.id, value, mark: q.mark, submittedAt: `${date}T15:40:00.000Z` })
    }
  }
  const score = collateScore(questions, answers)
  db.prepare(
    `INSERT OR IGNORE INTO runs (id, school_id, user_id, role, date, score, responses_json, submitted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(newId('run'), school.id, user.id, user.role, date, score, JSON.stringify(responses), `${date}T15:40:00.000Z`)
}

export function seed(db, now = new Date()) {
  const already = db.prepare('SELECT COUNT(*) AS n FROM schools').get()
  if (already.n > 0) return

  const insertSchool = db.prepare(
    `INSERT INTO schools (id, code, name, timezone, board, school_type, location) VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
  const insertUser = db.prepare(
    `INSERT INTO users (id, school_id, role, is_champion, name, display_handle, year_tier, code, pass_hash)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  )

  const stj = { id: 'sch_stjoseph', code: 'STJ', name: "St. Joseph's RC Secondary", timezone: 'America/Port_of_Spain', mood: 0.55 }
  const hcr = { id: 'sch_holycross', code: 'HCR', name: 'Holy Cross RC Primary', timezone: 'America/Port_of_Spain', mood: 0.6 }
  insertSchool.run(stj.id, stj.code, stj.name, stj.timezone, 'Catholic · CEBM', 'Secondary', 'Port of Spain')
  insertSchool.run(hcr.id, hcr.code, hcr.name, hcr.timezone, 'Catholic · CEBM', 'Primary', 'Arima')

  const mkUser = (school, role, opts) => {
    const id = newId('usr')
    insertUser.run(
      id,
      school.id,
      role,
      opts.isChampion ? 1 : 0,
      opts.name,
      opts.handle ?? null,
      opts.yearTier ?? 'senior',
      opts.code,
      hashPass(opts.pass ?? `petal-${opts.code}`)
    )
    return { id, role, school_id: school.id }
  }

  // St Joseph's — demo accounts named in the login screen
  const stjUsers = []
  const teacher = mkUser(stj, 'teacher', { name: 'M. Persaud', code: 'teacher', handle: 'Form teacher · Form 2' })
  const teacher2 = mkUser(stj, 'teacher', { name: 'R. Khan', code: 'teacher2', handle: 'Form teacher · Form 3' })
  const teacher3 = mkUser(stj, 'teacher', { name: 'S. Dominique', code: 'teacher3', handle: 'Form teacher · Form 1' })
  const leader = mkUser(stj, 'leader', { name: 'Sr. A. Joseph', code: 'leader', handle: 'Principal', isChampion: true })
  const student = mkUser(stj, 'student', { name: 'Student F2-104', code: 'student', handle: 'F2-104' })
  stjUsers.push(teacher, teacher2, teacher3, leader, student)
  const stjStudents = [student]
  for (let i = 1; i <= 29; i++) {
    stjStudents.push(
      mkUser(stj, 'student', {
        name: `Student F2-${String(104 + i).padStart(3, '0')}`,
        code: `s${String(i).padStart(2, '0')}`,
        handle: `F2-${String(104 + i).padStart(3, '0')}`,
        yearTier: i % 6 === 0 ? 'junior' : 'senior',
      })
    )
  }

  // Holy Cross — small school, stays under the 20-voice threshold
  mkUser(hcr, 'leader', { name: 'Fr. B. Alexis', code: 'leader', handle: 'Principal', isChampion: true })
  mkUser(hcr, 'teacher', { name: 'C. Mohammed', code: 'teacher', handle: 'Standard 4' })
  const hcrStudents = []
  for (let i = 1; i <= 6; i++) {
    hcrStudents.push(mkUser(hcr, 'student', { name: `Pupil S4-${i}`, code: `s${i}`, handle: `S4-0${i}`, yearTier: 'junior' }))
  }

  // Question banks per school (editable copies of the defaults)
  const insertBank = db.prepare('INSERT INTO banks (school_id, role, bank_json) VALUES (?, ?, ?)')
  for (const school of [stj, hcr]) {
    for (const role of ['student', 'teacher', 'leader']) {
      insertBank.run(school.id, role, JSON.stringify(DEFAULT_BANKS[role]))
    }
  }

  // Historic runs — 10 school days. Teacher M. Persaud gets exactly 9 runs so
  // the 10-pulse Survey Builder unlock is one pulse away (demoable), computed
  // from real rows rather than a seeded counter.
  const days = pastWeekdays(stj.timezone, 12, now)
  const today = schoolDay(stj.timezone, now)
  for (const [di, date] of days.entries()) {
    if (date === today) continue // today's activity belongs to real users
    for (const s of stjStudents) {
      const rand = lcg(hashCode(s.id + date))
      if (rand() < 0.82) seedRun(db, stj, s, date, rand)
    }
    if (di >= days.length - 10 && di < days.length - 1) {
      seedRun(db, stj, { ...teacher, role: 'teacher' }, date, lcg(hashCode(teacher.id + date)))
    }
    if (di % 2 === 0) seedRun(db, stj, { ...teacher2, role: 'teacher' }, date, lcg(hashCode(teacher2.id + date)))
    // Leader has a long-standing habit — builder unlocked from day one (demo)
    seedRun(db, stj, { ...leader, role: 'leader' }, date, lcg(hashCode(leader.id + date)))
    for (const s of hcrStudents) {
      const rand = lcg(hashCode(s.id + date))
      if (rand() < 0.7) seedRun(db, hcr, s, date, rand)
    }
  }

  // One Child pattern at St Joseph's: F2-073 noted by 3 staff across 4 days
  const oc = db.prepare(
    'INSERT INTO one_child (id, school_id, pupil_handle, year_group, noted_for, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )
  const ago = (d) => new Date(now.getTime() - d * 86_400_000).toISOString()
  oc.run(newId('oc'), stj.id, 'F2-073', 'F2', 'quiet all day, sat alone at lunch', teacher.id, ago(1))
  oc.run(newId('oc'), stj.id, 'F2-073', 'F2', 'homework missing again, seemed tired', teacher2.id, ago(2))
  oc.run(newId('oc'), stj.id, 'F2-073', 'F2', 'flinched when asked about home', teacher3.id, ago(4))

  // A seeded live survey with REAL response rows from seeded pupils
  const surveyId = newId('svy')
  const surveyQs = [
    { id: 'sq1', text: 'Do you feel safe at break time?', options: ['Yes', 'Mostly', 'Not really', 'No'] },
    { id: 'sq2', text: 'Where do you spend most of break?', options: ['Yard', 'Corridor', 'Classroom', 'Library'], neutral: true },
    { id: 'sq3', text: 'Is an adult easy to find at break?', options: ['Yes', 'Sometimes', 'No'] },
    { id: 'sq4', text: 'Anything about break time adults should know?', options: null },
  ]
  db.prepare(
    `INSERT INTO surveys (id, school_id, owner_id, title, purpose, audience, year_groups_json, questions_json, status, created_at, launched_at, close_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'live', ?, ?, ?)`
  ).run(
    surveyId,
    stj.id,
    leader.id,
    'Break-time supervision check',
    'Where does break time feel least safe, and why?',
    'Whole school',
    '[]',
    JSON.stringify(surveyQs),
    ago(9),
    ago(9),
    schoolDay(stj.timezone, new Date(now.getTime() + 5 * 86_400_000))
  )
  const sr = db.prepare(
    'INSERT INTO survey_responses (id, survey_id, school_id, user_id, answers_json, submitted_at) VALUES (?, ?, ?, ?, ?, ?)'
  )
  for (const [i, s] of stjStudents.slice(0, 23).entries()) {
    const rand = lcg(hashCode(s.id + surveyId))
    const answers = {
      sq1: rand() < 0.6 ? 0 : rand() < 0.6 ? 1 : rand() < 0.5 ? 2 : 3,
      sq2: Math.floor(rand() * 4),
      sq3: Math.floor(rand() * 3),
      ...(rand() < 0.3 ? { sq4: 'the back corridor gets rowdy' } : {}),
    }
    sr.run(newId('sres'), surveyId, stj.id, s.id, JSON.stringify(answers), ago(8 - (i % 7)))
  }

  // A first "You said → We did" action, so the loop is demonstrable
  db.prepare(
    'INSERT INTO school_actions (id, school_id, leader_id, signal_summary, action_taken, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(
    newId('act'),
    stj.id,
    leader.id,
    'You told us break time felt unsafe near the back corridor',
    'The library now opens at first break for Forms 2–3',
    ago(3)
  )
}
