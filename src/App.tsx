import { Component, lazy, Suspense, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AppStoreProvider, useAppStore } from './store/AppStore'
import { AppShell } from './components/AppShell'
import { BloomSplash } from './components/BloomSplash'
import { ErrorState, ScreenSkeleton } from './components/ui'
import { RoleSelect } from './screens/RoleSelect'
import { Today } from './screens/Today'
import { PulseCarousel } from './screens/PulseCarousel'
import { QuestionManager } from './screens/QuestionManager'
import { SurveyBuilder } from './screens/SurveyBuilder'
import { WhatsHot } from './screens/WhatsHot'
import { Profile } from './screens/Profile'

// Trends carries Recharts — code-split so the shell stays light.
const Trends = lazy(() => import('./screens/Trends').then((m) => ({ default: m.Trends })))

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          body="Bloom hit an unexpected error. Your answers are saved on this device — reloading will not lose them."
          onRetry={() => window.location.reload()}
        />
      )
    }
    return this.props.children
  }
}

function Shell() {
  const { account, splashSeen, markSplashSeen } = useAppStore()

  return (
    <>
      {/* Splash blocks on FIRST launch only (DESIGN_REVIEW P1.6) */}
      {!splashSeen ? <BloomSplash onDone={markSplashSeen} /> : null}
      {account === null ? (
        <RoleSelect />
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
