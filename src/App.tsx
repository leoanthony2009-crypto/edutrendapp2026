import { lazy, Suspense, useCallback, useState, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { BloomSplash } from './components/BloomSplash'
import { SessionContext } from './SessionContext'
import { getSession, type Session } from './services/auth'
import { seedDemoData } from './services/seed'
import { storage } from './services/storage'
import { RoleSelect } from './screens/RoleSelect'
import { Today } from './screens/Today'
import { PulseCarousel } from './screens/PulseCarousel'
import { QuestionManager } from './screens/QuestionManager'
import { SurveyBuilder } from './screens/SurveyBuilder'
import { WhatsHot } from './screens/WhatsHot'
import { PageSkeleton } from './components/states'

// Recharts is heavy — Trends loads on demand to keep the shell bundle lean.
const Trends = lazy(() => import('./screens/Trends').then((m) => ({ default: m.Trends })))
import { Profile } from './screens/Profile'
import { Watchlist } from './screens/Watchlist'

const SPLASH_KEY = 'splashShown'

export default function App() {
  // Splash blocks the first launch only (DESIGN_REVIEW P1-6).
  const [splashing, setSplashing] = useState(() => !storage.get<boolean>(SPLASH_KEY))
  const [session, setSession] = useState<Session | null>(() => {
    seedDemoData()
    return getSession()
  })

  const finishSplash = useCallback(() => {
    storage.set(SPLASH_KEY, true)
    setSplashing(false)
  }, [])

  const refreshSession = useCallback(() => setSession(getSession()), [])

  if (splashing) return <BloomSplash onDone={finishSplash} />

  if (!session) {
    return <RoleSelect onSignedIn={refreshSession} />
  }

  // Role gating: students never reach the manager, builder or Champion surfaces
  // (README § Role model).
  const staffOnly = (element: ReactNode) =>
    session.role === 'student' ? <Navigate to="/today" replace /> : element
  const leaderOnly = (element: ReactNode) =>
    session.role === 'leader' ? element : <Navigate to="/today" replace />

  return (
    <SessionContext.Provider value={{ session, refreshSession }}>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-row focus:bg-green focus:px-4 focus:py-2 focus:text-ondark"
      >
        Skip to content
      </a>
      <AppShell session={session}>
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          <Route path="/today" element={<Today />} />
          <Route path="/pulse" element={<PulseCarousel />} />
          <Route path="/pulse/manage" element={staffOnly(<QuestionManager />)} />
          <Route path="/builder" element={staffOnly(<SurveyBuilder />)} />
          <Route
            path="/trends"
            element={
              <Suspense fallback={<PageSkeleton />}>
                <Trends />
              </Suspense>
            }
          />
          <Route path="/whats-hot" element={<WhatsHot />} />
          <Route path="/watchlist" element={leaderOnly(<Watchlist />)} />
          <Route path="/profile" element={<Profile />} />
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </AppShell>
    </SessionContext.Provider>
  )
}
