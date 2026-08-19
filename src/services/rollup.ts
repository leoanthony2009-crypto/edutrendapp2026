import type { PulseRollup } from '../types/bsc'
import type { BSCPillar } from '../types/bsc'
import type { SynodalMark } from '../types/synodal'
import type { PulseQuestion, PulseRun } from '../types/survey'
import { scoreAnswer } from './scoring'
import { SCHOOL_ID, listOneChildEntries, listAlerts } from './champion'

const PILLARS: BSCPillar[] = ['AE', 'SD', 'TL', 'CS']
const MARKS: SynodalMark[] = ['R', 'L', 'D', 'SE']

/**
 * BSC rollup (PASTORAL_PULSE_SPEC § 4.1): aggregate a day's responses by
 * routed pillar. Mirrors the `/api/bsc/rollup?schoolId=&from=&to=` endpoint
 * shape — today it computes from the localStorage-backed run log.
 */
export function computeRollup(
  date: string,
  runs: PulseRun[],
  questionsById: Map<string, PulseQuestion>,
  staffCount = 38
): PulseRollup {
  const dayRuns = runs.filter((r) => r.date === date && r.role !== 'student')
  const byMark: Record<SynodalMark, number> = { R: 0, L: 0, D: 0, SE: 0 }
  const pillarAcc: Record<BSCPillar, { scores: number[]; qualitativeCount: number; flagCount: number }> = {
    AE: { scores: [], qualitativeCount: 0, flagCount: 0 },
    SD: { scores: [], qualitativeCount: 0, flagCount: 0 },
    TL: { scores: [], qualitativeCount: 0, flagCount: 0 },
    CS: { scores: [], qualitativeCount: 0, flagCount: 0 },
  }

  for (const run of dayRuns) {
    for (const res of run.responses) {
      const q = questionsById.get(res.questionId)
      if (!q) continue
      byMark[res.mark] += 1
      for (const pillar of q.routesTo) {
        const acc = pillarAcc[pillar]
        if (typeof res.value === 'number') {
          const v = scoreAnswer(q, res.value)
          if (v !== null) acc.scores.push(v)
        } else if (typeof res.value === 'string' && res.value.trim()) {
          acc.qualitativeCount += 1
          if (q.triggersChampion) acc.flagCount += 1
        }
      }
    }
  }

  const byPillar = Object.fromEntries(
    PILLARS.map((p) => {
      const acc = pillarAcc[p]
      const avgScore = acc.scores.length ? acc.scores.reduce((s, v) => s + v, 0) / acc.scores.length : 0
      return [p, { avgScore, qualitativeCount: acc.qualitativeCount, flagCount: acc.flagCount }]
    })
  ) as PulseRollup['byPillar']

  const oneChildToday = listOneChildEntries().filter((e) => e.submittedAt.slice(0, 10) === date).length
  const safeguardingToday = listAlerts().filter((a) => a.triggeredAt.slice(0, 10) === date).length

  return {
    schoolId: SCHOOL_ID,
    date,
    participation: Math.round((dayRuns.length / Math.max(1, staffCount)) * 100),
    byMark,
    byPillar,
    oneChildEntries: oneChildToday,
    safeguardingTriggers: safeguardingToday,
  }
}

export function marksTotals(rollups: PulseRollup[]): Record<SynodalMark, number> {
  const totals: Record<SynodalMark, number> = { R: 0, L: 0, D: 0, SE: 0 }
  for (const r of rollups) for (const m of MARKS) totals[m] += r.byMark[m]
  return totals
}
