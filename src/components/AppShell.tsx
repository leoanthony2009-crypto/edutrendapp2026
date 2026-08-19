import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Flower2, House, Sparkles, TrendingUp, UserRound } from 'lucide-react'
import { BloomLogo } from './BloomLogo'
import { ROLE_LABELS, type Session } from '../services/auth'
import { SCHOOL_CONFIG } from '../services/time'

const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: House },
  { to: '/trends', label: 'Trends', icon: TrendingUp },
  { to: '/pulse', label: 'Pulse', icon: Flower2 },
  { to: '/whats-hot', label: "What's Hot", icon: Sparkles },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

function navActive(pathname: string, to: string): boolean {
  if (to === '/pulse') return pathname.startsWith('/pulse')
  return pathname.startsWith(to)
}

export function AppShell({ session, children }: { session: Session; children: ReactNode }) {
  const { pathname } = useLocation()

  return (
    <div className="min-h-dvh bg-cream text-ink md:flex">
      {/* Side rail — desktop/tablet (README § Navigation) */}
      <aside className="hidden md:flex md:w-56 md:flex-none md:flex-col md:gap-1 md:border-r md:border-line md:px-4 md:py-6 lg:w-64">
        <div className="mb-6 flex items-center gap-2.5 px-2">
          <BloomLogo size={32} />
          <div>
            <div className="font-display text-lg font-extrabold leading-none text-green">Bloom</div>
            <div className="mt-1 text-[10px] text-meta">{SCHOOL_CONFIG.schoolName}</div>
          </div>
        </div>
        <nav aria-label="Main">
          <ul className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
              const active = navActive(pathname, to)
              return (
                <li key={to}>
                  <NavLink
                    to={to}
                    aria-current={active ? 'page' : undefined}
                    className={`flex min-h-11 items-center gap-3 rounded-row px-3 py-2.5 text-[13.5px] transition-colors ${
                      active ? 'bg-cream-dim font-extrabold text-green' : 'font-semibold text-meta hover:bg-cream-dim hover:text-ink'
                    }`}
                  >
                    <Icon aria-hidden="true" className="h-[18px] w-[18px]" />
                    {label}
                  </NavLink>
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="mt-auto px-3 text-[10.5px] leading-relaxed text-meta">
          {ROLE_LABELS[session.role]}
          <br />
          Every Child, Every Chance
        </div>
      </aside>

      <div className="flex min-h-dvh flex-1 flex-col">
        {/* Mobile header */}
        <header className="flex items-center gap-2.5 px-4 pt-4 md:hidden">
          <BloomLogo size={28} />
          <div>
            <div className="font-display text-base font-extrabold leading-none text-green">Bloom</div>
            <div className="mt-0.5 text-[10px] text-meta">{SCHOOL_CONFIG.schoolName}</div>
          </div>
          {/* Role comes from sign-in — this chip is a context indicator, not a toggle (DESIGN_REVIEW P1-7) */}
          <span className="ml-auto rounded-chip bg-gold-chip px-2.5 py-1.5 text-[10.5px] font-bold text-gold-ink">
            {ROLE_LABELS[session.role]}
          </span>
        </header>

        <main id="main" className="flex-1 pb-24 md:px-8 md:py-6 md:pb-8">
          {children}
        </main>

        {/* Bottom navigation — mobile */}
        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-around border-t border-line bg-cream px-2 pb-[max(env(safe-area-inset-bottom),10px)] pt-1.5 md:hidden"
        >
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
            const active = navActive(pathname, to)
            return (
              <NavLink
                key={to}
                to={to}
                aria-current={active ? 'page' : undefined}
                className={`flex min-h-11 min-w-14 flex-col items-center justify-center gap-0.5 rounded-lg px-1 py-1 ${
                  active ? 'text-green' : 'text-meta'
                }`}
              >
                <Icon aria-hidden="true" className="h-[19px] w-[19px]" strokeWidth={active ? 2.6 : 2} />
                <span className={`text-[9.5px] ${active ? 'font-extrabold' : 'font-semibold'}`}>{label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>
    </div>
  )
}

/** Per-screen content width: default reading column; `wide` for Trends/desktop layouts. */
export function Screen({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return <div className={`mx-auto w-full ${wide ? 'max-w-5xl' : 'max-w-xl'}`}>{children}</div>
}
