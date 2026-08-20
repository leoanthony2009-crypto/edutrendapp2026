// @vitest-environment node
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { startServer } from './helpers.mjs'

let s
let owner

const QUESTIONS = [
  { id: 'q1', text: 'Do you feel safe at break time?', options: ['Yes', 'Mostly', 'Not really', 'No'] },
  { id: 'q2', text: 'Anything adults should know?', options: null },
]

async function createLaunched(extra = {}) {
  const created = await s.api('POST', '/api/surveys', {
    token: owner,
    body: { title: 'Test survey', audience: 'Whole school', questions: QUESTIONS, ...extra },
  })
  expect(created.status).toBe(200)
  const id = created.body.survey.id
  const launched = await s.api('POST', `/api/surveys/${id}/launch`, { token: owner })
  expect(launched.status).toBe(200)
  return launched.body.survey
}

async function respondAs(codes, surveyId, answer = 0, text = undefined) {
  for (const code of codes) {
    const token = await s.login('STJ', code)
    const res = await s.api('POST', `/api/surveys/${surveyId}/respond`, {
      token,
      body: { answers: { q1: answer, ...(text ? { q2: text } : {}) } },
    })
    expect(res.status).toBe(200)
  }
}

const STUDENT_CODES = ['student', ...Array.from({ length: 29 }, (_, i) => `s${String(i + 1).padStart(2, '0')}`)]
const SENIORS = STUDENT_CODES.filter((_, i) => ![6, 12, 18, 24].includes(i))
const JUNIORS = ['s06', 's12', 's18', 's24']

beforeAll(async () => {
  s = await startServer()
  owner = await s.login('STJ', 'teacher')
})
afterAll(async () => {
  await s.close()
})

describe('survey lifecycle', () => {
  it('draft → edit → launch → respond → close → delete', async () => {
    const created = await s.api('POST', '/api/surveys', {
      token: owner,
      body: { title: 'Draft one', audience: 'Whole school', questions: QUESTIONS },
    })
    const id = created.body.survey.id
    expect(created.body.survey.status).toBe('draft')

    const edited = await s.api('PATCH', `/api/surveys/${id}`, { token: owner, body: { title: 'Edited title' } })
    expect(edited.body.survey.title).toBe('Edited title')

    // Drafts collect no responses
    const student = await s.login('STJ', 'student')
    expect((await s.api('POST', `/api/surveys/${id}/respond`, { token: student, body: { answers: { q1: 0 } } })).status).toBe(422)

    const launched = await s.api('POST', `/api/surveys/${id}/launch`, { token: owner })
    expect(launched.body.survey.status).toBe('live')
    expect(launched.body.survey.closeDate).toBeTruthy() // default close date applied

    // Live surveys are not editable
    expect((await s.api('PATCH', `/api/surveys/${id}`, { token: owner, body: { title: 'nope' } })).status).toBe(422)

    expect((await s.api('POST', `/api/surveys/${id}/respond`, { token: student, body: { answers: { q1: 1 } } })).status).toBe(200)
    // Duplicate submission rejected
    expect((await s.api('POST', `/api/surveys/${id}/respond`, { token: student, body: { answers: { q1: 2 } } })).status).toBe(409)

    // Pause blocks responses; resume allows
    await s.api('PATCH', `/api/surveys/${id}`, { token: owner, body: { status: 'paused' } })
    const s2 = await s.login('STJ', 's01')
    expect((await s.api('POST', `/api/surveys/${id}/respond`, { token: s2, body: { answers: { q1: 0 } } })).status).toBe(422)
    await s.api('PATCH', `/api/surveys/${id}`, { token: owner, body: { status: 'live' } })
    expect((await s.api('POST', `/api/surveys/${id}/respond`, { token: s2, body: { answers: { q1: 0 } } })).status).toBe(200)

    // Close, then delete
    await s.api('PATCH', `/api/surveys/${id}`, { token: owner, body: { status: 'closed' } })
    expect((await s.api('POST', `/api/surveys/${id}/respond`, { token: s2, body: { answers: { q1: 0 } } })).status).toBe(422)
    expect((await s.api('DELETE', `/api/surveys/${id}`, { token: owner })).status).toBe(200)
  })

  it('a live survey past its close date closes automatically', async () => {
    const survey = await createLaunched()
    s.db.prepare("UPDATE surveys SET close_date = '2000-01-01' WHERE id = ?").run(survey.id)
    const list = await s.api('GET', '/api/surveys', { token: owner })
    const mine = list.body.mine.find((x) => x.id === survey.id)
    expect(mine.status).toBe('closed')
  })

  it('staff-audience surveys are not answerable by students', async () => {
    const staffSurvey = await createLaunched({ audience: 'Staff' })
    const student = await s.login('STJ', 'student')
    expect((await s.api('POST', `/api/surveys/${staffSurvey.id}/respond`, { token: student, body: { answers: { q1: 0 } } })).status).toBe(403)
  })

  it('cross-school: users cannot see or answer another school’s survey', async () => {
    const survey = await createLaunched()
    const hcr = await s.login('HCR', 's1')
    expect((await s.api('POST', `/api/surveys/${survey.id}/respond`, { token: hcr, body: { answers: { q1: 0 } } })).status).toBe(404)
    const hcrLeader = await s.login('HCR', 'leader')
    expect((await s.api('GET', `/api/surveys/${survey.id}/results`, { token: hcrLeader })).status).toBe(404)
  })

  it('results access: owner and same-school leader only', async () => {
    const survey = await createLaunched()
    const otherTeacher = await s.login('STJ', 'teacher2')
    expect((await s.api('GET', `/api/surveys/${survey.id}/results`, { token: otherTeacher })).status).toBe(403)
    const leader = await s.login('STJ', 'leader')
    expect((await s.api('GET', `/api/surveys/${survey.id}/results`, { token: leader })).status).toBe(200)
    const student = await s.login('STJ', 'student')
    expect((await s.api('GET', `/api/surveys/${survey.id}/results`, { token: student })).status).toBe(403)
  })
})

