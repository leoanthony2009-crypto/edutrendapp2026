import type { SynodalMark } from './synodal'
import type { BSCPillar } from './bsc'

export type Role = 'student' | 'teacher' | 'leader'

export type QuestionDomain = 'infrastructure' | 'wellness' | 'curriculum' | 'one_child'
export type QuestionType = 'scale' | 'single_select' | 'multi_select' | 'free_text' | 'one_word' | 'pupil_anchor'

/** The "Prefer not to say" option label — always excluded from scoring. */
export const PREFER_NOT_TO_SAY = 'Prefer not to say'

export interface PulseQuestion {
  id: string
  theme: string // display theme; keys into THEME_COLORS
  text: string
  /** null/undefined = free text (rendered as a textarea) */
  options: string[] | null
  mark: SynodalMark
  routesTo: BSCPillar[]
  domain?: QuestionDomain
  /** Options run negative → positive (teacher scale questions). Default is positive-first. */
  scale?: boolean
  /** Informational multi-choice — excluded from scoring (leader attention/barrier questions). */
  neutral?: boolean
  /** Appears once a week (student reflection). */
  weekly?: boolean
  /** Non-empty free text on this question queues a Champion alert. */
  triggersChampion?: boolean
}

export interface PulseResponse {
  questionId: string
  value: string | number
  mark: SynodalMark
  submittedAt: string
}

export interface PulseSubmission {
  id: string
  role: Role
  date: string // YYYY-MM-DD in the school's timezone
  responses: PulseResponse[]
  /** 0–100 positive-first score across scoreable answers; null if none were scoreable. */
  score: number | null
  submittedAt: string
}

export interface OneChildEntry {
  pupilHandle: string // anonymised, e.g. "F2-073" — never the actual name
  yearGroup: string
  notedFor: string
  submittedBy: string
  submittedAt: string
}

export type TriageLabel = 'routine' | 'noticing' | 'concerned' | 'alarmed'

export interface ChampionAlert {
  id: string
  schoolId: string
  triggeredAt: string
  triggerType: 'free_text' | 'safeguarding' | 'pattern'
  pupilHandle?: string
  context: string
  marks: SynodalMark[]
  status: 'open' | 'reviewed' | 'actioned'
  championReadBy?: string
  readByDeadline: string // triggeredAt + 24h
}

export type SurveyAudience = 'My class' | 'Whole school' | 'Staff'
export type SurveyStatus = 'live' | 'paused' | 'closed'

export interface SurveyQuestion {
  id: string
  text: string
  options: string[] | null
}

export interface Survey {
  id: string
  ownerRole: Role
  title: string
  audience: SurveyAudience
  questions: SurveyQuestion[]
  status: SurveyStatus
  responses: number
  createdAt: string
}

export interface MicroMove {
  text: string
  reason: string
  tried: boolean
  saved: boolean
  date: string
}

export interface WatchlistRow {
  pupilHandle: string
  mentionCount: number
  dayCount: number
  pattern: string
  marks: SynodalMark[]
  action: 'Open' | 'Reviewed' | 'Parent contact' | 'Safeguarding'
}

export const THEME_COLORS: Record<string, { color: string; badgeColor: string }> = {
  Safety: { color: '#6E2B2F', badgeColor: '#6E2B2F' },
  Belonging: { color: '#8E6FB6', badgeColor: '#6E548D' },
  'Trusted adult': { color: '#295C4D', badgeColor: '#295C4D' },
  Voice: { color: '#C8A951', badgeColor: '#C8A951' },
  Fairness: { color: '#4A8AD0', badgeColor: '#2E6CAE' },
  'Peer treatment': { color: '#6E2B2F', badgeColor: '#6E2B2F' },
  Stress: { color: '#8E6FB6', badgeColor: '#6E548D' },
  Learning: { color: '#5BAA70', badgeColor: '#38754B' },
  Attendance: { color: '#4A8AD0', badgeColor: '#2E6CAE' },
  Home: { color: '#6F6A58', badgeColor: '#6F6A58' },
  Participation: { color: '#C8A951', badgeColor: '#C8A951' },
  Agency: { color: '#295C4D', badgeColor: '#295C4D' },
  Attention: { color: '#295C4D', badgeColor: '#295C4D' },
  Visibility: { color: '#4A8AD0', badgeColor: '#2E6CAE' },
  Response: { color: '#5BAA70', badgeColor: '#38754B' },
  Barriers: { color: '#8E6FB6', badgeColor: '#6E548D' },
  Action: { color: '#C8A951', badgeColor: '#C8A951' },
}
