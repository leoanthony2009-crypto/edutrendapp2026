import { describe, expect, it } from 'vitest'
import { collateScore, scoreAnswer } from '../scoring'
import type { PulseQuestion } from '../../types/survey'
import { STUDENT_QUESTIONS } from '../../data/questionBanks'

const choice = (options: string[], extra: Partial<PulseQuestion> = {}): PulseQuestion => ({
  id: 'q',
  theme: 'Safety',
  domain: 'wellness',
  type: 'single_select',
  text: 'Test?',
  options,
  mark: 'L',
  routesTo: ['SD'],
  ...extra,
})

describe('scoreAnswer', () => {
  it('scores positive-first options: first option is best', () => {
    const q = choice(['Yes', 'Mostly', 'Not really', 'No'])
    expect(scoreAnswer(q, 0)).toBe(1)
    expect(scoreAnswer(q, 1)).toBeCloseTo(2 / 3)
    expect(scoreAnswer(q, 3)).toBe(0)
  })

  it('scores scale questions worst-first: last option is best', () => {
    const q = choice(['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], { scale: true, type: 'scale' })
    expect(scoreAnswer(q, 0)).toBe(0)
    expect(scoreAnswer(q, 4)).toBe(1)
    expect(scoreAnswer(q, 2)).toBe(0.5)
  })

  it('excludes "Prefer not to say" from scoring entirely (DESIGN_REVIEW P1.3)', () => {
    const q = choice(['No', 'A little', 'Yes', 'Prefer not to say'])
    expect(scoreAnswer(q, 3)).toBeNull()
    // and the remaining options are scored over the scorable set only
    expect(scoreAnswer(q, 0)).toBe(1)
    expect(scoreAnswer(q, 2)).toBe(0)
  })

  it('never scores neutral questions', () => {
    const q = choice(['Safety', 'Attendance'], { neutral: true })
    expect(scoreAnswer(q, 0)).toBeNull()
  })

  it('never scores free-text questions', () => {
    const q: PulseQuestion = { ...choice([]), options: undefined, type: 'free_text' }
    expect(scoreAnswer(q, 0)).toBeNull()
  })
})

describe('collateScore', () => {
  it('averages only scorable answers into a 0–100 score', () => {
    const qs = [
      choice(['Yes', 'No'], { id: 'a' }), // answered best → 1
      choice(['Yes', 'No'], { id: 'b' }), // answered worst → 0
    ]
    expect(collateScore(qs, { a: 0, b: 1 })).toBe(50)
  })

  it('ignores unanswered, free-text and prefer-not-to-say answers', () => {
    const qs = [
      choice(['Yes', 'No', 'Prefer not to say'], { id: 'a' }),
      choice(['Yes', 'No'], { id: 'b' }),
      { ...choice([], { id: 'c' }), options: undefined, type: 'free_text' as const },
    ]
    // a = prefer not to say (excluded), b = best, c = text
    expect(collateScore(qs, { a: 2, b: 0, c: 'hello' })).toBe(100)
  })

  it('returns null when nothing scorable was answered', () => {
    const qs = [choice(['Yes', 'No', 'Prefer not to say'], { id: 'a' })]
    expect(collateScore(qs, { a: 2 })).toBeNull()
    expect(collateScore(qs, {})).toBeNull()
  })

  it('a perfect real student run scores 100, all-worst scores 0', () => {
    const qs = STUDENT_QUESTIONS.filter((q) => q.options)
    const best = Object.fromEntries(qs.map((q) => [q.id, 0]))
    expect(collateScore(qs, best)).toBe(100)
    const worst = Object.fromEntries(
      qs.map((q) => [q.id, q.options!.filter((o) => o !== 'Prefer not to say').length - 1])
    )
    expect(collateScore(qs, worst)).toBe(0)
  })
})
