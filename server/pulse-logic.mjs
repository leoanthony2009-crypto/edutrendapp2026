/**
 * Server-side pulse logic — the single source of truth for question banks,
 * rotation, scoring, triage and micro-moves. Ported verbatim from the
 * previously client-side, unit-tested implementations (src/services) so the
 * audited behaviour is preserved; the client now only renders server output.
 */

export const PREFER_NOT_TO_SAY = 'Prefer not to say'

/* ── Question banks (README + PASTORAL_PULSE_SPEC). `juniorText` carries the
 *    Forms 1–2 / primary register variant (COUNCIL_FIXES FIX 5). ── */

export const STUDENT_QUESTIONS = [
  { id: 's1', theme: 'Safety', domain: 'wellness', type: 'single_select', text: 'Did you feel safe in school today?', juniorText: 'Did you feel safe today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'L', routesTo: ['SD'] },
  { id: 's2', theme: 'Belonging', domain: 'wellness', type: 'single_select', text: 'Did you feel like you belonged here today?', juniorText: 'Did you feel like you fit in today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'R', routesTo: ['SD'] },
  { id: 's3', theme: 'Trusted adult', domain: 'wellness', type: 'single_select', text: 'Is there an adult here you trust to talk to?', juniorText: 'Is there a grown-up here you can talk to?', options: ['Yes', 'Maybe', 'No'], mark: 'R', routesTo: ['SD'] },
  { id: 's4', theme: 'Voice', domain: 'wellness', type: 'single_select', text: 'Did you feel listened to today?', juniorText: 'Did someone listen to you today?', options: ['Yes', 'Sometimes', 'No'], mark: 'L', routesTo: ['SD'] },
  { id: 's5', theme: 'Fairness', domain: 'wellness', type: 'single_select', text: 'Were you treated fairly today?', juniorText: 'Were things fair for you today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'L', routesTo: ['SD', 'TL'] },
  { id: 's6', theme: 'Peer treatment', domain: 'wellness', type: 'single_select', text: 'Did another pupil make you feel unsafe or uncomfortable?', juniorText: 'Did another child make you feel bad or scared?', options: ['No', 'A little', 'Yes', PREFER_NOT_TO_SAY], mark: 'D', routesTo: ['SD'] },
  { id: 's7', theme: 'Stress', domain: 'wellness', type: 'single_select', text: 'How heavy did today feel?', juniorText: 'How did today feel?', options: ['Light', 'Okay', 'Heavy', 'Very heavy'], mark: 'SE', routesTo: ['SD'] },
  { id: 's8', theme: 'Learning', domain: 'curriculum', type: 'single_select', text: "Did today's lessons make sense to you?", juniorText: 'Did you understand your lessons today?', options: ['Mostly', 'Some', 'Hardly', 'Not at all'], mark: 'D', routesTo: ['AE'] },
  { id: 's9', theme: 'Attendance', domain: 'wellness', type: 'single_select', text: 'How do you feel about coming back tomorrow?', juniorText: 'Do you want to come to school tomorrow?', options: ['Looking forward', 'Okay', 'Unsure', "Don't want to"], mark: 'D', routesTo: ['SD'] },
  { id: 's10', theme: 'Home', domain: 'wellness', type: 'single_select', text: 'Is something outside school making learning harder right now?', juniorText: 'Is anything at home making school hard?', options: ['No', 'A little', 'Yes', PREFER_NOT_TO_SAY], mark: 'SE', routesTo: ['SD', 'CS'] },
  { id: 's11', theme: 'Participation', domain: 'curriculum', type: 'single_select', text: 'Did you get a fair chance to speak or ask for help today?', juniorText: 'Did you get a turn today?', options: ['Yes', 'Mostly', 'No'], mark: 'R', routesTo: ['SD', 'TL'] },
  { id: 's12', theme: 'Agency', domain: 'wellness', type: 'free_text', text: 'Is there something you wish adults here understood?', juniorText: 'Is there something you wish your teachers knew?', mark: 'L', routesTo: ['SD'], weekly: true, triggersChampion: true },
]

export const TEACHER_QUESTIONS = [
  { id: 't1', theme: 'SE', domain: 'infrastructure', type: 'scale', text: 'Was your classroom workable today (heat, light, space, supplies)?', options: ['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], scale: true, mark: 'SE', routesTo: ['CS'] },
  { id: 't2', theme: 'R', domain: 'wellness', type: 'one_word', text: 'How are you, in one word, today?', mark: 'R', routesTo: ['SD'] },
  { id: 't3', theme: 'D', domain: 'curriculum', type: 'scale', text: 'Did the lesson land?', options: ['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], scale: true, mark: 'D', routesTo: ['AE'] },
  { id: 't4', theme: 'R', domain: 'curriculum', type: 'free_text', text: 'Whose voice did you not hear today?', mark: 'R', routesTo: ['SD'] },
  { id: 't5', theme: 'L', domain: 'wellness', type: 'free_text', text: 'Did anything happen today that you would want a leader to know?', mark: 'L', routesTo: ['SD', 'TL'], triggersChampion: true },
  // Weekly staff perception question — pairs with pupil s1 to give the
  // perception gap a real staff-side denominator (audit: static gap replaced).
  { id: 't6', theme: 'L', domain: 'wellness', type: 'single_select', text: 'Do you believe pupils felt safe in school this week?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'L', routesTo: ['SD'], weekly: true, perception: 'safety_staff' },
]

export const LEADER_QUESTIONS = [
  { id: 'l1', theme: 'Attention', domain: 'wellness', type: 'single_select', text: 'What concern is taking the most leadership attention this week?', options: ['Safety', 'Attendance', 'Behaviour', 'Learning', 'Wellbeing', 'Staffing', 'Family engagement'], neutral: true, mark: 'D', routesTo: ['TL'] },
  { id: 'l2', theme: 'Visibility', domain: 'wellness', type: 'free_text', text: 'Where do you feel your team has the least visibility right now?', mark: 'L', routesTo: ['TL'] },
  { id: 'l3', theme: 'Response', domain: 'wellness', type: 'single_select', text: 'Are staff responding consistently when pupils raise concerns?', options: ['Yes', 'Mostly', 'Inconsistently', 'No'], mark: 'L', routesTo: ['SD', 'TL'] },
  { id: 'l4', theme: 'Barriers', domain: 'wellness', type: 'single_select', text: 'What is preventing earlier pastoral intervention?', options: ['Time', 'Information', 'Staffing', 'Confidence', 'Communication', 'Unclear responsibility'], neutral: true, mark: 'SE', routesTo: ['TL'] },
  { id: 'l5', theme: 'Action', domain: 'wellness', type: 'free_text', text: 'What is one thing pupils are telling us that needs a leadership response this week?', mark: 'R', routesTo: ['TL'] },
]

export const DEFAULT_BANKS = { student: STUDENT_QUESTIONS, teacher: TEACHER_QUESTIONS, leader: LEADER_QUESTIONS }

/* ── Scoring (positive-first, PNTS + neutral excluded) — ported verbatim ── */

export function scoreAnswer(question, optionIndex) {
  if (!question.options || question.neutral) return null
  const picked = question.options[optionIndex]
  if (picked === undefined || picked === PREFER_NOT_TO_SAY) return null
  const scorable = question.options.filter((o) => o !== PREFER_NOT_TO_SAY)
  const steps = scorable.length - 1
  if (steps <= 0) return null
  const idx = scorable.indexOf(picked)
  const value = question.scale ? idx / steps : (steps - idx) / steps
  return Math.max(0, Math.min(1, value))
}

export function collateScore(questions, answers) {
  const values = []
  for (const q of questions) {
    const a = answers[q.id]
    if (typeof a !== 'number') continue
    const v = scoreAnswer(q, a)
    if (v !== null) values.push(v)
  }
  if (values.length === 0) return null
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100)
}

/* ── Rotation (date-string seeded; server clock + school timezone) ── */

export const DAILY_QUESTION_COUNT = 4

export function dateSeed(date) {
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000)
}

export function isFriday(date) {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 5
}

export function activeQuestions(role, bank, date) {
  if (role !== 'student') {
    // Teacher/leader weekly questions join on Fridays only.
    return bank.filter((q) => !q.weekly || isFriday(date))
  }
  if (bank.length <= 5) return bank
  const daily = bank.filter((q) => !q.weekly)
  const weekly = bank.filter((q) => q.weekly)
  if (daily.length === 0) return weekly.slice(0, 1)
  const seed = dateSeed(date)
  const start = (seed * 3) % daily.length
  const rotated = daily.slice(start).concat(daily.slice(0, start))
  const friday = isFriday(date) && weekly.length > 0
  if (friday) return rotated.slice(0, DAILY_QUESTION_COUNT).concat(weekly[0])
  return rotated.slice(0, DAILY_QUESTION_COUNT + 1)
}

/** Today's date (YYYY-MM-DD) in the school's configured IANA timezone. */
export function schoolDay(timezone, now = new Date()) {
  const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' })
  return fmt.format(now) // en-CA yields YYYY-MM-DD
}

/* ── Free-text triage (spec § 4.3) — conservative keyword heuristic; the
 *    Gemini adapter can replace classify() without touching callers. ── */

const ALARMED = ['abuse', 'abused', 'hurt me', 'hurting me', 'hit me', 'hits me', 'touched', 'self-harm', 'harm myself', 'suicide', 'kill', 'weapon', 'unsafe at home', 'scared to go home']
const CONCERNED = ['unsafe', 'afraid', 'scared', 'hungry', 'no food', 'neglect', 'withdrawn', 'crying', 'bullied', 'bullying', 'threatened', 'alone', 'no one to talk', 'distress', 'missing school', 'bruise']
const NOTICING = ['tired', 'worried', 'worry', 'quiet', 'stress', 'stressed', 'heavy', 'struggling', 'overwhelmed', 'anxious', 'down']

export function triageFreeText(text) {
  const t = String(text ?? '').toLowerCase()
  if (!t.trim()) return 'routine'
  if (ALARMED.some((k) => t.includes(k))) return 'alarmed'
  if (CONCERNED.some((k) => t.includes(k))) return 'concerned'
  if (NOTICING.some((k) => t.includes(k))) return 'noticing'
  return 'routine'
}

export function looksLikeRealName(s) {
  return /^[A-Z][a-z]{2,}(\s[A-Z][a-z]{2,})?$/.test(String(s ?? '').trim())
}

/* ── POUI micro-move fallback bank (spec § 5.2) ── */

export const FALLBACK_MICRO_MOVES = [
  { domain: 'wellness', mark: 'R', triage: 'routine', text: 'Greet three pupils by name at the door tomorrow — the quiet ones first.' },
  { domain: 'wellness', mark: 'R', triage: 'noticing', text: "Tomorrow's first ten minutes — water, windows, a song they choose. Mark a register before, not after." },
  { domain: 'wellness', mark: 'R', triage: 'concerned', text: 'Sit near, not across — two quiet minutes beside the child before the bell. Your Champion has been told.' },
  { domain: 'wellness', mark: 'R', triage: 'alarmed', text: 'Stay warm and ordinary with the class tomorrow; the Champion has been told and carries it from here.' },
  { domain: 'wellness', mark: 'L', triage: 'routine', text: 'End one class with "what should I know that I didn\'t ask?" — then just listen.' },
  { domain: 'wellness', mark: 'L', triage: 'noticing', text: 'Pick one pupil you have not really heard this week and give them the first question tomorrow.' },
  { domain: 'wellness', mark: 'L', triage: 'concerned', text: 'Keep tomorrow light — one check-in, no digging. Your Champion reads your note within 24 hours.' },
  { domain: 'wellness', mark: 'L', triage: 'alarmed', text: 'Nothing extra tomorrow — hold the routine steady. The Champion has been told.' },
  { domain: 'wellness', mark: 'D', triage: 'routine', text: 'Name one thing that went right today and tell the class it was them.' },
  { domain: 'wellness', mark: 'D', triage: 'noticing', text: 'Watch break time from the gallery for five minutes — see where the energy pools and where it drains.' },
  { domain: 'wellness', mark: 'D', triage: 'concerned', text: 'Note what you saw in One Child before it fades; the Champion picks it up from there.' },
  { domain: 'wellness', mark: 'SE', triage: 'routine', text: 'Leave on time one day this week — the marking will meet you tomorrow.' },
  { domain: 'wellness', mark: 'SE', triage: 'noticing', text: 'Hand one small job to a pupil who needs to be needed — the register, the windows, the chalk.' },
  { domain: 'wellness', mark: 'SE', triage: 'concerned', text: 'Tomorrow, do less on purpose — one lesson at walking pace. You carried plenty today.' },
  { domain: 'curriculum', mark: 'D', triage: 'routine', text: '20-minute Friday team-teach. Same problem, two approaches, ten-minute debrief.' },
  { domain: 'curriculum', mark: 'D', triage: 'noticing', text: 'Reteach the one idea that slid — five minutes, different door in: a story, a sketch, a lime.' },
  { domain: 'curriculum', mark: 'D', triage: 'concerned', text: 'Park the pace for a day — one small win the whole class can feel. The rest will keep.' },
  { domain: 'curriculum', mark: 'R', triage: 'routine', text: 'Cold-call kindly tomorrow — two pupils who never raise a hand, questions they can land.' },
  { domain: 'curriculum', mark: 'R', triage: 'noticing', text: 'Pair the quiet one with a steady friend for the first task — voice grows in small rooms.' },
  { domain: 'curriculum', mark: 'SE', triage: 'routine', text: 'What you changed mid-lesson today — write it on a sticky, share it in the staffroom. That was craft, not improvising.' },
  { domain: 'curriculum', mark: 'SE', triage: 'noticing', text: "Borrow, don't build: ask one colleague for the resource you were about to make from scratch tonight." },
  { domain: 'infrastructure', mark: 'SE', triage: 'routine', text: 'The thing you keep fixing quietly — log it once, today, before you fix it again.' },
  { domain: 'infrastructure', mark: 'SE', triage: 'noticing', text: 'Open the windows before the class arrives and claim the coolest half-hour for the hardest work.' },
  { domain: 'infrastructure', mark: 'SE', triage: 'concerned', text: "Report the broken thing today — in writing, once — and let it be someone else's to carry." },
  { domain: 'infrastructure', mark: 'L', triage: 'routine', text: 'Ask the class what one thing about the room makes work hardest — then move that one thing.' },
  { domain: 'one_child', mark: 'D', triage: 'routine', text: 'Find one ordinary moment tomorrow to let that child feel seen — a nod, their name, their work held up.' },
  { domain: 'one_child', mark: 'D', triage: 'noticing', text: 'Give that child a small responsibility tomorrow morning — belonging often starts with being needed.' },
  { domain: 'one_child', mark: 'D', triage: 'concerned', text: 'Keep tomorrow gentle and predictable for them. Your Champion has been told and reads it within 24 hours.' },
  { domain: 'one_child', mark: 'D', triage: 'alarmed', text: 'Hold the routine, stay kind, write nothing on paper that names them. The Champion has been told.' },
]

export function pickFallbackMove(domain, mark, triage) {
  const bank = FALLBACK_MICRO_MOVES
  return (
    bank.find((m) => m.domain === domain && m.mark === mark && m.triage === triage) ??
    bank.find((m) => m.domain === domain && m.mark === mark) ??
    bank.find((m) => m.mark === mark && m.triage === triage) ??
    bank.find((m) => m.domain === domain) ??
    bank[0]
  ).text
}

/** Choose the dominant (domain, mark) context of a submitted run. */
export function dominantContext(questions, answers, hasOneChild) {
  if (hasOneChild) return { domain: 'one_child', mark: 'D' }
  const counts = new Map()
  for (const q of questions) {
    if (answers[q.id] === undefined || answers[q.id] === '') continue
    const key = `${q.domain}|${q.mark}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let best = 'wellness|R'
  let bestCount = 0
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key
      bestCount = count
    }
  }
  const [domain, mark] = best.split('|')
  return { domain, mark }
}
