import type { SynodalMark } from './synodal'

export type Role = 'student' | 'teacher' | 'leader'
export type YearTier = 'junior' | 'senior'

export interface Me {
  id: string
  name: string
  role: Role
  isChampion: boolean
  displayHandle: string | null
  yearTier: YearTier
  school: {
    name: string
    code: string
    timezone: string
    board: string | null
    schoolType: string | null
    location: string | null
  }
}

export interface ApiQuestion {
  id: string
  theme: string
  domain: string
  type: string
  text: string
  options?: string[]
  scale?: boolean
  neutral?: boolean
  weekly?: boolean
  mark: SynodalMark
  routesTo: string[]
  triggersChampion?: boolean
  perception?: string
  juniorText?: string
}

export interface MicroMoveState {
  text: string
  reason: string
  source: string
  tried: boolean
  saved: boolean
  helped: string | null
}

export interface TodayBundle {
  date: string
  questions: ApiQuestion[]
  run: { score: number | null; submittedAt: string; answers: Record<string, number | string> } | null
  pulsesCompleted: number
  streak: number
  microMove: MicroMoveState | null
}

export interface ApiAlert {
  id: string
  triggerType: 'free_text' | 'safeguarding' | 'pattern'
  pupilHandle: string | null
  context: string
  marks: SynodalMark[]
  status: 'open' | 'reviewed' | 'actioned'
  createdAt: string
  readByDeadline: string
  readAt: string | null
  outcome: string | null
  outcomeNote: string | null
  closedAt: string | null
  escalatedAt: string | null
}

export interface WatchlistRow {
  pupilHandle: string
  mentions: number
  days: number
  staff: number
  pattern: string
  marks: SynodalMark[]
  action: string | null
}

export interface ChampionOverview {
  alerts: ApiAlert[]
  watchlist: WatchlistRow[]
}

export interface AlertEvent {
  type: string
  actorId: string | null
  data: Record<string, unknown>
  at: string
}

export interface MyReport {
  id: string
  triggerType: string
  createdAt: string
  readAt: string | null
  status: string
}

export type SurveyStatus = 'draft' | 'live' | 'paused' | 'closed'

export interface SurveyQuestionDraft {
  id: string
  text: string
  options: string[] | null
}

export interface ApiSurvey {
  id: string
  title: string
  purpose: string
  audience: 'My class' | 'Whole school' | 'Staff'
  yearGroups: YearTier[]
  questions: SurveyQuestionDraft[]
  status: SurveyStatus
  tracker: boolean
  seriesId: string | null
  closeDate: string | null
  createdAt: string
  launchedAt: string | null
  closedAt: string | null
  responses: number
  answered?: boolean
}

export interface GuardrailFinding {
  code: string
  message: string
  suggestion?: { label: string; text?: string; split?: string[] }
}

export interface GuardrailCheck {
  id: string
  findings: GuardrailFinding[]
}

export interface SurveyResultsPayload {
  survey: ApiSurvey
  kAnon: number
  seriesTrend: Array<{ launchedAt: string; voices: number; positive: number | null; suppressed: boolean }> | null
  results: {
    totalResponses: number
    voices: number
    filtered: boolean
    suppressed: boolean
    firstResponseAt: string | null
    lastResponseAt: string | null
    questions: Array<{
      id: string
      text: string
      type: 'choice' | 'free_text'
      answered: number
      options?: Array<{ label: string; count: number; pct: number }>
      quotes?: string[]
      quotesSuppressed?: boolean
    }>
  }
}

export interface AnalyticsSummary {
  range: string
  today: string
  trend: Array<{ date: string; voices: number; value: number | null }>
  todayScore: number | null
  todayVoices: number
  domains: Array<{ domain: string; value: number | null; delta: number | null; voices: number; suppressed: boolean }>
  participation: Array<{ date: string; pct: number; voices: number }>
  perceptionGap: {
    pupil: { pct: number | null; voices: number; suppressed: boolean }
    staff: { pct: number | null; voices: number; suppressed: boolean }
  }
  themes: Array<{ label: string; value: number; voices: number }>
  kAnon: number
}

export interface SchoolAction {
  id: string
  signal: string
  action: string
  at: string
}

export interface BridgePayload {
  weekOf: string
  isFriday: boolean
  version: 'leader' | 'teacher'
  sections: Array<{ title: string; body: string }>
}

export interface PulseHistory {
  history: Array<{ date: string; score: number | null; submittedAt: string }>
  streak: number
}
