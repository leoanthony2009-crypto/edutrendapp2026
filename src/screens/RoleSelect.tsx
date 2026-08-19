import { useState } from 'react'
import type { Role } from '../types/survey'
import { BloomLogo } from '../components/BloomLogo'
import { PrimaryButton } from '../components/ui'
import { useAppStore } from '../store/AppStore'
import { SCHOOL_NAME } from '../components/AppShell'

const ROLES: Array<{ role: Role; title: string; sub: string; defaultName: string }> = [
  { role: 'student', title: 'Student', sub: 'Answer the short "Your Voice Today" carousel', defaultName: 'Student F2-104' },
  { role: 'teacher', title: 'Teacher', sub: 'Run the two-minute Daily Pulse and read insights', defaultName: 'M. Persaud' },
  { role: 'leader', title: 'Leader', sub: 'Weekly Leader Pulse and perception-gap analytics', defaultName: 'Sr. A. Joseph' },
]

/**
 * Local sign-in (DESIGN_REVIEW P1.7): roles come from auth, not a header
 * cycler. This stands in for the real identity provider — the chosen role is
 * persisted and gates manager/builder/watchlist surfaces.
 */
export function RoleSelect() {
  const { signIn } = useAppStore()
  const [picked, setPicked] = useState<Role | null>(null)

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 py-10">
      <div className="flex items-center gap-3">
        <BloomLogo size={44} />
        <div>
          <h1 className="font-display text-[28px] leading-none font-extrabold text-bloom-green">Bloom</h1>
          <p className="micro-label mt-1 text-ink-gold">Your voice matters</p>
        </div>
      </div>
      <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
        {SCHOOL_NAME}. Choose how you're signing in today — your role shapes what Bloom shows you.
      </p>

      <fieldset className="mt-6">
        <legend className="sr-only">Choose your role</legend>
        <div className="flex flex-col gap-2.5">
          {ROLES.map(({ role, title, sub }) => (
            <label
              key={role}
              className={`flex min-h-11 cursor-pointer items-center gap-3.5 rounded-card border-[1.5px] p-4 transition-colors duration-150 ${
                picked === role ? 'border-bloom-green bg-bloom-green text-on-dark' : 'border-bloom-line-strong bg-white hover:border-bloom-green'
              }`}
            >
              <input
                type="radio"
                name="role"
                value={role}
                checked={picked === role}
                onChange={() => setPicked(role)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid h-5 w-5 flex-none place-items-center rounded-full border-2 ${picked === role ? 'border-bloom-gold-bright' : 'border-bloom-line-strong'}`}
              >
                {picked === role ? <span className="h-2.5 w-2.5 rounded-full bg-bloom-gold-bright" /> : null}
              </span>
              <span>
                <span className="block font-display text-[15px] font-bold">{title}</span>
                <span className={`mt-0.5 block text-xs ${picked === role ? 'text-on-dark-soft' : 'text-ink-meta'}`}>{sub}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <PrimaryButton
        className="mt-6"
        disabled={!picked}
        onClick={() => {
          const cfg = ROLES.find((r) => r.role === picked)
          if (cfg) signIn({ role: cfg.role, name: cfg.defaultName })
        }}
      >
        Continue
      </PrimaryButton>
      <p className="mt-4 text-[11px] leading-relaxed text-ink-meta">
        Demo sign-in: real deployments authenticate against the school's identity provider, and the role is granted — not
        chosen. Switch roles any time from Profile.
      </p>
    </main>
  )
}
