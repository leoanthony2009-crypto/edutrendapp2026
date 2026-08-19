/**
 * POUI survey-drafting guardrails (COUNCIL_FIXES FIX 3c). Deterministic,
 * local, explainable checks that run on every question — typed or drafted.
 * Findings are SUGGESTIONS: they never block launch, and any rewrite is
 * offered for one-tap acceptance, never applied silently.
 */

const LEADING_OPENERS = [
  "don't you agree",
  "don't you think",
  "wouldn't you say",
  "isn't it true",
  'do you agree that',
  'surely',
  "shouldn't we",
]

const LOADED_WORDS = ['unfortunately', 'sadly', 'terrible', 'awful', 'amazing', 'obviously', 'clearly', 'disgraceful', 'lazy', 'failing']

const VAGUE_FREQUENCY = ['often', 'sometimes', 'regularly', 'frequently', 'recently', 'usually']
const TIMEFRAMES = ['today', 'this week', 'this term', 'this month', 'yesterday', 'at break', 'this year']

const JARGON = ['synergy', 'stakeholder', 'pedagogy', 'differentiation', 'curricular', 'metacognition', 'summative', 'formative', 'slt', 'kpi']

const JUNIOR_HARD_WORDS = ['approximately', 'satisfactory', 'environment', 'communicate', 'collaborate', 'participation', 'perception', 'wellbeing', 'appropriate', 'sufficient']

const POSITIVE_WORDS = ['yes', 'always', 'mostly', 'good', 'great', 'fine', 'fully', 'looking forward', 'safe', 'fair', 'happy']
const NEGATIVE_WORDS = ['no', 'never', 'not', 'hardly', 'bad', 'barely', 'unsafe', 'unfair', 'unhappy', "don't"]

function words(text) {
  return String(text).trim().split(/\s+/).filter(Boolean)
}

