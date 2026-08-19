import type { PulseQuestion } from '../types/survey'
import { PREFER_NOT_TO_SAY } from '../data/questionBanks'

/**
 * Positive-first option scoring (DESIGN_REVIEW P1.3):
 * - Non-scale choice options run best-first, so index 0 scores 1.0 and the
 *   last scorable option scores 0.
 * - `scale` questions run worst-first, so scoring is inverted.
 * - "Prefer not to say" is excluded from scoring entirely — it is neither the
 *   worst answer nor an answer at all. Neutral questions never score.
 */
export function scoreAnswer(question: PulseQuestion, optionIndex: number): number | null {
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

/**
 * Collate one carousel run into a 0–100 pulse score. Free-text, neutral and
 * "Prefer not to say" answers are excluded; returns null when nothing scored.
 */
export function collateScore(
  questions: PulseQuestion[],
  answers: Record<string, number | string | undefined>
): number | null {
  const values: number[] = []
  for (const q of questions) {
    const a = answers[q.id]
    if (typeof a !== 'number') continue
    const v = scoreAnswer(q, a)
    if (v !== null) values.push(v)
  }
  if (values.length === 0) return null
  return Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 100)
}
