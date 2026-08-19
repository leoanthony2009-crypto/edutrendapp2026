import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { ReactNode } from 'react'
import { AppStoreProvider, useAppStore } from '../AppStore'

const wrapper = ({ children }: { children: ReactNode }) => <AppStoreProvider>{children}</AppStoreProvider>

describe('Survey Builder unlock counter', () => {
  it('seeds teacher at 9 and leader at 12 (demo)', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })
    expect(result.current.pulsesCompleted.teacher).toBe(9)
    expect(result.current.pulsesCompleted.leader).toBe(12)
    expect(result.current.pulsesCompleted.student).toBe(0)
  })

  it('increments on a teacher pulse submit, crossing the 10-pulse unlock', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })
    act(() => {
      const qs = result.current.todaysQuestions('teacher')
      result.current.setDraft(qs[0].id, 4)
    })
    act(() => {
      result.current.submitRun('teacher')
    })
    expect(result.current.pulsesCompleted.teacher).toBe(10)
  })

  it('does not double-count a same-day resubmit (once per day)', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })
    act(() => {
      const qs = result.current.todaysQuestions('teacher')
      result.current.setDraft(qs[0].id, 4)
    })
    act(() => {
      result.current.submitRun('teacher')
    })
    act(() => {
      result.current.submitRun('teacher')
    })
    expect(result.current.pulsesCompleted.teacher).toBe(10)
    expect(result.current.runs.filter((r) => r.role === 'teacher')).toHaveLength(1)
  })

  it('never increments for students', () => {
    const { result } = renderHook(() => useAppStore(), { wrapper })
    act(() => {
      const qs = result.current.todaysQuestions('student')
      result.current.setDraft(qs[0].id, 0)
    })
    act(() => {
      result.current.submitRun('student')
    })
    expect(result.current.pulsesCompleted.student).toBe(0)
  })

  it('persists the counter across provider remounts (localStorage)', () => {
    const first = renderHook(() => useAppStore(), { wrapper })
    act(() => {
      const qs = first.result.current.todaysQuestions('teacher')
      first.result.current.setDraft(qs[0].id, 4)
    })
    act(() => {
      first.result.current.submitRun('teacher')
    })
    first.unmount()
    const second = renderHook(() => useAppStore(), { wrapper })
    expect(second.result.current.pulsesCompleted.teacher).toBe(10)
  })
})
