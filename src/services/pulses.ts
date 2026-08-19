import { DEFAULT_BANKS } from '../data/questionBanks'
import type { PulseQuestion, PulseResponse, PulseSubmission, Role, TriageLabel } from '../types/pulse'
import { queueAlert } from './champion'
import { enqueue } from './offlineQueue'
import { generateMicroMove } from './poui'
import { rotateStudentBank } from './rotation'
import { scoreRun } from './scoring'
import { storage } from './storage'
import { SCHOOL_CONFIG, dateKey, isoNow, schoolWeekday, weekKey } from './time'
import { triageFreeText } from './triage'

/* Pulse orchestration: question banks, the day's rotated set, submissions,
   the pulsesCompleted unlock counter, and downstream consequences (triage →
   Champion alerts, POUI micro-move, trend collation). */

const BANKS_KEY = 'banks'
const SUBMISSIONS_KEY = 'submissions'
const COUNTERS_KEY = 'pulsesCompleted'
const STREAK_KEY = 'streak'

// ---------- Question banks (editable by teacher/leader) ----------

export function getBank(role: Role): PulseQuestion[] {
  const banks = storage.get<Record<Role, PulseQuestion[]>>(BANKS_KEY)
  return banks?.[role] ?? DEFAULT_BANKS[role]
}

export function saveBank(role: Role, questions: PulseQuestion[]): void {
  const banks = storage.get<Record<Role, PulseQuestion[]>>(BANKS_KEY) ?? { ...DEFAULT_BANKS }
  storage.set(BANKS_KEY, { ...banks, [role]: questions })
}

/** The set served in today's carousel for a role. */
export function getTodayQuestions(role: Role): PulseQuestion[] {
  const bank = getBank(role)
  if (role !== 'student') return bank
  return rotateStudentBank(bank, SCHOOL_CONFIG.schoolId, dateKey(), schoolWeekday())
}

// ---------- Submissions (one per period: daily; leaders weekly) ----------

/** Students and teachers pulse daily; the Leader Pulse is weekly. */
export function periodKey(role: Role): string {
  return role === 'leader' ? weekKey() : dateKey()
}

type SubmissionMap = Record<string, PulseSubmission>

function submissionId(role: Role): string {
  return `${role}:${periodKey(role)}`
}

export function getCurrentSubmission(role: Role): PulseSubmission | null {
  const map = storage.get<SubmissionMap>(SUBMISSIONS_KEY) ?? {}
  return map[submissionId(role)] ?? null
}

export interface SubmitResult {
  submission: PulseSubmission
  triage: TriageLabel
  championAlerted: boolean
}

export async function submitPulse(
  role: Role,
  questions: PulseQuestion[],
  answers: Record<string, string | number>,
): Promise<SubmitResult> {
  const now = isoNow()
  const responses: PulseResponse[] = questions
    .filter((q) => answers[q.id] !== undefined && answers[q.id] !== '')
    .map((q) => ({ questionId: q.id, value: answers[q.id], mark: q.mark, submittedAt: now }))

  const map = storage.get<SubmissionMap>(SUBMISSIONS_KEY) ?? {}
  const id = submissionId(role)
  const isFirstOfPeriod = !map[id]

  const submission: PulseSubmission = {
    id,
    role,
    date: dateKey(),
    responses,
    score: scoreRun(questions, answers),
    submittedAt: now,
  }
  storage.set(SUBMISSIONS_KEY, { ...map, [id]: submission })
  enqueue('pulseSubmission', submission)

  // Free-text triage: distress language alerts the Champion even on questions
  // not flagged triggersChampion (PASTORAL_PULSE_SPEC § 4.3).
  let worst: TriageLabel = 'routine'
  let championAlerted = false
  const rank: TriageLabel[] = ['routine', 'noticing', 'concerned', 'alarmed']
  for (const q of questions) {
    const value = answers[q.id]
    if (typeof value !== 'string' || !value.trim()) continue
    const label = await triageFreeText(value)
    if (rank.indexOf(label) > rank.indexOf(worst)) worst = label
    const shouldAlert = (q.triggersChampion && value.trim()) || label === 'concerned' || label === 'alarmed'
    if (shouldAlert) {
      queueAlert({
        triggerType: 'free_text',
        context: value.trim().slice(0, 240),
        marks: [q.mark],
        triage: label,
      })
      championAlerted = true
    }
  }

  if (isFirstOfPeriod && role !== 'student') {
    incrementPulsesCompleted(role)
  }
  if (isFirstOfPeriod && role === 'student') {
    bumpStreak()
  }
  if (role === 'teacher') {
    await generateMicroMove(questions, answers, worst)
  }

  return { submission, triage: worst, championAlerted }
}

// ---------- pulsesCompleted unlock counter ----------

/* Source of truth for the 10-pulse Survey Builder unlock. Locally persisted here;
   the spec requires this counter to live per-user on the server — the storage
   adapter is the swap point (DESIGN_REVIEW P2-11). */

export function getPulsesCompleted(role: Role): number {
  const counters = storage.get<Partial<Record<Role, number>>>(COUNTERS_KEY)
  return counters?.[role] ?? 0
}

export function incrementPulsesCompleted(role: Role): number {
  const counters = storage.get<Partial<Record<Role, number>>>(COUNTERS_KEY) ?? {}
  const next = (counters[role] ?? 0) + 1
  storage.set(COUNTERS_KEY, { ...counters, [role]: next })
  enqueue('pulsesCompleted', { role, value: next })
  return next
}

export const UNLOCK_THRESHOLD = 10

export function isBuilderUnlocked(role: Role): boolean {
  return role !== 'student' && getPulsesCompleted(role) >= UNLOCK_THRESHOLD
}

// ---------- Student streak ----------

interface Streak {
  days: number
  lastDate: string
}

export function getStreak(): number {
  return storage.get<Streak>(STREAK_KEY)?.days ?? 0
}

function bumpStreak(): void {
  const prev = storage.get<Streak>(STREAK_KEY)
  const today = dateKey()
  if (prev?.lastDate === today) return
  const yesterday = dateKey(new Date(Date.now() - 86400000))
  const days = prev && (prev.lastDate === yesterday || prev.lastDate === today) ? prev.days + 1 : 1
  storage.set(STREAK_KEY, { days, lastDate: today })
}

export function seedStreak(days: number): void {
  storage.set(STREAK_KEY, { days, lastDate: dateKey(new Date(Date.now() - 86400000)) })
}
