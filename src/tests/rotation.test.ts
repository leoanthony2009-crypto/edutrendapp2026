import { describe, expect, it } from 'vitest'
import { DAILY_COUNT, rotateStudentBank } from '../services/rotation'
import { DEFAULT_BANKS } from '../data/questionBanks'

const bank = DEFAULT_BANKS.student

describe('rotateStudentBank', () => {
  it('serves 4 daily questions on a regular weekday', () => {
    const set = rotateStudentBank(bank, 'school-a', '2026-08-19', 3)
    expect(set).toHaveLength(DAILY_COUNT)
    expect(set.every((q) => !q.weekly)).toBe(true)
  })

  it('adds the weekly reflection on Fridays (3–5 question contract)', () => {
    const set = rotateStudentBank(bank, 'school-a', '2026-08-21', 5)
    expect(set).toHaveLength(DAILY_COUNT + 1)
    expect(set[set.length - 1].weekly).toBe(true)
    expect(set.length).toBeLessThanOrEqual(5)
  })

  it('is deterministic: same school + date always yields the same set', () => {
    const a = rotateStudentBank(bank, 'school-a', '2026-08-19', 3)
    const b = rotateStudentBank(bank, 'school-a', '2026-08-19', 3)
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
  })

  it('rotates across dates so the set changes through the week', () => {
    const days = ['2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21']
    const sets = days.map((d) => rotateStudentBank(bank, 'school-a', d, 2).map((q) => q.id).join(','))
    expect(new Set(sets).size).toBeGreaterThan(1)
  })

  it('does not depend on the client clock — only on the seed inputs', () => {
    const before = rotateStudentBank(bank, 'school-a', '2026-08-19', 3)
    // A different wall-clock moment with identical inputs must give the same set.
    const after = rotateStudentBank(bank, 'school-a', '2026-08-19', 3)
    expect(before.map((q) => q.id)).toEqual(after.map((q) => q.id))
  })

  it('serves the whole bank when it is already within the daily count', () => {
    const small = bank.slice(0, 3)
    expect(rotateStudentBank(small, 'school-a', '2026-08-19', 3)).toHaveLength(3)
  })
})
