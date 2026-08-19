import { BSC_PILLARS, type BSCPillar, type PulseRollup } from '../types/bsc'
import type { SynodalMark } from '../types/synodal'
import type { PulseSubmission } from '../types/pulse'
import { getBank } from './pulses'
import { scoreAnswer } from './scoring'
import { getAlerts, getOneChildEntries } from './champion'
import { storage } from './storage'
import { SCHOOL_CONFIG, dateKey } from './time'

/* BSC rollup (PASTORAL_PULSE_SPEC § 4.1): the day's responses aggregated by
   Synodal Mark and BSC pillar. Shape matches the /api/bsc/rollup contract so the
   dashboard export can consume it unchanged when a backend arrives. */

export function getRollup(date = dateKey()): PulseRollup {
  const submissions = storage.get<Record<string, PulseSubmission>>('submissions') ?? {}
  const daySubs = Object.values(submissions).filter((s) => s.date === date)

  const byMark: Record<SynodalMark, number> = { R: 0, L: 0, D: 0, SE: 0 }
  const byPillar = {} as PulseRollup['byPillar']
  for (const pillar of Object.keys(BSC_PILLARS) as BSCPillar[]) {
    byPillar[pillar] = { avgScore: 0, qualitativeCount: 0, flagCount: 0 }
  }
  const pillarScores: Record<BSCPillar, number[]> = { AE: [], SD: [], TL: [], CS: [] }

  for (const sub of daySubs) {
    const bank = getBank(sub.role)
    for (const resp of sub.responses) {
      byMark[resp.mark] += 1
      const q = bank.find((b) => b.id === resp.questionId)
      if (!q) continue
      for (const pillar of q.routesTo) {
        if (typeof resp.value === 'number') {
          const v = scoreAnswer(q, resp.value)
          if (v !== null) pillarScores[pillar].push(v)
        } else if (typeof resp.value === 'string' && resp.value.trim()) {
          byPillar[pillar].qualitativeCount += 1
          if (q.triggersChampion) byPillar[pillar].flagCount += 1
        }
      }
    }
  }
  for (const pillar of Object.keys(pillarScores) as BSCPillar[]) {
    const vals = pillarScores[pillar]
    byPillar[pillar].avgScore = vals.length
      ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100
      : 0
  }

  const staffDone = daySubs.some((s) => s.role === 'teacher') ? 1 : 0

  return {
    schoolId: SCHOOL_CONFIG.schoolId,
    date,
    participation: Math.round((staffDone / 1) * 100),
    byMark,
    byPillar,
    oneChildEntries: getOneChildEntries().filter((e) => e.submittedAt.slice(0, 10) === date).length,
    safeguardingTriggers: getAlerts().filter((a) => a.triggeredAt.slice(0, 10) === date).length,
  }
}
