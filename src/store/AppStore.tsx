/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Me, TodayBundle } from '../types/api'
import { Api, setBearer } from '../services/api'

/**
 * Server-backed app store. The server session — never client state — is the
 * source of identity, role and Champion capability (audit P0-1). This store
 * holds only: the bootstrapped identity, today's pulse bundle, and the
 * in-progress answer drafts.
 *
 * Drafts live in sessionStorage (cleared when the tab closes) so a mid-run
 * refresh keeps answers without persisting potentially sensitive free text
 * in durable browser storage (audit P0-2).
 */

interface AppStore {
  authReady: boolean
  me: Me | null
  login: (schoolCode: string, userCode: string, passcode: string) => Promise<void>
  logout: () => Promise<void>

  splashSeen: boolean
  markSplashSeen: () => void

  today: TodayBundle | null
  todayError: string | null
  refreshToday: () => Promise<void>

  drafts: Record<string, number | string>
  setDraft: (questionId: string, value: number | string) => void
  clearDrafts: () => void
  submitRun: () => Promise<TodayBundle>
  microMoveAction: (patch: { tried?: boolean; saved?: boolean }) => Promise<void>
}

const Ctx = createContext<AppStore | null>(null)

function draftsKey(me: Me | null, date: string | undefined) {
  return me && date ? `bloom:drafts:${me.id}:${date}` : null
}

function readDrafts(key: string | null): Record<string, number | string> {
  if (!key) return {}
  try {
    return JSON.parse(window.sessionStorage.getItem(key) ?? '{}')
  } catch {
    return {}
  }
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = useState(false)
  const [me, setMe] = useState<Me | null>(null)
  const [today, setToday] = useState<TodayBundle | null>(null)
  const [todayError, setTodayError] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, number | string>>({})
  const [splashSeen, setSplashSeen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('bloom:v1:splashSeen') === 'true'
    } catch {
      return true
    }
  })

  const loadToday = useCallback(async (who: Me) => {
    try {
      const bundle = await Api.pulseToday()
      setToday(bundle)
      setTodayError(null)
      setDrafts(readDrafts(draftsKey(who, bundle.date)))
    } catch (err) {
      setToday(null)
      setTodayError(err instanceof Error ? err.message : 'request_failed')
    }
  }, [])

  // Bootstrap the session once on mount.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const { me: user } = await Api.me()
        if (cancelled) return
        setMe(user)
        await loadToday(user)
      } catch {
        if (!cancelled) setMe(null)
      } finally {
        if (!cancelled) setAuthReady(true)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [loadToday])

  const login = useCallback(
    async (schoolCode: string, userCode: string, passcode: string) => {
      const { me: user, token } = await Api.login(schoolCode, userCode, passcode)
      setBearer(token)
      setMe(user)
      await loadToday(user)
    },
    [loadToday]
  )

  const logout = useCallback(async () => {
    try {
      await Api.logout()
    } catch {
      /* session may already be gone */
    }
    setBearer(null)
    setMe(null)
    setToday(null)
    setDrafts({})
  }, [])

  const setDraft = useCallback(
    (questionId: string, value: number | string) => {
      setDrafts((prev) => {
        const next = { ...prev, [questionId]: value }
        const key = draftsKey(me, today?.date)
        if (key) {
          try {
            window.sessionStorage.setItem(key, JSON.stringify(next))
          } catch {
            /* storage full/blocked — drafts stay in memory */
          }
        }
        return next
      })
    },
    [me, today?.date]
  )

  const clearDrafts = useCallback(() => {
    const key = draftsKey(me, today?.date)
    if (key) {
      try {
        window.sessionStorage.removeItem(key)
      } catch {
        /* ignore */
      }
    }
    setDrafts({})
  }, [me, today?.date])

  const submitRun = useCallback(async () => {
    const bundle = await Api.pulseSubmit(drafts)
    setToday(bundle)
    return bundle
  }, [drafts])

  const microMoveAction = useCallback(
    async (patch: { tried?: boolean; saved?: boolean }) => {
      await Api.microMove(patch)
      setToday((prev) =>
        prev?.microMove
          ? {
              ...prev,
              microMove: {
                ...prev.microMove,
                tried: patch.tried ?? prev.microMove.tried,
                saved: patch.saved ?? prev.microMove.saved,
              },
            }
          : prev
      )
    },
    []
  )

  const store = useMemo<AppStore>(
    () => ({
      authReady,
      me,
      login,
      logout,
      splashSeen,
      markSplashSeen: () => {
        setSplashSeen(true)
        try {
          window.localStorage.setItem('bloom:v1:splashSeen', 'true')
        } catch {
          /* ignore */
        }
      },
      today,
      todayError,
      refreshToday: async () => {
        if (me) await loadToday(me)
      },
      drafts,
      setDraft,
      clearDrafts,
      submitRun,
      microMoveAction,
    }),
    [authReady, me, login, logout, splashSeen, today, todayError, drafts, setDraft, clearDrafts, submitRun, microMoveAction, loadToday]
  )

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>
}

export function useAppStore(): AppStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useAppStore must be used inside AppStoreProvider')
  return ctx
}

/** Convenience for screens that render only when signed in. */
export function useMe(): Me {
  const { me } = useAppStore()
  if (!me) throw new Error('useMe outside an authenticated tree')
  return me
}
