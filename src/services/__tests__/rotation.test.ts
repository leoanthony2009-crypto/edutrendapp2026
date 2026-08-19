import { describe, expect, it } from 'vitest'
import { activeQuestions } from '../rotation'
import { DEFAULT_BANKS, STUDENT_QUESTIONS } from '../../data/questionBanks'

describe('student rotation', () => {
  it('is deterministic for a given date — every pupil sees the same set', () => {
    const a = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-19')
    const b = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-19')
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
  })

  it('serves 3–5 questions per day', () => {
    for (const date of ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21']) {
      const qs = activeQuestions('student', STUDENT_QUESTIONS, date)
      expect(qs.length).toBeGreaterThanOrEqual(3)
      expect(qs.length).toBeLessThanOrEqual(5)
    }
  })

  it('rotates the daily set across days', () => {
    const mon = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-17').map((q) => q.id)
    const tue = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-18').map((q) => q.id)
    expect(mon).not.toEqual(tue)
  })

  it('includes the weekly reflection on Fridays only', () => {
    const friday = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-21')
    expect(friday.some((q) => q.weekly)).toBe(true)
    const thursday = activeQuestions('student', STUDENT_QUESTIONS, '2026-08-20')
    expect(thursday.some((q) => q.weekly)).toBe(false)
  })

  it('never rotates the weekly question into the daily slots', () => {
    for (const date of ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20']) {
      const qs = activeQuestions('student', STUDENT_QUESTIONS, date)
      expect(qs.filter((q) => q.weekly)).toHaveLength(0)
    }
  })
})

describe('teacher and leader carousels', () => {
  it('always serve the full 5-question bank', () => {
    expect(activeQuestions('teacher', DEFAULT_BANKS.teacher, '2026-08-19')).toHaveLength(5)
    expect(activeQuestions('leader', DEFAULT_BANKS.leader, '2026-08-19')).toHaveLength(5)
  })
})

describe('edited banks', () => {
  it('serves a small student bank as-is (no rotation below 6 questions)', () => {
    const small = STUDENT_QUESTIONS.slice(0, 3)
    expect(activeQuestions('student', small, '2026-08-19')).toHaveLength(3)
  })

  it('serves the empty-bank state', () => {
    expect(activeQuestions('teacher', [], '2026-08-19')).toHaveLength(0)
  })
})
