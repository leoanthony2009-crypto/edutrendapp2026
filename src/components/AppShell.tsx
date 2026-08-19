import type { ReactNode } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { Flame, Home, LineChart, UserRound, Flower2 } from 'lucide-react'
import { BloomLogo } from './BloomLogo'
import { useAppStore } from '../store/AppStore'

export const SCHOOL_NAME = "St. Joseph's RC Secondary"

const NAV_ITEMS = [
  { to: '/today', label: 'Today', icon: Home },
  { to: '/trends', label: 'Trends', icon: LineChart },
  { to: '/pulse', label: 'Pulse', icon: Flower2 },
  { to: '/hot', label: "What's Hot", icon: Flame },
  { to: '/profile', label: 'Profile', icon: UserRound },
]

const ROLE_LABELS = { student: 'Student · Form 2', teacher: 'Teacher · Form 2', leader: 'Leader · Principal' }

function NavItems({ rail = false }: { rail?: boolean }) {
  const { pathname } = useLocation()
  return (
    <>
      {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
        // The manager and builder live under Pulse/Today conceptually; keep
        // Pulse highlighted while editing questions, Today while building.
        const active =
          pathname.startsWith(to) ||
          (to === '/pulse' && pathname.startsWith('/manage')) ||
          (to === '/today' && pathname.startsWith('/builder'))
        return (
          <NavLink
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`flex min-h-11 items-center transition-colors duration-150 ${
              rail
                ? `w-full gap-3 rounded-row px-3.5 py-2.5 text-sm ${active ? 'bg-bloom-cream-dim font-extrabold text-bloom-green' : 'font-semibold text-ink-meta hover:bg-bloom-cream-dim hover:text-ink'}`
                : `min-w-[56px] flex-col justify-center gap-0.5 px-1 py-1 ${active ? 'font-extrabold text-bloom-green' : 'font-semibold text-ink-meta'}`
            }`}
          >
            <Icon aria-hidden="true" className={rail ? 'h-[18px] w-[18px]' : 'h-[19px] w-[19px]'} strokeWidth={active ? 2.4 : 2} />
            <span className={rail ? '' : 'text-[10px]'}>{label}</span>
          </NavLink>
        )
      })}
    </>
  )
}

/**
 * App chrome: header with the Bloom mark and role context indicator
 * (DESIGN_REVIEW P1.7 — role comes from sign-in; the chip only indicates),
 * bottom navigation on mobile, side rail from 768px up.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { account } = useAppStore()
  return (
    <div className="mx-auto min-h-dvh max-w-[1440px] md:flex">
      <a href="#main" className="sr-only-focusable fixed top-2 left-2 z-50 rounded-input bg-bloom-green px-4 py-2 text-sm font-bold text-on-dark">
        Skip to content
      </a>

      {/* Side rail — desktop */}
      <nav aria-label="Primary" className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col gap-1 border-r border-bloom-line bg-bloom-cream px-3 py-5 md:flex lg:w-64">
        <div className="mb-5 flex items-center gap-2.5 px-2">
          <BloomLogo size={30} />
          <div>
            <div className="font-display leading-none font-extrabold text-bloom-green">Bloom</div>
            <div className="mt-0.5 text-[10px] text-ink-meta">{SCHOOL_NAME}</div>
          </div>
        </div>
        <NavItems rail />
        {account ? (
          <div className="mt-auto px-2 text-[11px] leading-snug text-ink-meta">
            Signed in as
            <div className="mt-0.5 font-bold text-ink">{ROLE_LABELS[account.role]}</div>
          </div>
        ) : null}
      </nav>

      <div className="flex min-h-dvh flex-1 flex-col bg-bloom-cream">
        {/* Mobile header */}
        <header className="flex flex-none items-center gap-2.5 px-4 pt-4 md:hidden">
          <BloomLogo size={28} />
          <div>
            <div className="font-display text-base leading-none font-extrabold text-bloom-green">Bloom</div>
            <div className="mt-0.5 text-[10px] text-ink-meta">{SCHOOL_NAME}</div>
          </div>
          {account ? (
            <span className="ml-auto rounded-full bg-bloom-sand px-2.5 py-1.5 text-[10.5px] font-bold text-ink-gold">
              {ROLE_LABELS[account.role]}
            </span>
          ) : null}
        </header>

        <main id="main" className="mx-auto w-full max-w-[560px] flex-1 pb-24 md:max-w-none md:px-8 md:pt-6 md:pb-10 lg:px-12">
          {children}
        </main>

        {/* Bottom navigation — mobile */}
        <nav
          aria-label="Primary"
          className="fixed inset-x-0 bottom-0 z-30 flex justify-around border-t border-bloom-line bg-bloom-cream px-2 pt-1.5 pb-[max(0.875rem,env(safe-area-inset-bottom))] md:hidden"
        >
          <NavItems />
        </nav>
      </div>
    </div>
  )
}
