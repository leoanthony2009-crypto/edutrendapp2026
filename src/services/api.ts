import type {
  AnalyticsSummary,
  ApiQuestion,
  ApiSurvey,
  BridgePayload,
  ChampionOverview,
  AlertEvent,
  GuardrailCheck,
  Me,
  MyReport,
  PulseHistory,
  SchoolAction,
  SurveyQuestionDraft,
  SurveyResultsPayload,
  TodayBundle,
  YearTier,
} from '../types/api'

/**
 * API client. Browser sessions ride the httpOnly cookie; test environments
 * (jsdom has no cookie jar) use the bearer token returned by login.
 */
declare global {
  var __BLOOM_API_BASE__: string | undefined
}

let bearer: string | null = null
export function setBearer(token: string | null) {
  bearer = token
}

export class ApiError extends Error {
  status: number
  constructor(status: number, code: string) {
    super(code)
    this.status = status
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const base = globalThis.__BLOOM_API_BASE__ ?? ''
  const res = await fetch(`${base}/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      'x-bloom-client': '1',
      ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  if (!res.ok) {
    let code = `http_${res.status}`
    try {
      const json = await res.json()
      if (json?.error) code = json.error
    } catch {
      /* non-JSON error */
    }
    throw new ApiError(res.status, code)
  }
  return (await res.json()) as T
}

export const Api = {
  login: (schoolCode: string, userCode: string, passcode: string) =>
    request<{ me: Me; token: string }>('POST', '/auth/login', { schoolCode, userCode, passcode }),
  logout: () => request<{ ok: true }>('POST', '/auth/logout'),
  me: () => request<{ me: Me }>('GET', '/auth/me'),

  pulseToday: () => request<TodayBundle>('GET', '/pulse/today'),
  pulseSubmit: (answers: Record<string, number | string>) => request<TodayBundle>('POST', '/pulse/submit', { answers }),
  pulseHistory: () => request<PulseHistory>('GET', '/pulse/history'),
  oneChild: (entry: { yearGroup: string; handle: string; notedFor: string }) =>
    request<{ ok: true; pupilHandle: string }>('POST', '/pulse/one-child', entry),
  microMove: (patch: { tried?: boolean; saved?: boolean }) => request<{ ok: true }>('POST', '/pulse/micro-move', patch),
  microMoveFollowup: () => request<{ followup: { date: string; text: string } | null }>('GET', '/pulse/micro-move/followup'),
  answerFollowup: (date: string, helped: 'Yes' | 'A little' | 'No') =>
    request<{ ok: true }>('POST', '/pulse/micro-move/followup', { date, helped }),

  bank: (role: string) => request<{ role: string; bank: ApiQuestion[] }>('GET', `/banks/${role}`),
  saveBank: (role: string, bank: ApiQuestion[]) => request<{ ok: true }>('PUT', `/banks/${role}`, { bank }),

  tellALeader: (note: string) => request<{ ok: true; alertId: string }>('POST', '/tell-a-leader', { note }),
  myReports: () => request<{ reports: MyReport[] }>('GET', '/my-reports'),
  championOverview: () => request<ChampionOverview>('GET', '/champion/overview'),
  alertEvents: (id: string) => request<{ events: AlertEvent[] }>('GET', `/champion/alerts/${id}/events`),
  alertRead: (id: string) => request<{ alert: unknown }>('POST', `/champion/alerts/${id}/read`),
  alertClose: (id: string, outcome: string, note: string) =>
    request<{ alert: unknown }>('POST', `/champion/alerts/${id}/close`, { outcome, note }),
  watchlistAction: (handle: string, action: string) =>
    request<{ ok: true }>('POST', `/champion/watchlist/${encodeURIComponent(handle)}/action`, { action }),

  surveys: () => request<{ mine: ApiSurvey[]; open: ApiSurvey[] }>('GET', '/surveys'),
  createSurvey: (body: {
    title: string
    purpose?: string
    audience: string
    yearGroups?: YearTier[]
    questions: SurveyQuestionDraft[]
    closeDate?: string | null
    tracker?: boolean
  }) => request<{ survey: ApiSurvey; checks: GuardrailCheck[] }>('POST', '/surveys', body),
  updateSurvey: (id: string, body: Record<string, unknown>) => request<{ survey: ApiSurvey }>('PATCH', `/surveys/${id}`, body),
  deleteSurvey: (id: string) => request<{ ok: true }>('DELETE', `/surveys/${id}`),
  launchSurvey: (id: string) => request<{ survey: ApiSurvey }>('POST', `/surveys/${id}/launch`),
  relaunchSurvey: (id: string) => request<{ survey: ApiSurvey }>('POST', `/surveys/${id}/relaunch`),
  respondSurvey: (id: string, answers: Record<string, number | string>) =>
    request<{ ok: true }>('POST', `/surveys/${id}/respond`, { answers }),
  surveyResults: (id: string, yearTier?: YearTier) =>
    request<SurveyResultsPayload>('GET', `/surveys/${id}/results${yearTier ? `?yearTier=${yearTier}` : ''}`),

  guardrails: (questions: SurveyQuestionDraft[], audience?: 'junior' | 'senior') =>
    request<{ checks: GuardrailCheck[] }>('POST', '/poui/guardrails', { questions, audience }),
  draftQuestions: (topic: string, count = 3) =>
    request<{ suggestions: Array<SurveyQuestionDraft & { source: string }>; source: string }>('POST', '/poui/draft', { topic, count }),

  analytics: (range: '7d' | '30d' | 'term') => request<AnalyticsSummary>('GET', `/analytics/summary?range=${range}`),
  actions: () => request<{ actions: SchoolAction[] }>('GET', '/actions'),
  logAction: (signal: string, action: string) => request<{ ok: true }>('POST', '/actions', { signal, action }),
  bridge: () => request<BridgePayload>('GET', '/bridge/latest'),
  bscExport: () => request<Record<string, unknown>>('GET', '/bsc/export'),

  prefs: () => request<{ bridgeDigest: boolean }>('GET', '/prefs'),
  savePrefs: (bridgeDigest: boolean) => request<{ ok: true }>('PUT', '/prefs', { bridgeDigest }),
  sendFeedback: (text: string) => request<{ ok: true }>('POST', '/feedback', { text }),
}
