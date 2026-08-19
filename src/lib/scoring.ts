import type { AnswerValue, PulseQuestion } from "../types";

export const PREFER_NOT_TO_SAY = "Prefer not to say";

/**
 * Score one answered choice question to 0–1 (1 = best).
 *
 * - Options are positive-first by default; `scale: true` banks are worst-first.
 * - `reverse: true` marks a question whose options run best→worst semantically
 *   inverted (e.g. "Did another pupil make you feel unsafe?" where "No" is
 *   good) — for these positive-first ordering already applies, so scoring is
 *   identical; the flag documents intent for the question manager.
 * - "Prefer not to say" is NEVER scored (DESIGN_REVIEW.md P1-3): it returns
 *   null and is excluded from the average entirely.
 * - `neutral` questions (leader attention/barrier picks) are diagnostic, not
 *   scored.
 */
export function scoreAnswer(q: PulseQuestion, answer: AnswerValue | undefined): number | null {
  if (answer === undefined || typeof answer !== "number") return null;
  if (!Array.isArray(q.opts) || q.neutral) return null;
  const label = q.opts[answer];
  if (label === undefined || label === PREFER_NOT_TO_SAY) return null;

  // Denominator excludes "Prefer not to say" so it doesn't distort the range.
  const scorable = q.opts.filter((o) => o !== PREFER_NOT_TO_SAY);
  const idx = scorable.indexOf(label);
  const n = scorable.length - 1;
  if (n <= 0) return null;

  const v = q.scale ? idx / n : (n - idx) / n;
  return Math.max(0, Math.min(1, v));
}

/** Collate a completed run into a 0–100 pulse average (null if nothing scorable). */
export function collatePulse(
  qs: PulseQuestion[],
  answers: Record<string, AnswerValue>,
  keyOf: (q: PulseQuestion) => string
): number | null {
  const vals = qs
    .map((q) => scoreAnswer(q, answers[keyOf(q)]))
    .filter((v): v is number => v !== null);
  if (!vals.length) return null;
  return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100);
}
