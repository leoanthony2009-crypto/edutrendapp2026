import type { Role, Survey, SurveyAudience, SurveyQuestion, SurveyStatus } from '../types/pulse'
import { enqueue } from './offlineQueue'
import { storage } from './storage'
import { isoNow } from './time'

/* Survey Builder persistence with a full lifecycle — launched surveys can be
   paused, resumed, closed and deleted (DESIGN_REVIEW P2-10). The 20-voice
   anonymity threshold is enforced where results are read, not just stated. */

const KEY = 'surveys'

export const ANONYMITY_THRESHOLD = 20

export function getSurveys(role: Role): Survey[] {
  return (storage.get<Survey[]>(KEY) ?? []).filter((s) => s.ownerRole === role)
}

export function launchSurvey(input: {
  ownerRole: Role
  title: string
  audience: SurveyAudience
  questions: SurveyQuestion[]
}): Survey {
  const survey: Survey = {
    id: crypto.randomUUID(),
    ownerRole: input.ownerRole,
    title: input.title.trim(),
    audience: input.audience,
    questions: input.questions,
    status: 'live',
    responses: 0,
    createdAt: isoNow(),
  }
  storage.set(KEY, [survey, ...(storage.get<Survey[]>(KEY) ?? [])])
  enqueue('surveyLaunch', survey)
  return survey
}

export function setSurveyStatus(id: string, status: SurveyStatus): void {
  storage.set(
    KEY,
    (storage.get<Survey[]>(KEY) ?? []).map((s) => (s.id === id ? { ...s, status } : s)),
  )
  enqueue('surveyStatus', { id, status })
}

export function deleteSurvey(id: string): void {
  storage.set(
    KEY,
    (storage.get<Survey[]>(KEY) ?? []).filter((s) => s.id !== id),
  )
  enqueue('surveyDelete', { id })
}

/** Results stay hidden below the 20-voice anonymity threshold. */
export function canShowResults(survey: Survey): boolean {
  return survey.responses >= ANONYMITY_THRESHOLD
}
