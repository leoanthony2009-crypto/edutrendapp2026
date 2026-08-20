import { Component, lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router-dom'
import { ShieldQuestion } from 'lucide-react'
import { AppStoreProvider, useAppStore } from './store/AppStore'
import { AppShell } from './components/AppShell'
import { BloomSplash } from './components/BloomSplash'
import { DemoBanner } from './components/DemoBanner'
import { ErrorState, ScreenSkeleton } from './components/ui'
import { Login } from './screens/Login'
import { Today } from './screens/Today'
import { PulseCarousel } from './screens/PulseCarousel'
import { QuestionManager } from './screens/QuestionManager'
import { SurveyBuilder } from './screens/SurveyBuilder'
import { SurveyAnswer } from './screens/SurveyAnswer'
import { WhatsHot } from './screens/WhatsHot'
import { Profile } from './screens/Profile'
import { ChampionWorkspace } from './screens/ChampionWorkspace'
import { BridgeScreen } from './screens/BridgeScreen'

const Trends = lazy(() => import('./screens/Trends').then((m) => ({ default: m.Trends })))
const SurveyResults = lazy(() => import('./screens/SurveyResults').then((m) => ({ default: m.SurveyResults })))

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          body="Bloom hit an unexpected error. Your submitted answers are safe on the school server — reloading will not lose them."
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}

/** Explicit permission-denied state — no more silent redirects (audit P2-9). */
export function PermissionDenied({ need }: { need: string }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-10 pt-20 text-center">
      <ShieldQuestion aria-hidden="true" className="h-8 w-8 text-ink-meta" />
      <h1 className="font-display text-lg font-bold text-ink">This area isn't part of your role</h1>
      <p className="text-[12.5px] leading-relaxed text-ink-meta">{need}</p>
      <Link to="/today" className="mt-1.5 inline-block rounded-input bg-bloom-green px-5 py-3 text-[13px] font-extrabold text-on-dark">
        Back to Today
      </Link>
    </div>
  )
}

function Shell() {
  const { authReady, me, splashSeen, markSplashSeen } = useAppStore()

  return (
    <>
      {!splashSeen ? <BloomSplash onDone={markSplashSeen} /> : null}
      <DemoBanner />
      {!authReady ? (
        <ScreenSkeleton />
      ) : me === null ? (
        <Login />
      ) : (
        <AppShell>
          <Routes>
            <Route path="/" element={<Navigate to="/today" replace />} />
            <Route path="/today" element={<Today />} />
            <Route path="/pulse" element={<PulseCarousel />} />
            <Route
              path="/trends"
              element={
                <Suspense fallback={<ScreenSkeleton />}>
                  <Trends />
                </Suspense>
              }
            />
            <Route path="/hot" element={<WhatsHot />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/manage" element={<QuestionManager />} />
            <Route path="/builder" element={<SurveyBuilder />} />
            <Route
              path="/surveys/:id/results"
              element={
                <Suspense fallback={<ScreenSkeleton />}>
                  <SurveyResults />
                </Suspense>
              }
            />
            <Route path="/surveys/:id/answer" element={<SurveyAnswer />} />
            <Route path="/champion" element={<ChampionWorkspace />} />
            <Route path="/bridge" element={<BridgeScreen />} />
            <Route path="*" element={<Navigate to="/today" replace />} />
          </Routes>
        </AppShell>
      )}
    </>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppStoreProvider>
        <BrowserRouter>
          <Shell />
        </BrowserRouter>
      </AppStoreProvider>
    </ErrorBoundary>
  )
}
