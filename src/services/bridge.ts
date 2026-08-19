import { SYNODAL_MARKS, type SynodalMark } from '../types/synodal'
import { BSC_PILLARS, type BSCPillar } from '../types/bsc'
import { getWatchlist } from './champion'
import { getPulsesCompleted } from './pulses'
import { getRollup } from './rollup'
import { weekDelta } from './trends'

/* Weekly Bridge digest (PASTORAL_PULSE_SPEC § 6): a leader version and a teacher
   version generated from the week's rollup. Deterministic template generation here;
   the Gemini adapter can replace the sentence assembly without changing the shape. */

export interface BridgeDigest {
  leader: { synodalRead: string; championAttention: string; bscImplication: string }
  teacher: { weekRevealed: string; nextWeek: string; takeHome: string }
}

function markExtremes(byMark: Record<SynodalMark, number>): { hollow: SynodalMark; overflowing: SynodalMark } {
  const entries = Object.entries(byMark) as [SynodalMark, number][]
  const sorted = [...entries].sort((a, b) => a[1] - b[1])
  return { hollow: sorted[0][0], overflowing: sorted[sorted.length - 1][0] }
}

export function generateBridge(): BridgeDigest {
  const rollup = getRollup()
  const watchlist = getWatchlist()
  const delta = weekDelta()
  const { hollow, overflowing } = markExtremes(rollup.byMark)
  const active = (Object.entries(rollup.byPillar) as [BSCPillar, { avgScore: number; qualitativeCount: number }][])
    .filter(([, v]) => v.avgScore > 0 || v.qualitativeCount > 0)

  return {
    leader: {
      synodalRead:
        `${SYNODAL_MARKS[hollow].label} is running hollow this week — few responses touched it — while ` +
        `${SYNODAL_MARKS[overflowing].label} is overflowing. Worth asking why one is quiet.`,
      championAttention: watchlist.length
        ? `${watchlist.length} pupil${watchlist.length === 1 ? '' : 's'} on the Watchlist: ` +
          watchlist.map((w) => `${w.pupilHandle} (${w.mentionCount} mentions · ${w.dayCount} days)`).join(', ') +
          '. All within the 24-hour read window.'
        : 'No pupils met the Watchlist pattern this week. The channel stayed open and quiet.',
      bscImplication: active.length
        ? active
            .map(
              ([pillar, v]) =>
                `${BSC_PILLARS[pillar].label}: pulse signal ${v.avgScore > 0 ? Math.round(v.avgScore * 100) + '/100' : 'qualitative only'} this week.`,
            )
            .join(' ')
        : 'Too few pulses this week to move any pillar — participation is the first lever.',
    },
    teacher: {
      weekRevealed:
        `You completed ${getPulsesCompleted('teacher')} pulses so far. The school pulse moved ` +
        `${delta >= 0 ? 'up' : 'down'} ${Math.abs(delta)} point${Math.abs(delta) === 1 ? '' : 's'} on last week. ` +
        'Pupil mentions stayed anonymised throughout.',
      nextWeek:
        'SBA season is close — expect heavier days. One small routine held steady beats three new ones.',
      takeHome: 'You showed up and asked. That is the whole job some weeks.',
    },
  }
}
