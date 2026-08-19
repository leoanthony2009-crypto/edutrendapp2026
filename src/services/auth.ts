import type { Role } from '../types/pulse'
import { storage } from './storage'

/* Local auth: the chosen role is persisted at first run and gates every role-only
   surface (DESIGN_REVIEW P1-7 — roles come from auth, not a free demo toggle).
   A real identity provider replaces this module; the shape below is what the app
   consumes. */

export interface Session {
  role: Role
  name: string
  subtitle: string
  initials: string
}

const PROFILES: Record<Role, Omit<Session, 'role'>> = {
  student: { name: 'Student F2-104', subtitle: 'Form 2 · handle, never your name', initials: 'F2' },
  teacher: { name: 'M. Persaud', subtitle: 'Form teacher · 12-day streak', initials: 'MP' },
  leader: { name: 'Sr. A. Joseph', subtitle: 'Principal · Pastoral Champion', initials: 'AJ' },
}

const KEY = 'session'

export function getSession(): Session | null {
  return storage.get<Session>(KEY)
}

export function signIn(role: Role): Session {
  const session: Session = { role, ...PROFILES[role] }
  storage.set(KEY, session)
  return session
}

export function signOut(): void {
  storage.remove(KEY)
}

export const ROLE_LABELS: Record<Role, string> = {
  student: 'Student · Form 2',
  teacher: 'Teacher · Form 2',
  leader: 'Leader · Principal',
}
