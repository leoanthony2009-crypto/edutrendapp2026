/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import type {
  LaunchedSurvey,
  MicroMove,
  OneChildEntry,
  PulseQuestion,
  PulseRun,
  Role,
  SurveyAudience,
  SurveyDraftQuestion,
  SurveyStatus,
} from '../types/survey'
import { DEFAULT_BANKS } from '../data/questionBanks'
import { storage } from '../services/storage'
import { activeQuestions, todayISO } from '../services/rotation'
import { collateScore } from '../services/scoring'
import { triageFreeText } from '../services/triage'
import { generateMicroMove } from '../services/poui'
import { addOneChildEntry, queueAlert, shouldTriageAlert } from '../services/champion'

export interface Account {
  name: string
  role: Role
}

interface Drafts {
  date: string
  values: Record<string, number | string>
}

/**
 * DEMO SEED — mirrors the prototype so the unlock journey is demonstrable in
 * one session (teacher is 1 pulse from the 10-pulse Survey Builder unlock).
 * The counter's real source of truth moves server-side per user
 * (DESIGN_REVIEW P2.11); this seed lives only in the local demo store.
 */
const SEED_PULSES_COMPLETED: Record<Role, number> = { student: 0, teacher: 9, leader: 12 }

const SEED_SURVEYS: LaunchedSurvey[] = [
  {
    id: 'seed-survey-1',
    ownerRole: 'leader',
    title: 'Break-time supervision check',
    audience: 'Whole school',
    questions: [
      { id: 'sq1', text: 'Do you feel safe at break time?', options: ['Yes', 'Mostly', 'Not really', 'No'] },
      { id: 'sq2', text: 'Where do you spend most of break?', options: ['Yard', 'Corridor', 'Classroom', 'Library'] },
      { id: 'sq3', text: 'Is an adult easy to find at break?', options: ['Yes', 'Sometimes', 'No'] },
      { id: 'sq4', text: 'Anything about break time adults should know?', options: null },
    ],
    responses: 23,
    status: 'live',
    launchedAt: '2026-08-10T09:00:00.000Z',
  },
]

interface AppStore {
  // auth / role (DESIGN_REVIEW P1.7 — role from sign-in, not a demo cycler)
  account: Account | null
  signIn: (account: Account) => void
  signOut: () => void
  splashSeen: boolean
  markSplashSeen: () => void

  // question banks
  banks: Record<Role, PulseQuestion[]>
  updateBank: (role: Role, bank: PulseQuestion[]) => void
  resetBank: (role: Role) => void

  // today's carousel
  todaysQuestions: (role: Role) => PulseQuestion[]
  drafts: Record<string, number | string>
  setDraft: (questionId: string, value: number | string) => void
  clearDrafts: () => void
  runs: PulseRun[]
  todayRun: (role: Role) => PulseRun | undefined
  submitRun: (role: Role) => PulseRun

  // unlock + builder
  pulsesCompleted: Record<Role, number>
  surveys: LaunchedSurvey[]
  launchSurvey: (ownerRole: Role, title: string, audience: SurveyAudience, questions: SurveyDraftQuestion[]) => void
  setSurveyStatus: (id: string, status: SurveyStatus) => void
  deleteSurvey: (id: string) => void

  // POUI micro-move
  microMove: MicroMove | null
  moveTried: boolean
  moveSaved: boolean
  toggleTried: () => void
  toggleSaved: () => void

  // One Child + safeguarding
  submitOneChild: (entry: OneChildEntry) => void
  tellALeader: (note: string) => void

  // preferences
  bridgeDigest: boolean
  toggleBridgeDigest: () => void
  feedbackSent: boolean
  sendFeedback: () => void
}

const Ctx = createContext<AppStore | null>(null)

function usePersisted<T>(key: string, initial: T): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(() => storage.get<T>(key, initial))
  const set = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next
        storage.set(key, resolved)
        return resolved
      })
    },
    [key]
  )
  return [value, set]
}

