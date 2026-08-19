import { BSC_PILLARS, type BSCExport, type BSCPillar } from '../types/bsc'
import { getWatchlist } from './champion'
import { getStreak } from './pulses'
import { getRollup } from './rollup'
import { generateBridge } from './bridge'
import { SCHOOL_CONFIG, isoNow } from './time'
import { getTodayMicroMove } from './poui'

/* Dashboard export (PASTORAL_PULSE_SPEC § 7): the JSON contract the BSC PowerPoint
   template consumes, per school per cycle. */

export function buildBSCExport(): BSCExport {
  const rollup = getRollup()
  const watchlist = getWatchlist()
  const bridge = generateBridge()
  const move = getTodayMicroMove()

  return {
    schoolName: SCHOOL_CONFIG.schoolName,
    sdpCycle: '2025–2028',
    generatedAt: isoNow(),
    studentsEnrolled: 612,
    teachingStaff: 38,
    seaAverage: 61.4,
    sbmCurriculum: 3,
    sbmStudentServices: 2,
    sbmCommunity: 3,
    pulseStatus: {
      participationPct: rollup.participation,
      onWatchlist: watchlist.length,
      avgStreak: getStreak(),
    },
    pillars: (Object.keys(BSC_PILLARS) as BSCPillar[]).map((pillar) => ({
      pillar,
      objectives: [
        {
          label: `${BSC_PILLARS[pillar].label} — pastoral signal`,
          baseline: 'Term 1 pulse baseline',
          target: '+5 pts by cycle end',
          mark: 'D',
          status: rollup.byPillar[pillar].avgScore >= 0.7 ? 3 : rollup.byPillar[pillar].avgScore > 0 ? 2 : 1,
        },
      ],
      pulseFeed: {
        summary:
          rollup.byPillar[pillar].avgScore > 0
            ? `Avg pulse signal ${Math.round(rollup.byPillar[pillar].avgScore * 100)}/100 today`
            : 'Qualitative signal only today',
        signal: rollup.byPillar[pillar].flagCount > 0 ? 'flags raised' : 'steady',
      },
      microMove: move?.text ?? '—',
      qasIndicators: BSC_PILLARS[pillar].qas,
    })),
    watchlist: watchlist.map((w) => ({
      pupilHandle: w.pupilHandle,
      mentions: `${w.mentionCount} staff · ${w.dayCount} days`,
      pattern: w.pattern,
      days: `${w.dayCount}`,
      mark: w.marks[0] ?? 'D',
      status: w.action,
    })),
    weeklyBridge: {
      leader: `${bridge.leader.synodalRead}\n${bridge.leader.championAttention}\n${bridge.leader.bscImplication}`,
      teacher: `${bridge.teacher.weekRevealed}\n${bridge.teacher.nextWeek}\n${bridge.teacher.takeHome}`,
    },
  }
}
