import { describe, expect, it } from 'vitest'
import {
  getPulsesCompleted,
  incrementPulsesCompleted,
  isBuilderUnlocked,
  submitPulse,
  UNLOCK_THRESHOLD,
} from '../services/pulses'
import { DEFAULT_BANKS } from '../data/questionBanks'

describe('pulsesCompleted unlock counter', () => {
  it('starts at zero and increments per role', () => {
    expect(getPulsesCompleted('teacher')).toBe(0)
    incrementPulsesCompleted('teacher')
    expect(getPulsesCompleted('teacher')).toBe(1)
    expect(getPulsesCompleted('leader')).toBe(0)
  })

  it('unlocks the Survey Builder at 10 for staff, never for students', () => {
    for (let i = 0; i < UNLOCK_THRESHOLD; i++) incrementPulsesCompleted('teacher')
    expect(isBuilderUnlocked('teacher')).toBe(true)
    for (let i = 0; i < UNLOCK_THRESHOLD; i++) incrementPulsesCompleted('student')
    expect(isBuilderUnlocked('student')).toBe(false)
  })

  it('counts a submitted pulse once per period — resubmitting the same day does not double-count', async () => {
    const questions = DEFAULT_BANKS.teacher
    await submitPulse('teacher', questions, { t1: 4, t3: 3 })
    expect(getPulsesCompleted('teacher')).toBe(1)
    // Reviewing and changing answers the same day updates the record, not the counter.
    await submitPulse('teacher', questions, { t1: 2, t3: 1 })
    expect(getPulsesCompleted('teacher')).toBe(1)
  })

  it('never increments the counter for student submissions', async () => {
    const questions = DEFAULT_BANKS.student.slice(0, 2)
    await submitPulse('student', questions, { s1: 0, s2: 1 })
    expect(getPulsesCompleted('student')).toBe(0)
  })
})
