import type { SynodalMark } from './synodal'

export type BSCPillar = 'AE' | 'SD' | 'TL' | 'CS'

export const BSC_PILLARS: Record<BSCPillar, { label: string; color: string; qas: string[] }> = {
  AE: { label: 'Academic Excellence', color: '#295C4D', qas: ['S1', 'S3'] },
  SD: { label: 'Student Development', color: '#6E2B2F', qas: ['S3'] },
  TL: { label: 'Teaching & Leadership', color: '#2E5266', qas: ['S1', 'S2'] },
  CS: { label: 'Community & Stakeholders', color: '#6E548D', qas: ['S4', 'S5'] },
}

export interface PulseRollup {
  schoolId: string
  date: string // YYYY-MM-DD
  participation: number // % of staff who completed today's Pulse
  byMark: Record<SynodalMark, number> // count of responses per Mark
  byPillar: Record<
    BSCPillar,
    {
      avgScore: number // for scale questions, normalised 0-1
      qualitativeCount: number // count of free-text submissions
      flagCount: number // count of triggersChampion submissions
    }
  >
  oneChildEntries: number
  safeguardingTriggers: number
}

export interface BSCExport {
  schoolName: string
  sdpCycle: string
  generatedAt: string
  studentsEnrolled: number
  teachingStaff: number
  seaAverage: number
  sbmCurriculum: number
  sbmStudentServices: number
  sbmCommunity: number
  pulseStatus: {
    participationPct: number
    onWatchlist: number
    avgStreak: number
  }
  pillars: Array<{
    pillar: BSCPillar
    objectives: Array<{
      label: string
      baseline: string
      target: string
      mark: SynodalMark
      status: 1 | 2 | 3 | 4
    }>
    pulseFeed: { summary: string; signal: string }
    microMove: string
    qasIndicators: string[]
  }>
  watchlist: Array<{
    pupilHandle: string
    mentions: string // e.g. "3 staff · 4 days"
    pattern: string
    days: string
    mark: SynodalMark
    status: string
  }>
  weeklyBridge: { leader: string; teacher: string }
}
