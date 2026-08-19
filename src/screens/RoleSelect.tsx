import { useState } from 'react'
import { GraduationCap, Landmark, Presentation } from 'lucide-react'
import { BloomLogo } from '../components/BloomLogo'
import { Button } from '../components/primitives'
import { signIn } from '../services/auth'
import { SCHOOL_CONFIG } from '../services/time'
import type { Role } from '../types/pulse'

/* First-run sign-in. Roles come from this local auth step and are persisted —
   never from an in-app toggle (DESIGN_REVIEW P1-7). A real identity provider
   replaces the signIn call; the choice screen doubles as the demo entry point. */

const ROLES: Array<{ role: Role; label: string; sub: string; icon: typeof GraduationCap }> = [
  { role: 'student', label: 'Student', sub: 'Answer the short "Your Voice Today" carousel', icon: GraduationCap },
  { role: 'teacher', label: 'Teacher', sub: 'Run the two-minute Daily Pulse, read collated insights', icon: Presentation },
  { role: 'leader', label: 'Leader', sub: 'Weekly Leader Pulse and perception-gap analytics', icon: Landmark },
]

export function RoleSelect({ onSignedIn }: { onSignedIn: () => void }) {
  const [selected, setSelected] = useState<Role | null>(null)

  return (
    <main className="flex min-h-dvh flex-col items-center bg-cream px-5 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <BloomLogo size={72} />
          <h1 className="font-display mt-4 text-[32px] font-extrabold text-green">Bloom</h1>
          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-gold-ink">Your voice matters</p>
          <p className="mt-4 text-[13px] leading-relaxed text-ink-soft">
            {SCHOOL_CONFIG.schoolName} · Sign in to continue. Your role decides what you see — pupils are always
            anonymous.
          </p>
        </div>

        <fieldset className="mt-7 border-0 p-0">
          <legend className="micro-label mb-2.5 text-meta">Who are you signing in as?</legend>
          <div className="flex flex-col gap-2.5">
            {ROLES.map(({ role, label, sub, icon: Icon }) => (
              <label
                key={role}
                className={`flex min-h-11 cursor-pointer items-center gap-3.5 rounded-card border-[1.5px] p-4 transition-colors ${
                  selected === role ? 'border-green bg-green text-ondark' : 'border-line-strong bg-white hover:border-green'
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  value={role}
                  checked={selected === role}
                  onChange={() => setSelected(role)}
                  className="sr-only"
                />
                <Icon aria-hidden="true" className={`h-6 w-6 flex-none ${selected === role ? 'text-gold-bright' : 'text-green'}`} />
                <span>
                  <span className="block text-[15px] font-bold">{label}</span>
                  <span className={`mt-0.5 block text-xs ${selected === role ? 'text-ondark-soft' : 'text-meta'}`}>{sub}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <Button
          variant="gold"
          className="mt-6 w-full"
          disabled={!selected}
          onClick={() => {
            if (!selected) return
            signIn(selected)
            onSignedIn()
          }}
        >
          {selected ? `Continue as ${ROLES.find((r) => r.role === selected)?.label}` : 'Choose a role to continue'}
        </Button>

        <p className="mt-5 text-center text-[11px] leading-relaxed text-meta">
          Demo sign-in — a school identity provider supplies roles in production. Your choice is remembered on this
          device.
        </p>
      </div>
    </main>
  )
}
