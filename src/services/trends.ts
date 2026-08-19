import type { Role } from '../types/pulse'
import { getCurrentSubmission } from './pulses'
import { storage } from './storage'
import { dateKey } from './time'

/* Trend aggregation. Historic points are seeded demo aggregates (a backend will
   replace them via the storage adapter); today's point collates the pulses actually
   submitted on this device so a completed carousel visibly moves Today + Trends. */

export type TrendRange = '7d' | '30d' | 'term'

interface History {
  baseline: number // school baseline used to blend today's local submissions
  d7: number[] // previous 6 school days
  d30: number[]
  term: number[]
  participation: number[] // previous 6 days, %
}

const HISTORY_KEY = 'trendHistory'

const DEFAULT_HISTORY: History = {
  baseline: 73,
  d7: [64, 66, 61, 69, 71, 68],
  d30: [58, 62, 60, 65, 63, 67, 64, 66, 61, 69, 71],
  term: [52, 55, 60, 57, 63, 66, 64, 70, 68, 72, 71],
  participation: [78, 82, 74, 80, 84, 79],
}

function getHistory(): History {
  return storage.get<History>(HISTORY_KEY) ?? DEFAULT_HISTORY
}

export function seedHistory(): void {
  if (!storage.get<History>(HISTORY_KEY)) storage.set(HISTORY_KEY, DEFAULT_HISTORY)
}

/** Today's collated school score: the seeded school baseline blended with any
    pulse submitted on this device today (matching the prototype's collation). */
export function todayScore(): number {
  const h = getHistory()
  const roles: Role[] = ['student', 'teacher']
  const scores = roles
    .map((r) => getCurrentSubmission(r))
    .filter((s) => s !== null && s.date === dateKey() && s.score !== null)
    .map((s) => s!.score as number)
  if (scores.length === 0) return h.baseline
  const local = scores.reduce((a, b) => a + b, 0) / scores.length
  return Math.round((h.baseline + local) / 2)
}

export interface TrendSeries {
  caption: string
  startLabel: string
  points: { label: string; value: number }[]
}

export function getTrendSeries(range: TrendRange): TrendSeries {
  const h = getHistory()
  const today = todayScore()
  if (range === '7d') {
    const labels = ['Wed', 'Thu', 'Fri', 'Mon', 'Tue', 'Wed', 'Today']
    return {
      caption: 'Last 7 school days',
      startLabel: 'Wed',
      points: [...h.d7, today].map((v, i) => ({ label: labels[i] ?? `Day ${i + 1}`, value: v })),
    }
  }
  if (range === '30d') {
    return {
      caption: 'Last 30 days',
      startLabel: '4 wks ago',
      points: [...h.d30, today].map((v, i) => ({ label: `P${i + 1}`, value: v })),
    }
  }
  return {
    caption: 'Term 2 to date',
    startLabel: 'wk 1',
    points: [...h.term, today].map((v, i) => ({ label: `Wk ${i + 1}`, value: v })),
  }
}

export function weekDelta(): number {
  const h = getHistory()
  return todayScore() - h.d7[h.d7.length - 1]
}

export interface ParticipationDay {
  label: string
  value: number
  isToday: boolean
}

export function getParticipation(): ParticipationDay[] {
  const h = getHistory()
  const submittedToday = getCurrentSubmission('student')?.date === dateKey()
  const labels = ['W', 'T', 'F', 'M', 'T', 'W']
  return [
    ...h.participation.map((v, i) => ({ label: labels[i] ?? '·', value: v, isToday: false })),
    { label: 'Today', value: submittedToday ? 86 : 81, isToday: true },
  ]
}

export interface DomainRow {
  label: string
  value: number
  delta: number
}

export const DOMAIN_SNAPSHOT: DomainRow[] = [
  { label: 'Safety & peers', value: 67, delta: -3 },
  { label: 'Belonging', value: 72, delta: 4 },
  { label: 'Trusted adults', value: 61, delta: 1 },
  { label: 'Emotional load', value: 58, delta: -2 },
  { label: 'Engagement', value: 70, delta: 2 },
  { label: 'Learning', value: 64, delta: 0 },
  { label: 'Voice & fairness', value: 69, delta: 5 },
  { label: 'Home context', value: 62, delta: -1 },
]

export interface ThemeRow {
  label: string
  sub: string
  weight: number
  tone: 'concern' | 'warn' | 'good'
}

export const RECURRING_THEMES: ThemeRow[] = [
  { label: 'Break-time safety (Forms 2–3)', sub: 'Safety · 44 mentions', weight: 84, tone: 'concern' },
  { label: 'SBA pressure', sub: 'Learning pressure · 36 mentions', weight: 68, tone: 'warn' },
  { label: 'Buddy scheme lifting belonging', sub: 'Positive signal · 29 mentions', weight: 55, tone: 'good' },
]

/** Voices collated today (seeded school-wide count + this device's submissions). */
export function voicesToday(): number {
  const base = 165
  const roles: Role[] = ['student', 'teacher', 'leader']
  const mine = roles.filter((r) => {
    const s = getCurrentSubmission(r)
    return s !== null && s.date === dateKey()
  }).length
  return base + mine
}