describe('20-voice anonymity threshold (Phase 5)', () => {
  it('n=19 suppressed → n=20 released → n=21 stays released; quotes gated the same way', async () => {
    const survey = await createLaunched()
    await respondAs(STUDENT_CODES.slice(0, 19), survey.id, 0, 'the corridor gets rowdy')
    let res = await s.api('GET', `/api/surveys/${survey.id}/results`, { token: owner })
    expect(res.body.results.voices).toBe(19)
    expect(res.body.results.suppressed).toBe(true)
    expect(res.body.results.questions).toEqual([])

    await respondAs([STUDENT_CODES[19]], survey.id, 1)
    res = await s.api('GET', `/api/surveys/${survey.id}/results`, { token: owner })
    expect(res.body.results.suppressed).toBe(false)
    const q1 = res.body.results.questions.find((q) => q.id === 'q1')
    expect(q1.answered).toBe(20)
    expect(q1.options.find((o) => o.label === 'Yes').count).toBe(19)
    const q2 = res.body.results.questions.find((q) => q.id === 'q2')
    expect(q2.quotesSuppressed).toBe(false)
    expect(q2.quotes.length).toBeGreaterThan(0)

    await respondAs([STUDENT_CODES[20]], survey.id, 2)
    res = await s.api('GET', `/api/surveys/${survey.id}/results`, { token: owner })
    expect(res.body.results.voices).toBe(21)
    expect(res.body.results.suppressed).toBe(false)
  })

  it('filtered cells: a subgroup below K is suppressed even when the total clears K', async () => {
    const survey = await createLaunched()
    await respondAs(SENIORS.slice(0, 20), survey.id, 0)
    await respondAs(JUNIORS.slice(0, 3), survey.id, 3)
    const junior = await s.api('GET', `/api/surveys/${survey.id}/results?yearTier=junior`, { token: owner })
    expect(junior.body.results.suppressed).toBe(true)
    expect(junior.body.results.questions).toEqual([])
  })

  it('complement protection: a cell meeting K is still suppressed when total−cell would isolate <K (subtraction attack)', async () => {
    const survey = await createLaunched()
    await respondAs(SENIORS.slice(0, 20), survey.id, 0) // 20 seniors
    await respondAs(JUNIORS.slice(0, 3), survey.id, 3) // 3 juniors → total 23
    const senior = await s.api('GET', `/api/surveys/${survey.id}/results?yearTier=senior`, { token: owner })
    // cell = 20 ≥ K, but complement = 3 < K → releasing it would expose juniors by subtraction
    expect(senior.body.results.suppressed).toBe(true)
  })

  it('repeated identical queries return identical results (no inference from re-querying)', async () => {
    const survey = await createLaunched()
    await respondAs(STUDENT_CODES.slice(0, 21), survey.id, 0)
    const a = await s.api('GET', `/api/surveys/${survey.id}/results`, { token: owner })
    const b = await s.api('GET', `/api/surveys/${survey.id}/results`, { token: owner })
    expect(a.body.results).toEqual(b.body.results)
  })
})

