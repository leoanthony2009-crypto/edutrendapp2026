import type { PulseQuestion, Role } from '../types/survey'

/**
 * Student question rotation.
 *
 * The rotation is seeded from the calendar DATE string (school timezone), not
 * the client clock's day-of-week, so every pupil in a class sees the same set
 * on the same day and the seed can move server-side untouched
 * (DESIGN_REVIEW P2.9). Teachers and leaders always get their full 5-question
 * bank.
 *
 * Contract: 4 rotated daily questions + the weekly reflection on Fridays
 * (3–5 questions per day per README § State Management).
 */
export const DAILY_QUESTION_COUNT = 4

export function dateSeed(date: string): number {
  // Days since epoch for a YYYY-MM-DD string — stable across devices/timezones.
  return Math.floor(Date.parse(`${date}T00:00:00Z`) / 86_400_000)
}

export function isFriday(date: string): boolean {
  return new Date(`${date}T00:00:00Z`).getUTCDay() === 5
}

export function activeQuestions(role: Role, bank: PulseQuestion[], date: string): PulseQuestion[] {
  if (role !== 'student') return bank
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

/** Today's date in YYYY-MM-DD, from the local (school) clock. */
export function todayISO(now: Date = new Date()): string {
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
