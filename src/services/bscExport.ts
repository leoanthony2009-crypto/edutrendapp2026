import type { BSCExport, BSCPillar, PulseRollup } from '../types/bsc'
import { BSC_PILLARS } from '../types/bsc'
import { watchlist } from './champion'
import { composeLeaderBridge, composeTeacherBridge } from './bridge'
import { pickFallbackMove } from './poui'

/**
 * Dashboard export (PASTORAL_PULSE_SPEC § 7): the JSON contract consumed by
 * the BSC PowerPoint template. School constants are demo values until the
 * backend supplies real SDP data.
 */
const PILLAR_OBJECTIVES: Record<BSCPillar, Array<{ label: string; baseline: string; target: string }>> = {
  AE: [{ label: 'Lessons landing (pulse signal)', baseline: '64', target: '75' }],
  SD: [{ label: 'Pupils feeling safe weekly', baseline: '67%', target: '80%' }],
  TL: [{ label: 'Staff raising concerns early', baseline: '58%', target: '75%' }],
  CS: [{ label: 'Workable classrooms reported', baseline: '71%', target: '85%' }],
}

export function buildBSCExport(rollups: PulseRollup[], weekOf: string, avgStreak: number): BSCExport {
  const latest = rollups[rollups.length - 1]
  const rows = watchlist()
  return {
    schoolName: "St. Joseph's RC Secondary",
    sdpCycle: '2025–2028',
    generatedAt: new Date().toISOString(),
    studentsEnrolled: 612,
    teachingStaff: 38,
    seaAverage: 72,
    sbmCurriculum: 3,
    sbmStudentServices: 3,
    sbmCommunity: 2,
    pulseStatus: {
      participationPct: latest?.participation ?? 0,
      onWatchlist: rows.length,
      avgStreak,
    },
    pillars: (Object.keys(BSC_PILLARS) as BSCPillar[]).map((pillar) => {
      const scores = rollups.map((r) => r.byPillar[pillar].avgScore).filter((v) => v > 0)
      const avg = scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) : null
      return {
        pillar,
        objectives: PILLAR_OBJECTIVES[pillar].map((o) => ({
          ...o,
          mark: 'D' as const,
          status: (avg === null ? 2 : avg >= 70 ? 3 : avg >= 55 ? 2 : 1) as 1 | 2 | 3 | 4,
        })),
        pulseFeed: {
          summary: avg === null ? 'No scaled pulse signal this cycle.' : `Pulse signal ${avg}/100 this cycle.`,
          signal: avg === null ? 'steady' : avg >= 70 ? 'lifting' : avg >= 55 ? 'steady' : 'needs attention',
        },
        microMove: pickFallbackMove(pillar === 'AE' ? 'curriculum' : 'wellness', 'D', 'routine'),
        qasIndicators: BSC_PILLARS[pillar].qas,
      }
    }),
    watchlist: rows.map((r) => ({
      pupilHandle: r.pupilHandle,
      mentions: `${r.staff} staff · ${r.days} days`,
      pattern: r.pattern || '—',
      days: String(r.days),
      mark: 'D',
      status: 'Reviewed',
    })),
    weeklyBridge: {
      leader: composeLeaderBridge(rollups, weekOf),
      teacher: composeTeacherBridge(rollups, weekOf, rollups.length),
    },
  }
}
