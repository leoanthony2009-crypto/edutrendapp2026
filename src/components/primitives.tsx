import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { SYNODAL_MARKS, type SynodalMark } from '../types/synodal'
import { THEME_COLORS } from '../types/pulse'

// ---------- Buttons ----------

type ButtonVariant = 'primary' | 'gold' | 'dark' | 'outline' | 'quiet'

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary: 'bg-green text-ondark font-extrabold hover:bg-green-deep',
  gold: 'bg-gold-bright text-ink font-extrabold hover:brightness-95',
  dark: 'bg-charcoal text-ondark-gold font-extrabold hover:bg-black/80',
  outline: 'border-[1.5px] border-line-strong text-ink-soft font-bold bg-transparent hover:bg-cream-dim',
  quiet: 'text-gold-ink font-bold underline underline-offset-2 hover:text-ink',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...props}
      className={`inline-flex min-h-11 items-center justify-center gap-1.5 rounded-row px-5 py-3 text-[13.5px] transition-colors duration-150 disabled:cursor-not-allowed disabled:bg-sand disabled:text-meta ${BUTTON_STYLES[variant]} ${className}`}
    />
  )
}

// ---------- Badges ----------

const LIGHT_BADGES = new Set(['#C8A951', '#E9B93B'])

/** Theme / Synodal Mark badge. Gold badges take dark ink; deep tones take white —
    both at AA for the 10px label. */
export function ThemeBadge({ theme, mark, className = '' }: { theme?: string; mark?: SynodalMark; className?: string }) {
  const cfg = mark ? SYNODAL_MARKS[mark] : undefined
  const color = cfg?.badgeColor ?? (theme ? THEME_COLORS[theme]?.badgeColor : undefined) ?? '#295C4D'
  const label = cfg ? mark : theme?.toUpperCase()
  const title = cfg ? `${cfg.label} — ${cfg.description}` : theme
  return (
    <span
      title={title}
      className={`inline-flex items-center rounded-md px-2 py-1 text-[10px] font-extrabold tracking-[0.06em] ${className}`}
      style={{ backgroundColor: color, color: LIGHT_BADGES.has(color) ? '#22342C' : '#fff' }}
    >
      {label}
      {cfg && <span className="sr-only"> — {cfg.label}</span>}
    </span>
  )
}

export function StatusBadge({
  tone,
  children,
  className = '',
}: {
  tone: 'live' | 'new' | 'gold' | 'muted' | 'paused' | 'closed'
  children: ReactNode
  className?: string
}) {
  const styles = {
    live: 'bg-success-bg text-success-text',
    new: 'bg-gold-bright text-ink',
    gold: 'bg-gold-chip text-gold-ink',
    muted: 'bg-cream-dim text-meta',
    paused: 'bg-gold-chip text-gold-ink',
    closed: 'bg-cream-dim text-meta',
  }[tone]
  return (
    <span className={`inline-flex items-center rounded-chip px-2.5 py-1 text-[10px] font-extrabold ${styles} ${className}`}>
      {children}
    </span>
  )
}

// ---------- Cards & layout ----------

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-line bg-white p-4 ${className}`}>{children}</div>
}

export function MicroLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`micro-label ${className}`}>{children}</div>
}

export function ProgressBar({
  value,
  max,
  label,
  className = '',
  trackClass = 'bg-cream-dim',
  barClass = 'bg-gold',
}: {
  value: number
  max: number
  label: string
  className?: string
  trackClass?: string
  barClass?: string
}) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100))
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(value)}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-label={label}
      className={`h-2 overflow-hidden rounded-chip ${trackClass} ${className}`}
    >
      <div className={`h-full rounded-chip transition-[width] duration-300 ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

export function PageHeader({ title, subtitle, back }: { title: string; subtitle?: string; back?: ReactNode }) {
  return (
    <header className="flex items-center gap-2.5 px-4 pt-4 md:px-0">
      {back}
      <div>
        <h1 className="font-display text-[26px] font-extrabold leading-tight tracking-[-0.01em]">{title}</h1>
        {subtitle && <p className="mt-0.5 text-xs text-meta">{subtitle}</p>}
      </div>
    </header>
  )
}

/** Gold-tinted privacy provenance card — recurs on every insight surface. */
export function PrivacyIndicator({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-gold-tint-line bg-gold-tint p-3.5 text-xs leading-relaxed text-gold-ink ${className}`}>
      {children}
    </div>
  )
}
