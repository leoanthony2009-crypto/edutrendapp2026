import type { PulseRollup } from '../types/bsc'
import { BSC_PILLARS, type BSCPillar } from '../types/bsc'
import { SYNODAL_MARKS, type SynodalMark } from '../types/synodal'
import { marksTotals } from './rollup'
import { watchlist } from './champion'
import { gemini } from './gemini'

/**
 * Weekly Bridge digest (PASTORAL_PULSE_SPEC § 6) — leader and teacher
 * versions, generated Fridays from the week's rollups. Gemini writes the
 * prose when connected; the template composer below is the offline fallback.
 */
export interface WeeklyBridge {
  weekOf: string
  leader: string
  teacher: string
}

const MARK_KEYS: SynodalMark[] = ['R', 'L', 'D', 'SE']

function synodalRead(rollups: PulseRollup[]): { hollow: SynodalMark; overflowing: SynodalMark } {
  const totals = marksTotals(rollups)
  let hollow: SynodalMark = 'R'
  let overflowing: SynodalMark = 'R'
  for (const m of MARK_KEYS) {
    if (totals[m] < totals[hollow]) hollow = m
    if (totals[m] > totals[overflowing]) overflowing = m
  }
  return { hollow, overflowing }
}

export function composeLeaderBridge(rollups: PulseRollup[], weekOf: string): string {
  const { hollow, overflowing } = synodalRead(rollups)
  const rows = watchlist()
  const avgParticipation = rollups.length
    ? Math.round(rollups.reduce((s, r) => s + r.participation, 0) / rollups.length)
    : 0
  const pillarLines = (Object.keys(BSC_PILLARS) as BSCPillar[])
    .map((p) => {
      const scores = rollups.map((r) => r.byPillar[p].avgScore).filter((v) => v > 0)
      const avg = scores.length ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 100) : null
      const flags = rollups.reduce((s, r) => s + r.byPillar[p].flagCount, 0)
      return `${BSC_PILLARS[p].label}: ${avg === null ? 'no scaled signal this week' : `pulse signal ${avg}/100`}${flags ? `, ${flags} flagged note${flags === 1 ? '' : 's'}` : ''}.`
    })
    .join('\n')

  return `SYNODAL READ OF THE WEEK
${SYNODAL_MARKS[hollow].label} is currently hollow — ${SYNODAL_MARKS[hollow].description.toLowerCase()} ${SYNODAL_MARKS[overflowing].label} is overflowing. Average staff participation ${avgParticipation}%.

CHAMPION ATTENTION
${rows.length === 0 ? 'No pupils currently meet the watchlist threshold.' : rows.map((r) => `${r.pupilHandle} — ${r.mentions} mentions across ${r.days} days (${r.staff} staff).`).join('\n')}

BSC IMPLICATION
${pillarLines}

Week of ${weekOf}.`
}

export function composeTeacherBridge(rollups: PulseRollup[], weekOf: string, myRuns: number): string {
  const { overflowing } = synodalRead(rollups)
  return `WHAT YOUR WEEK REVEALED
You completed ${myRuns} pulse${myRuns === 1 ? '' : 's'} this week; the Mark you touched most was ${SYNODAL_MARKS[overflowing].label}. Pupil mentions stay anonymised — handles, never names.

WHAT NEXT WEEK MIGHT HOLD
Term pace is steady; keep the two-minute contract. One POUI move waits on your Today screen each morning.

ONE SENTENCE TO TAKE HOME
You showed up and said how it really was — that is the whole job of the Pulse.

Week of ${weekOf}.`
}

export async function generateWeeklyBridge(
  rollups: PulseRollup[],
  weekOf: string,
  myRuns: number
): Promise<WeeklyBridge> {
  try {
    const prompt = `Write the Bloom Weekly Bridge digest (leader + teacher versions) from this JSON rollup data. Caribbean register, never preachy.\n${JSON.stringify(rollups)}`
    const text = await gemini.generateText(prompt)
    const [leader, teacher] = text.split('\n---\n')
    if (leader && teacher) return { weekOf, leader, teacher }
    throw new Error('bad shape')
  } catch {
    return {
      weekOf,
      leader: composeLeaderBridge(rollups, weekOf),
      teacher: composeTeacherBridge(rollups, weekOf, myRuns),
    }
  }
}
