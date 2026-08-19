import type { ChampionAlert, OneChildEntry, TriageLabel, WatchlistRow } from '../types/pulse'
import type { SynodalMark } from '../types/synodal'
import { storage } from './storage'
import { SCHOOL_CONFIG, isoNow } from './time'
import { enqueue } from './offlineQueue'

/* Champion alert queue + One Child watchlist (PASTORAL_PULSE_SPEC §§ 3.4, 4.2).
   Alerts are generated from: triggersChampion free text, the Tell-a-leader
   safeguarding sheet, and cross-staff One Child patterns. The teacher-facing
   confirmation is always the same quiet line: read within 24 hours. */

const ALERTS_KEY = 'championAlerts'
const ONECHILD_KEY = 'oneChildEntries'
const ACTIONS_KEY = 'watchlistActions'

const DAY_MS = 86400000

export function getAlerts(): ChampionAlert[] {
  return storage.get<ChampionAlert[]>(ALERTS_KEY) ?? []
}

export function queueAlert(input: {
  triggerType: ChampionAlert['triggerType']
  context: string
  marks: SynodalMark[]
  pupilHandle?: string
  triage?: TriageLabel
}): ChampionAlert {
  const now = isoNow()
  const alert: ChampionAlert = {
    id: crypto.randomUUID(),
    schoolId: SCHOOL_CONFIG.schoolId,
    triggeredAt: now,
    triggerType: input.triggerType,
    pupilHandle: input.pupilHandle,
    context: input.context,
    marks: input.marks,
    status: 'open',
    readByDeadline: new Date(Date.parse(now) + DAY_MS).toISOString(),
  }
  storage.set(ALERTS_KEY, [alert, ...getAlerts()])
  enqueue('championAlert', alert)
  return alert
}

export function updateAlertStatus(id: string, status: ChampionAlert['status']): void {
  storage.set(
    ALERTS_KEY,
    getAlerts().map((a) => (a.id === id ? { ...a, status, championReadBy: 'champion' } : a)),
  )
}

export function getOneChildEntries(): OneChildEntry[] {
  return storage.get<OneChildEntry[]>(ONECHILD_KEY) ?? []
}

export function addOneChildEntry(entry: OneChildEntry): void {
  storage.set(ONECHILD_KEY, [entry, ...getOneChildEntries()])
  enqueue('oneChild', entry)
  maybeQueuePatternAlert(entry.pupilHandle)
}

/** Pattern rule: the same handle from 2+ distinct staff within 5 calendar days. */
function maybeQueuePatternAlert(handle: string): void {
  const cutoff = Date.now() - 5 * DAY_MS
  const recent = getOneChildEntries().filter(
    (e) => e.pupilHandle === handle && Date.parse(e.submittedAt) >= cutoff,
  )
  const staff = new Set(recent.map((e) => e.submittedBy))
  const alreadyOpen = getAlerts().some(
    (a) => a.triggerType === 'pattern' && a.pupilHandle === handle && a.status === 'open',
  )
  if (staff.size >= 2 && !alreadyOpen) {
    queueAlert({
      triggerType: 'pattern',
      pupilHandle: handle,
      context: `${handle} noted by ${staff.size} staff within 5 days`,
      marks: ['D'],
    })
  }
}

/** Watchlist: pupils appearing in 2+ pulses across 3+ days in the past two weeks. */
export function getWatchlist(): WatchlistRow[] {
  const cutoff = Date.now() - 14 * DAY_MS
  const byHandle = new Map<string, OneChildEntry[]>()
  for (const e of getOneChildEntries()) {
    if (Date.parse(e.submittedAt) < cutoff) continue
    const list = byHandle.get(e.pupilHandle) ?? []
    list.push(e)
    byHandle.set(e.pupilHandle, list)
  }
  const rows: WatchlistRow[] = []
  for (const [handle, entries] of byHandle) {
    const days = new Set(entries.map((e) => e.submittedAt.slice(0, 10)))
    if (entries.length >= 2 && days.size >= 3) {
      const actions = storage.get<Record<string, WatchlistRow['action']>>(ACTIONS_KEY) ?? {}
      rows.push({
        pupilHandle: handle,
        mentionCount: entries.length,
        dayCount: days.size,
        pattern: entries.map((e) => e.notedFor).filter(Boolean).join(' · '),
        marks: ['D'],
        action: actions[handle] ?? 'Open',
      })
    }
  }
  return rows.sort((a, b) => b.mentionCount - a.mentionCount)
}

/** Champion action taken on a watchlist pupil ("Reviewed" / "Parent contact" / "Safeguarding"). */
export function setWatchlistAction(handle: string, action: WatchlistRow['action']): void {
  const actions = storage.get<Record<string, WatchlistRow['action']>>(ACTIONS_KEY) ?? {}
  storage.set(ACTIONS_KEY, { ...actions, [handle]: action })
  enqueue('watchlistAction', { handle, action })
}

/** Heuristic guard: One Child handles must never look like a real name
    (PASTORAL_PULSE_SPEC § 3.2). */
export function looksLikeRealName(s: string): boolean {
  return /^[A-Z][a-z]{2,}(\s[A-Z][a-z]{2,})?$/.test(s.trim())
}
