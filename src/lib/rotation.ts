import type { PulseQuestion } from "../types";

/**
 * Student daily rotation: 3–5 questions per day from the bank, plus the
 * weekly reflection (Fridays, or as the fifth slot when the bank is small).
 *
 * NOTE (DESIGN_REVIEW.md P2-9): rotation is seeded from the device date for
 * now. When the backend lands, the seed must come from the school-configured
 * timezone server-side so a class sees the same set. The seed is isolated
 * here so that swap is one line.
 */
export function rotationSeed(date: Date = new Date()): number {
  return date.getDay();
}

export function rotateStudentBank(bank: PulseQuestion[], seed: number): PulseQuestion[] {
  if (bank.length <= 5) return bank;
  const daily = bank.filter((q) => !q.weekly);
  const weekly = bank.filter((q) => q.weekly);
  const start = (seed * 3) % Math.max(1, daily.length);
  const rot = daily
    .slice(start)
    .concat(daily.slice(0, start))
    .slice(0, weekly.length ? 4 : 5);
  return seed === 5 && weekly.length
    ? rot.concat([weekly[0]])
    : rot.concat(weekly.slice(0, 1)).slice(0, 5);
}
