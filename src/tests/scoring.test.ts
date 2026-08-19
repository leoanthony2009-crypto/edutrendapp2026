import { describe, expect, it } from 'vitest'
import { scoreAnswer, scoreRun } from '../services/scoring'
import type { PulseQuestion } from '../types/pulse'

const choice = (overrides: Partial<PulseQuestion> = {}): PulseQuestion => ({
  id: 'q',
  theme: 'Safety',
  text: 'Did you feel safe?',
  options: ['Yes', 'Mostly', 'Not really', 'No'],
  mark: 'R',
  routesTo: ['SD'],
  ...overrides,
})

describe('scoreAnswer', () => {
  it('scores positive-first options with index 0 as best', () => {
    const q = choice()
    expect(scoreAnswer(q, 0)).toBe(1)
    expect(scoreAnswer(q, 3)).toBe(0)
    expect(scoreAnswer(q, 1)).toBeCloseTo(2 / 3)
  })

  it('scores scale questions negative → positive', () => {
    const q = choice({ options: ['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], scale: true })
    expect(scoreAnswer(q, 0)).toBe(0)
    expect(scoreAnswer(q, 4)).toBe(1)
    expect(scoreAnswer(q, 2)).toBe(0.5)
  })

  it('excludes "Prefer not to say" from both the answer and the scale', () => {
    const q = choice({ options: ['No', 'A little', 'Yes', 'Prefer not to say'] })
    // Choosing "Prefer not to say" never scores — it must not count as the worst answer.
    expect(scoreAnswer(q, 3)).toBeNull()
    // The remaining scale is 3 options wide: No=1, A little=0.5, Yes=0.
    expect(scoreAnswer(q, 0)).toBe(1)
    expect(scoreAnswer(q, 1)).toBe(0.5)
    expect(scoreAnswer(q, 2)).toBe(0)
  })

  it('never scores neutral (informational) questions', () => {
    const q = choice({ neutral: true, options: ['Safety', 'Attendance', 'Learning'] })
    expect(scoreAnswer(q, 0)).toBeNull()
  })

  it('never scores free-text questions', () => {
    const q = choice({ options: null })
    expect(scoreAnswer(q, 0)).toBeNull()
  })
})

describe('scoreRun', () => {
  it('averages only scoreable answers into a 0–100 score', () => {
    const questions = [
      choice({ id: 'a' }), // answered Yes → 1
      choice({ id: 'b' }), // answered No → 0
      choice({ id: 'c', options: null }), // free text — ignored
    ]
    const score = scoreRun(questions, { a: 0, b: 3, c: 'a note' })
    expect(score).toBe(50)
  })

  it('is unchanged by a "Prefer not to say" answer', () => {
    const questions = [
      choice({ id: 'a' }),
      choice({ id: 'p', options: ['No', 'A little', 'Yes', 'Prefer not to say'] }),
    ]
    const withPnts = scoreRun(questions, { a: 0, p: 3 })
    const without = scoreRun(questions, { a: 0 })
    expect(withPnts).toBe(without)
    expect(withPnts).toBe(100)
  })

  it('returns null when nothing was scoreable', () => {
    const questions = [choice({ id: 'a', options: null })]
    expect(scoreRun(questions, { a: 'only text' })).toBeNull()
    expect(scoreRun(questions, {})).toBeNull()
  })
})
