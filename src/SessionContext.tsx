import { createContext, useContext } from 'react'
import type { Session } from './services/auth'

export interface SessionContextValue {
  session: Session
  refreshSession: () => void
}

export const SessionContext = createContext<SessionContextValue | null>(null)

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionContext')
  return ctx
}