export function AppStoreProvider({ children, now }: { children: ReactNode; now?: () => Date }) {
  const today = todayISO(now?.())

  const [account, setAccount] = usePersisted<Account | null>('account', null)
  const [splashSeen, setSplashSeen] = usePersisted<boolean>('splashSeen', false)
  const [banks, setBanks] = usePersisted<Record<Role, PulseQuestion[]>>('banks', DEFAULT_BANKS)
  const [draftState, setDraftState] = usePersisted<Drafts>('drafts', { date: today, values: {} })
  const [runs, setRuns] = usePersisted<PulseRun[]>('runs', [])
  const [pulsesCompleted, setPulsesCompleted] = usePersisted<Record<Role, number>>(
    'pulsesCompleted',
    SEED_PULSES_COMPLETED
  )
  const [surveys, setSurveys] = usePersisted<LaunchedSurvey[]>('surveys', SEED_SURVEYS)
  const [microMove, setMicroMove] = usePersisted<MicroMove | null>('microMove', null)
  const [moveTried, setMoveTried] = usePersisted<boolean>('moveTried', false)
  const [moveSaved, setMoveSaved] = usePersisted<boolean>('moveSaved', false)
  const [bridgeDigest, setBridgeDigest] = usePersisted<boolean>('bridgeDigest', true)
  const [feedbackSent, setFeedbackSent] = usePersisted<boolean>('feedbackSent', false)

  // Drafts are per-day: a stale draft from yesterday never leaks into today.
  const drafts = draftState.date === today ? draftState.values : {}

  const todaysQuestions = useCallback(
    (role: Role) => activeQuestions(role, banks[role], today),
    [banks, today]
  )

  const todayRun = useCallback(
    (role: Role) => runs.find((r) => r.role === role && r.date === today),
    [runs, today]
  )

  const setDraft = useCallback(
    (questionId: string, value: number | string) => {
      setDraftState((prev) => ({
        date: today,
        values: { ...(prev.date === today ? prev.values : {}), [questionId]: value },
      }))
    },
    [setDraftState, today]
  )

  const clearDrafts = useCallback(() => setDraftState({ date: today, values: {} }), [setDraftState, today])

  const submitRun = useCallback(
    (role: Role): PulseRun => {
      const questions = todaysQuestions(role)
      const score = collateScore(questions, drafts)
      const submittedAt = new Date().toISOString()
      const run: PulseRun = {
        id: `run-${role}-${today}`,
        role,
        date: today,
        score,
        submittedAt,
        responses: questions
          .filter((q) => drafts[q.id] !== undefined && drafts[q.id] !== '')
          .map((q) => ({ questionId: q.id, value: drafts[q.id], mark: q.mark, submittedAt })),
      }
      // Once per day: resubmitting replaces today's run instead of stacking.
      const isResubmit = runs.some((r) => r.role === role && r.date === today)
      setRuns((prev) => [...prev.filter((r) => !(r.role === role && r.date === today)), run])
      if (!isResubmit && role !== 'student') {
        setPulsesCompleted((prev) => ({ ...prev, [role]: (prev[role] ?? 0) + 1 }))
      }

      // Champion routing (spec § 4.2/4.3) — free text on flagged questions
      // always alerts; other free text alerts when triage says concerned+.
      for (const q of questions) {
        const value = drafts[q.id]
        if (typeof value !== 'string' || !value.trim()) continue
        if (q.triggersChampion) {
          queueAlert({ triggerType: 'free_text', context: value, marks: [q.mark] })
        } else {
          void triageFreeText(value).then((label) => {
            if (shouldTriageAlert(label)) queueAlert({ triggerType: 'free_text', context: value, marks: [q.mark] })
          })
        }
      }

      // POUI micro-move for teachers (spec § 5) — replaces the "Daily Read".
      if (role === 'teacher') {
        const freeText = questions
          .filter((q) => typeof drafts[q.id] === 'string' && String(drafts[q.id]).trim())
          .map((q) => String(drafts[q.id]))
          .join(' ')
        void triageFreeText(freeText).then((triageLabel) =>
          generateMicroMove({
            responses: questions
              .filter((q) => drafts[q.id] !== undefined && drafts[q.id] !== '')
              .map((q) => ({
                question: q.text,
                answer:
                  typeof drafts[q.id] === 'number' ? (q.options?.[drafts[q.id] as number] ?? '') : String(drafts[q.id]),
                mark: q.mark,
                domain: q.domain,
              })),
            triageLabel,
            termContext: 'T1 week 2, new school year settling in',
          }).then((move) => {
            setMicroMove(move)
            setMoveTried(false)
            setMoveSaved(false)
          })
        )
      }
      return run
    },
    [drafts, runs, setMicroMove, setMoveSaved, setMoveTried, setPulsesCompleted, setRuns, today, todaysQuestions]
  )

  const store = useMemo<AppStore>(
    () => ({
      account,
      signIn: (a) => setAccount(a),
      signOut: () => setAccount(null),
      splashSeen,
      markSplashSeen: () => setSplashSeen(true),
      banks,
      updateBank: (role, bank) => setBanks((prev) => ({ ...prev, [role]: bank })),
      resetBank: (role) => setBanks((prev) => ({ ...prev, [role]: DEFAULT_BANKS[role] })),
      todaysQuestions,
      drafts,
      setDraft,
      clearDrafts,
      runs,
      todayRun,
      submitRun,
      pulsesCompleted,
      surveys,
      launchSurvey: (ownerRole, title, audience, questions) =>
        setSurveys((prev) => [
          {
            id: `survey-${Date.now()}`,
            ownerRole,
            title,
            audience,
            questions,
            responses: 0,
            status: 'live' as const,
            launchedAt: new Date().toISOString(),
          },
          ...prev,
        ]),
      setSurveyStatus: (id, status) => setSurveys((prev) => prev.map((s) => (s.id === id ? { ...s, status } : s))),
      deleteSurvey: (id) => setSurveys((prev) => prev.filter((s) => s.id !== id)),
      microMove,
      moveTried,
      moveSaved,
      toggleTried: () => setMoveTried((v) => !v),
      toggleSaved: () => setMoveSaved((v) => !v),
      submitOneChild: (entry) => addOneChildEntry(entry),
      tellALeader: (note) =>
        queueAlert({
          triggerType: 'safeguarding',
          context: note.trim() || 'Safeguarding channel opened without a note.',
          marks: ['L'],
        }),
      bridgeDigest,
      toggleBridgeDigest: () => setBridgeDigest((v) => !v),
      feedbackSent,
      sendFeedback: () => setFeedbackSent(true),
    }),
    [
      account,
      banks,
      bridgeDigest,
      clearDrafts,
      drafts,
      feedbackSent,
      microMove,
      moveSaved,
      moveTried,
      pulsesCompleted,
      runs,
      setAccount,
      setBanks,
      setBridgeDigest,
      setFeedbackSent,
      setMicroMove,
      setMoveSaved,
      setMoveTried,
      setSplashSeen,
      setSurveys,
      splashSeen,
      submitRun,
      surveys,
      setDraft,
      todayRun,
      todaysQuestions,
    ]
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider')
  return ctx
}
