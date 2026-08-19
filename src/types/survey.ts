import type { SynodalMark } from './synodal'
import type { BSCPillar } from './bsc'

export type Role = 'student' | 'teacher' | 'leader'

export type QuestionDomain = 'infrastructure' | 'wellness' | 'curriculum' | 'one_child'
export type QuestionType = 'scale' | 'single_select' | 'multi_select' | 'free_text' | 'one_word' | 'pupil_anchor'

/** A question in one of the role carousels ("Your Voice Today" / Daily Pulse / Leader Pulse). */
export interface PulseQuestion {
  id: string
  domain: QuestionDomain
  type: QuestionType
  text: string
  /** For choice questions. Ordered best-first, except `scale` questions which are worst-first. */
  options?: string[]
  mark: SynodalMark
  routesTo: BSCPillar[]
  /** Does this question's free-text route to the Pastoral Champion. */
  triggersChampion?: boolean
  /** Display theme label shown on the question badge (e.g. "Safety", "Belonging"). */
  theme: string
  /** `scale` options run worst→best (e.g. "Not at all" → "Fully"). */
  scale?: boolean
  /** Excluded from the pulse score (e.g. "which concern" pickers with no good/bad order). */
  neutral?: boolean
  /** Student weekly reflection question — rotated in once a week, not daily. */
  weekly?: boolean
}

export interface PulseResponse {
  questionId: string
  value: string | number | string[]
  mark: SynodalMark // copied for audit
  submittedAt: string // ISO datetime
}

/** One completed carousel run (a submitted pulse) for a role on a date. */
export interface PulseRun {
  id: string
  role: Role
  date: string // YYYY-MM-DD
  responses: PulseResponse[]
  /** Collated 0–100 score for the run; null when nothing scorable was answered. */
  score: number | null
  submittedAt: string
}

/** One Child anchor — an anonymised pupil the teacher is holding in mind. */
export interface OneChildEntry {
  pupilHandle: string // anonymised, e.g. "Y4-073" — never the actual name
  yearGroup: string
  notedFor: string // free text, max 120 chars
  submittedBy: string // teacher ID
  submittedAt: string
}

export type TriageLabel = 'routine' | 'noticing' | 'concerned' | 'alarmed'

export interface ChampionAlert {
  id: string
  schoolId: string
  triggeredAt: string
  triggerType: 'free_text' | 'safeguarding' | 'pattern'
  pupilHandle?: string
  context: string // the response that triggered, sanitised
  marks: SynodalMark[]
  status: 'open' | 'reviewed' | 'actioned'
  championReadBy?: string // teacher ID of Champion who has acknowledged
  readByDeadline: string // submittedAt + 24h
}

export type SurveyAudience = 'My class' | 'Whole school' | 'Staff'
export type SurveyStatus = 'live' | 'paused' | 'closed'

export interface SurveyDraftQuestion {
  id: string
  text: string
  options: string[] | null // null = free text
}

/** A survey launched from the Survey Builder. */
export interface LaunchedSurvey {
  id: string
  ownerRole: Role
  title: string
  audience: SurveyAudience
  questions: SurveyDraftQuestion[]
  responses: number
  status: SurveyStatus
  launchedAt: string
}

export interface MicroMove {
  text: string
  source: 'poui' | 'fallback'
  reason: string
}
