import { useState } from 'react'
import { ApiError } from '../services/api'
import { BloomLogo } from '../components/BloomLogo'
import { PrimaryButton } from '../components/ui'
import { useAppStore } from '../store/AppStore'

/**
 * Sign-in against the server (audit P0-1): identity, role and Champion
 * capability come from the session, never from a client-side picker. The
 * demo quick-fills below exist for the seeded pilot accounts and prefill
 * the form — authentication still happens server-side.
 */
const DEMO_ACCOUNTS = [
  { label: 'Student', school: 'STJ', code: 'student' },
  { label: 'Teacher', school: 'STJ', code: 'teacher' },
  { label: 'Leader · Champion', school: 'STJ', code: 'leader' },
]

export function Login() {
  const { login } = useAppStore()
  const [schoolCode, setSchoolCode] = useState('STJ')
  const [userCode, setUserCode] = useState('')
  const [passcode, setPasscode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await login(schoolCode.trim(), userCode.trim(), passcode)
    } catch (err) {
      // Distinguish a genuine credential rejection from a service problem.
      // Reporting every failure as "not recognised" sends people hunting for
      // a wrong passcode when the server is actually unreachable or broken.
      if (err instanceof ApiError && err.status === 401) {
        setError('That school, code or passcode was not recognised. Check the card your school gave you.')
      } else if (err instanceof ApiError && err.status === 429) {
        setError('Too many attempts on this account. Wait a few minutes and try again.')
      } else if (err instanceof ApiError) {
        setError(`Bloom could not reach the sign-in service (error ${err.status}: ${err.message}). This is not your passcode — try again shortly.`)
      } else {
        setError('Bloom could not reach the sign-in service. Check your connection and try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  const inputClass =
    'mt-1 w-full rounded-input border-[1.5px] border-bloom-line-strong bg-white px-3.5 py-3 text-sm outline-none focus:border-bloom-green'

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
        Sign in with the school code and personal code from your Bloom card. Your role comes with your account.
      </p>

      <form onSubmit={submit} className="mt-6 flex flex-col gap-3">
        <label className="block">
          <span className="micro-label text-ink-meta">School code</span>
          <input value={schoolCode} onChange={(e) => setSchoolCode(e.target.value)} autoComplete="organization" className={inputClass} />
        </label>
        <label className="block">
          <span className="micro-label text-ink-meta">Personal code</span>
          <input value={userCode} onChange={(e) => setUserCode(e.target.value)} autoComplete="username" className={inputClass} />
        </label>
        <label className="block">
          <span className="micro-label text-ink-meta">Passcode</span>
          <input
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            autoComplete="current-password"
            className={inputClass}
          />
        </label>
        {error ? (
          <p role="alert" className="rounded-input bg-bloom-gold-tint px-3.5 py-2.5 text-xs font-semibold text-ink-gold">
            {error}
          </p>
        ) : null}
        <PrimaryButton type="submit" disabled={busy || !userCode.trim() || !passcode}>
          {busy ? 'Signing in…' : 'Sign in'}
        </PrimaryButton>
      </form>

      <section aria-label="Demo accounts" className="mt-6 rounded-card border border-bloom-line bg-white p-4">
        <h2 className="micro-label text-ink-meta">Pilot demo accounts</h2>
        <p className="mt-1 text-[11px] leading-relaxed text-ink-meta">
          Seeded for the demo school. Tap to prefill — the passcode pattern is <b>petal-&lt;code&gt;</b>.
        </p>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {DEMO_ACCOUNTS.map((a) => (
            <button
              key={a.code}
              type="button"
              onClick={() => {
                setSchoolCode(a.school)
                setUserCode(a.code)
                setPasscode(`petal-${a.code}`)
              }}
              className="min-h-11 rounded-full border-[1.5px] border-bloom-line-strong bg-white px-3.5 py-1.5 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
            >
              {a.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
