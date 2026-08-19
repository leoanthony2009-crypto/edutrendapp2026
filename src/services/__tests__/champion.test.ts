import { beforeEach, describe, expect, it } from 'vitest'
import {
  acknowledgeAlert,
  addOneChildEntry,
  closeAlert,
  listAlerts,
  queueAlert,
  setWatchlistAction,
  slaHoursRemaining,
  triagedAlerts,
  watchlist,
  watchlistActions,
} from '../champion'
import { storage } from '../storage'
import type { OneChildEntry } from '../../types/survey'

const HOUR = 3_600_000
const DAY = 24 * HOUR

function entry(staff: string, daysAgo: number, handle = 'F2-073'): OneChildEntry {
  return {
    pupilHandle: handle,
    yearGroup: 'F2',
    notedFor: 'quiet',
    submittedBy: staff,
    submittedAt: new Date(Date.now() - daysAgo * DAY).toISOString(),
  }
}

beforeEach(() => {
  // Start every test from an explicitly empty queue (overriding demo seeds).
  storage.set('championAlerts', [])
  storage.set('oneChildEntries', [])
  storage.set('watchlistActions', {})
})

describe('Champion alert queue', () => {
  it('queues an alert with a 24-hour read deadline', () => {
    const now = new Date('2026-08-19T12:00:00Z')
    const alert = queueAlert({ triggerType: 'safeguarding', context: 'note', marks: ['L'], now })
    expect(alert.readByDeadline).toBe('2026-08-20T12:00:00.000Z')
    expect(alert.status).toBe('open')
    expect(listAlerts()).toHaveLength(1)
  })

  it('triages open alerts by SLA remaining, not arrival order', () => {
    const now = Date.now()
    queueAlert({ triggerType: 'free_text', context: 'newer', marks: ['L'], now: new Date(now - 2 * HOUR) })
    queueAlert({ triggerType: 'free_text', context: 'oldest — least time left', marks: ['L'], now: new Date(now - 20 * HOUR) })
    queueAlert({ triggerType: 'free_text', context: 'newest', marks: ['L'], now: new Date(now) })
    const sorted = triagedAlerts()
    expect(sorted[0].context).toBe('oldest — least time left')
    expect(sorted[2].context).toBe('newest')
  })

  it('acknowledging marks the alert reviewed and records the Champion', () => {
    const a = queueAlert({ triggerType: 'free_text', context: 'x', marks: ['L'] })
    acknowledgeAlert(a.id, 'champ-1')
    const stored = listAlerts().find((x) => x.id === a.id)!
    expect(stored.status).toBe('reviewed')
    expect(stored.championReadBy).toBe('champ-1')
  })

  it('closing requires a structured outcome note', () => {
    const a = queueAlert({ triggerType: 'free_text', context: 'x', marks: ['L'] })
    expect(() => closeAlert(a.id, 'champ-1', 'parent_contact', '   ')).toThrow(/outcome note/i)
    closeAlert(a.id, 'champ-1', 'parent_contact', 'Called home, mum aware, check-in Friday')
    const stored = listAlerts().find((x) => x.id === a.id)!
    expect(stored.status).toBe('actioned')
    expect(stored.outcome).toBe('parent_contact')
    expect(stored.outcomeNote).toMatch(/check-in Friday/)
  })

  it('computes SLA hours remaining (negative when overdue)', () => {
    const a = queueAlert({ triggerType: 'free_text', context: 'x', marks: ['L'], now: new Date(Date.now() - 30 * HOUR) })
    expect(slaHoursRemaining(a)).toBeLessThan(0)
    const b = queueAlert({ triggerType: 'free_text', context: 'y', marks: ['L'] })
    expect(slaHoursRemaining(b)).toBeGreaterThan(23)
  })
})

describe('One Child pattern alerting (spec § 4.2)', () => {
  it('raises a pattern alert when 2+ distinct staff note the same handle within 5 days', () => {
    addOneChildEntry(entry('teacher-a', 1))
    expect(listAlerts().filter((a) => a.triggerType === 'pattern')).toHaveLength(0)
    addOneChildEntry(entry('teacher-b', 0))
    const patterns = listAlerts().filter((a) => a.triggerType === 'pattern')
    expect(patterns).toHaveLength(1)
    expect(patterns[0].pupilHandle).toBe('F2-073')
  })

  it('does not duplicate an open pattern alert for the same handle', () => {
    addOneChildEntry(entry('teacher-a', 1))
    addOneChildEntry(entry('teacher-b', 0))
    addOneChildEntry(entry('teacher-c', 0))
    expect(listAlerts().filter((a) => a.triggerType === 'pattern')).toHaveLength(1)
  })
})

describe('watchlist threshold (spec § 3.4)', () => {
  it('lists pupils with 2+ mentions across 3+ days in the past fortnight', () => {
    storage.set('championAlerts', [])
    const entries = [entry('a', 1), entry('a', 3), entry('b', 5)]
    expect(watchlist(entries)).toHaveLength(1)
    expect(watchlist(entries)[0].staff).toBe(2)
  })

  it('excludes pupils below the day threshold', () => {
    const entries = [entry('a', 1), entry('b', 1)]
    expect(watchlist(entries)).toHaveLength(0)
  })

  it('stores the Champion action per pupil', () => {
    setWatchlistAction('F2-073', 'Parent contact')
    expect(watchlistActions()['F2-073']).toBe('Parent contact')
  })
})