export function checkQuestion(question, { audience = 'senior' } = {}) {
  const findings = []
  const text = String(question.text ?? '')
  const lower = text.toLowerCase()

  for (const opener of LEADING_OPENERS) {
    if (lower.includes(opener)) {
      findings.push({
        code: 'leading',
        message: `"${opener}…" invites agreement — a leading question shapes the answer.`,
        suggestion: { label: 'Make it neutral', text: text.replace(new RegExp(opener, 'i'), 'Do you think').replace(/\s+/g, ' ').trim() },
      })
      break
    }
  }

  // Double-barrelled: one question asking two things.
  const qMarks = (text.match(/\?/g) ?? []).length
  const andSplit = / and | as well as /i.test(text.replace(/\b(and|as well as)\b(?=[^?]*\()/g, ''))
  if (qMarks > 1 || (andSplit && words(text).length > 7)) {
    const parts = text.split(/ and | as well as /i).map((p) => p.trim().replace(/\?+$/, ''))
    findings.push({
      code: 'double_barrelled',
      message: 'This asks two things at once — answers will be ambiguous. Split it?',
      suggestion:
        parts.length >= 2
          ? { label: 'Split into two questions', split: [`${parts[0]}?`, `${parts.slice(1).join(' and ')}?`.replace(/^\w/, (c) => c.toUpperCase())] }
          : undefined,
    })
  }

  const loaded = LOADED_WORDS.filter((w) => lower.includes(w))
  if (loaded.length) {
    findings.push({ code: 'loaded', message: `Loaded wording (${loaded.join(', ')}) nudges the answer — plainer words read fairer.` })
  }

  const vague = VAGUE_FREQUENCY.filter((w) => new RegExp(`\\b${w}\\b`).test(lower))
  if (vague.length && !TIMEFRAMES.some((t) => lower.includes(t))) {
    findings.push({
      code: 'ambiguous',
      message: `"${vague[0]}" means different things to different pupils — anchor it to a timeframe (e.g. "this week").`,
    })
  }

  const jargon = JARGON.filter((w) => new RegExp(`\\b${w}\\b`).test(lower))
  if (jargon.length) {
    findings.push({ code: 'jargon', message: `Jargon (${jargon.join(', ')}) — pupils and parents may not share this vocabulary.` })
  }

  if (audience === 'junior') {
    const hard = JUNIOR_HARD_WORDS.filter((w) => lower.includes(w))
    if (hard.length) {
      findings.push({ code: 'age_inappropriate', message: `Hard words for younger pupils (${hard.join(', ')}) — try shorter, everyday words.` })
    }
  }

  if (words(text).length > 20) {
    findings.push({ code: 'too_long', message: `${words(text).length} words — under 20 keeps the two-minute contract honest.` })
  }

  const options = Array.isArray(question.options) ? question.options : null
  if (options) {
    const seen = new Set()
    for (const o of options) {
      const key = String(o).trim().toLowerCase()
      if (seen.has(key)) {
        findings.push({ code: 'overlapping_options', message: `Duplicate option "${o}" — every choice should be distinct.` })
        break
      }
      seen.add(key)
    }
    const overlaps = options.filter((a) => options.some((b) => a !== b && String(b).toLowerCase().startsWith(String(a).toLowerCase())))
    if (overlaps.length) {
      findings.push({ code: 'overlapping_options', message: `Options overlap (${overlaps.join(', ')}) — answers will blur across them.` })
    }
    const nonNeutral = options.filter((o) => o !== 'Prefer not to say')
    const pos = nonNeutral.filter((o) => POSITIVE_WORDS.some((w) => String(o).toLowerCase().includes(w))).length
    const neg = nonNeutral.filter((o) => NEGATIVE_WORDS.some((w) => String(o).toLowerCase().includes(w))).length
    if (pos > 0 && neg > 0 && Math.abs(pos - neg) >= 2) {
      findings.push({ code: 'unbalanced_scale', message: `Scale looks unbalanced (${pos} positive vs ${neg} negative options).` })
    }
  }

  return findings
}

export function checkSurvey(questions, { audience } = {}) {
  return questions.map((q) => ({ id: q.id, findings: checkQuestion(q, { audience }) }))
}

/* ── POUI drafting — curated fallback bank behind the AI adapter boundary ── */

const DRAFT_BANK = {
  safety: [
    { text: 'Did you feel safe at school this week?', options: ['Yes', 'Mostly', 'Not really', 'No', 'Prefer not to say'] },
    { text: 'Is there a place in school where you feel less safe?', options: ['No', 'One place', 'A few places', 'Prefer not to say'] },
    { text: 'If something felt unsafe, would you know who to tell?', options: ['Yes', 'Maybe', 'No'] },
  ],
  break: [
    { text: 'How does break time usually feel?', options: ['Good', 'Okay', 'Not great', 'I avoid it'] },
    { text: 'Is an adult easy to find at break time?', options: ['Yes', 'Sometimes', 'No'] },
    { text: 'What would make break time better?', options: null },
  ],
  homework: [
    { text: 'How heavy did homework feel this week?', options: ['Light', 'Okay', 'Heavy', 'Very heavy'] },
    { text: 'Did you have what you needed to do homework at home?', options: ['Yes', 'Mostly', 'Not really', 'No', 'Prefer not to say'] },
    { text: 'What would make homework more manageable?', options: null },
  ],
  belonging: [
    { text: 'Did you feel part of things at school this week?', options: ['Yes', 'Mostly', 'Not really', 'No'] },
    { text: 'Is there a group or activity where you feel you belong?', options: ['Yes', 'Sort of', 'No'] },
    { text: 'What would help you feel more at home here?', options: null },
  ],
  workload: [
    { text: 'How manageable was your workload this week?', options: ['Manageable', 'Mostly', 'Stretched', 'Overwhelmed'] },
    { text: 'What is one thing that would lighten the load?', options: null },
  ],
  general: [
    { text: 'How was this week, overall?', options: ['Good', 'Okay', 'Hard', 'Prefer not to say'] },
    { text: 'What is one thing we should keep doing?', options: null },
    { text: 'What is one thing we should change?', options: null },
  ],
}

export function draftQuestions({ topic = '', count = 3 } = {}) {
  const t = String(topic).toLowerCase()
  const key =
    Object.keys(DRAFT_BANK).find((k) => t.includes(k)) ??
    (t.includes('safe') ? 'safety' : t.includes('home') ? 'homework' : 'general')
  const bank = DRAFT_BANK[key]
  return bank.slice(0, Math.max(1, Math.min(count, bank.length))).map((q, i) => ({
    id: `poui-${key}-${i}`,
    text: q.text,
    options: q.options ? [...q.options] : null,
    source: 'poui-fallback',
  }))
}
