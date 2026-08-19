import { PREFER_NOT_TO_SAY, type PulseQuestion } from '../types/pulse'

/** Positive-first option scoring (README § State Management).
    Rules:
    - Only choice questions score; free text and `neutral` (informational) questions never do.
    - "Prefer not to say" is excluded entirely — from both the answer and the option scale
      (DESIGN_REVIEW P1-3: it must never count as the worst answer).
    - Default ordering is positive-first (index 0 = best); `scale` questions run
      negative → positive (teacher 5-point scales).
    Returns 0–1, or null when the answer cannot be scored. */
export function scoreAnswer(question: PulseQuestion, optionIndex: number): number | null {
  if (!Array.isArray(question.options) || question.neutral) return null
  const option = question.options[optionIndex]
  if (option === undefined || option === PREFER_NOT_TO_SAY) return null

  const scoreable = question.options.filter((o) => o !== PREFER_NOT_TO_SAY)
  const idx = scoreable.indexOf(option)
  const n = scoreable.length - 1
  if (idx < 0 || n <= 0) return null

  const value = question.scale ? idx / n : (n - idx) / n
  return Math.max(0, Math.min(1, value))
}

/** Collates one run's answers into a 0–100 pulse score, or null when nothing scored. */
export function scoreRun(questions: PulseQuestion[], answers: Record<string, string | number>): number | null {
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
