import type { PulseQuestion } from '../types/pulse'

/** Deterministic daily rotation, seeded by (schoolId, dateKey) instead of the client
    clock's day-of-week, so every pupil in a school sees the same set on the same day
    and a server can reproduce it exactly (DESIGN_REVIEW P2-9).

    Students get 4 rotated daily questions (from the non-weekly bank) plus the weekly
    reflection question on Fridays — 3–5 questions per day per the two-minute contract.
    Teacher and leader banks are short and are served whole. */

function hashSeed(input: string): number {
  let h = 2166136261
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export const DAILY_COUNT = 4

export function rotateStudentBank(
  bank: PulseQuestion[],
  schoolId: string,
  dateKey: string,
  weekday: number,
): PulseQuestion[] {
  const daily = bank.filter((q) => !q.weekly)
  const weekly = bank.filter((q) => q.weekly)
  if (daily.length <= DAILY_COUNT) {
    return weekday === 5 ? [...daily, ...weekly.slice(0, 1)] : daily
  }
  const start = hashSeed(`${schoolId}:${dateKey}`) % daily.length
  const rotated = daily.slice(start).concat(daily.slice(0, start)).slice(0, DAILY_COUNT)
  // Weekly reflection joins the set on Fridays only.
  return weekday === 5 && weekly.length > 0 ? [...rotated, weekly[0]] : rotated
}
