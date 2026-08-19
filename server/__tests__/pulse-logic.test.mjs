// @vitest-environment node
import { describe, expect, it } from 'vitest'
import {
  activeQuestions,
  collateScore,
  DEFAULT_BANKS,
  scoreAnswer,
  schoolDay,
  STUDENT_QUESTIONS,
} from '../pulse-logic.mjs'

const choice = (options, extra = {}) => ({
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

describe('scoreAnswer (ported from the audited client implementation)', () => {
  it('scores positive-first options: first option is best', () => {
    const q = choice(['Yes', 'Mostly', 'Not really', 'No'])
    expect(scoreAnswer(q, 0)).toBe(1)
    expect(scoreAnswer(q, 1)).toBeCloseTo(2 / 3)
    expect(scoreAnswer(q, 3)).toBe(0)
  })

  it('scores scale questions worst-first: last option is best', () => {
    const q = choice(['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], { scale: true })
    expect(scoreAnswer(q, 0)).toBe(0)
    expect(scoreAnswer(q, 4)).toBe(1)
    expect(scoreAnswer(q, 2)).toBe(0.5)
  })

  it('excludes "Prefer not to say" entirely (DESIGN_REVIEW P1.3)', () => {
    const q = choice(['No', 'A little', 'Yes', 'Prefer not to say'])
    expect(scoreAnswer(q, 3)).toBeNull()
    expect(scoreAnswer(q, 0)).toBe(1)
    expect(scoreAnswer(q, 2)).toBe(0)
  })

  it('never scores neutral or free-text questions', () => {
    expect(scoreAnswer(choice(['A', 'B'], { neutral: true }), 0)).toBeNull()
    expect(scoreAnswer({ ...choice([]), options: undefined }, 0)).toBeNull()
  })
})

describe('collateScore', () => {
  it('averages only scorable answers into a 0–100 score', () => {
    const qs = [choice(['Yes', 'No'], { id: 'a' }), choice(['Yes', 'No'], { id: 'b' })]
    expect(collateScore(qs, { a: 0, b: 1 })).toBe(50)
  })

  it('ignores unanswered, free-text and prefer-not-to-say answers', () => {
    const qs = [
      choice(['Yes', 'No', 'Prefer not to say'], { id: 'a' }),
      choice(['Yes', 'No'], { id: 'b' }),
      { ...choice([], { id: 'c' }), options: undefined },
    ]
    expect(collateScore(qs, { a: 2, b: 0, c: 'hello' })).toBe(100)
  })

  it('returns null when nothing scorable was answered', () => {
    const qs = [choice(['Yes', 'No', 'Prefer not to say'], { id: 'a' })]
    expect(collateScore(qs, { a: 2 })).toBeNull()
    expect(collateScore(qs, {})).toBeNull()
  })
})

describe('student rotation (date-seeded)', () => {
  it('is deterministic for a given date', () => {
    const a = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-19').map((q) => q.id)
    const b = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-19').map((q) => q.id)
    expect(a).toEqual(b)
  })

  it('serves 3–5 questions per day and rotates across days', () => {
    const mon = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-17').map((q) => q.id)
    const tue = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-18').map((q) => q.id)
    expect(mon).not.toEqual(tue)
    for (const date of ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21']) {
      const qs = activeQuestions('student', STUDENT_QUESTIONS, date)
      expect(qs.length).toBeGreaterThanOrEqual(3)
      expect(qs.length).toBeLessThanOrEqual(5)
    }
  })

  it('includes the weekly reflection on Fridays only', () => {
    expect(activeQuestions('student', STUDENT_QUESTIONS, '2026-08-21').some((q) => q.weekly)).toBe(true)
    expect(activeQuestions('student', STUDENT_QUESTIONS, '2026-08-20').some((q) => q.weekly)).toBe(false)
  })

  it('teacher weekly perception question appears on Fridays only', () => {
    expect(activeQuestions('teacher', DEFAULT_BANKS.teacher, '2026-08-21').some((q) => q.id === 't6')).toBe(true)
    expect(activeQuestions('teacher', DEFAULT_BANKS.teacher, '2026-08-20').some((q) => q.id === 't6')).toBe(false)
  })
})

describe('school day and time integrity (Phase 10)', () => {
  it('derives the school day from the configured timezone, not the server clock zone', () => {
    // 2026-08-19T03:30Z is still 2026-08-18 in Trinidad (UTC-4)
    const instant = new Date('2026-08-19T03:30:00Z')
    expect(schoolDay('America/Port_of_Spain', instant)).toBe('2026-08-18')
    expect(schoolDay('UTC', instant)).toBe('2026-08-19')
    expect(schoolDay('Pacific/Auckland', instant)).toBe('2026-08-19')
  })

  it('handles daylight-saving transitions in DST timezones', () => {
    // Europe/London: BST ends 2026-10-25 02:00 → clocks back to GMT.
    expect(schoolDay('Europe/London', new Date('2026-10-25T00:30:00Z'))).toBe('2026-10-25')
    expect(schoolDay('Europe/London', new Date('2026-10-24T23:30:00Z'))).toBe('2026-10-25') // BST +1
    expect(schoolDay('Europe/London', new Date('2026-03-29T00:59:00Z'))).toBe('2026-03-29')
  })
})