describe('tracker surveys', () => {
  it('relaunch creates a new round and results grow a series trend', async () => {
    const round1 = await createLaunched({ tracker: true })
    await respondAs(STUDENT_CODES.slice(0, 21), round1.id, 0)
    await s.api('PATCH', `/api/surveys/${round1.id}`, { token: owner, body: { status: 'closed' } })

    const relaunched = await s.api('POST', `/api/surveys/${round1.id}/relaunch`, { token: owner })
    expect(relaunched.status).toBe(200)
    const round2 = relaunched.body.survey
    expect(round2.seriesId).toBe(round1.id)
    await respondAs(STUDENT_CODES.slice(0, 21), round2.id, 2)

    const res = await s.api('GET', `/api/surveys/${round2.id}/results`, { token: owner })
    expect(res.body.seriesTrend).toHaveLength(2)
    expect(res.body.seriesTrend[0].positive).toBeGreaterThan(res.body.seriesTrend[1].positive)
  })
})

describe('POUI guardrails (suggestions, never blocking)', () => {
  it('flags leading, double-barrelled, ambiguous, overlapping and unbalanced questions', async () => {
    const res = await s.api('POST', '/api/poui/guardrails', {
      token: owner,
      body: {
        questions: [
          { id: 'a', text: "Don't you agree that homework is helpful?", options: ['Yes', 'No'] },
          { id: 'b', text: 'Do you feel safe at break and enjoy your lessons?', options: ['Yes', 'No'] },
          { id: 'c', text: 'Do you often feel tired?', options: ['Yes', 'No'] },
          { id: 'd', text: 'Pick one', options: ['Yes', 'Yes'] },
          { id: 'e', text: 'How were lessons?', options: ['Great', 'Good', 'Fine', 'Bad'] },
        ],
      },
    })
    const byId = Object.fromEntries(res.body.checks.map((c) => [c.id, c.findings.map((f) => f.code)]))
    expect(byId.a).toContain('leading')
    expect(byId.b).toContain('double_barrelled')
    expect(byId.c).toContain('ambiguous')
    expect(byId.d).toContain('overlapping_options')
    expect(byId.e).toContain('unbalanced_scale')
  })

  it('offers a split suggestion for double-barrelled questions', async () => {
    const res = await s.api('POST', '/api/poui/guardrails', {
      token: owner,
      body: { questions: [{ id: 'b', text: 'Do you feel safe at break and enjoy your lessons?', options: ['Yes', 'No'] }] },
    })
    const finding = res.body.checks[0].findings.find((f) => f.code === 'double_barrelled')
    expect(finding.suggestion.split).toHaveLength(2)
  })

  it('flags hard words for junior audiences only', async () => {
    const q = [{ id: 'j', text: 'Was participation satisfactory this week?', options: ['Yes', 'No'] }]
    const junior = await s.api('POST', '/api/poui/guardrails', { token: owner, body: { questions: q, audience: 'junior' } })
    expect(junior.body.checks[0].findings.map((f) => f.code)).toContain('age_inappropriate')
    const senior = await s.api('POST', '/api/poui/guardrails', { token: owner, body: { questions: q, audience: 'senior' } })
    expect(senior.body.checks[0].findings.map((f) => f.code)).not.toContain('age_inappropriate')
  })

  it('a flagged survey still launches — guardrails never block', async () => {
    const created = await s.api('POST', '/api/surveys', {
      token: owner,
      body: { title: 'Flawed but allowed', audience: 'Whole school', questions: [{ id: 'x', text: "Don't you agree school is great?", options: ['Yes', 'No'] }] },
    })
    expect(created.status).toBe(200)
    expect(created.body.checks[0].findings.length).toBeGreaterThan(0)
    const launched = await s.api('POST', `/api/surveys/${created.body.survey.id}/launch`, { token: owner })
    expect(launched.status).toBe(200)
  })

  it('drafts questions from the curated bank when the AI adapter is offline', async () => {
    const res = await s.api('POST', '/api/poui/draft', { token: owner, body: { topic: 'break time safety', count: 3 } })
    expect(res.body.suggestions.length).toBeGreaterThan(0)
    expect(res.body.source).toBe('fallback')
  })
})
