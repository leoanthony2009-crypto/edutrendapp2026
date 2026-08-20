import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { CloudOff, Flower2 } from 'lucide-react'
import { SYNODAL_MARKS, type SynodalMark } from '../types/synodal'
import { THEME_COLORS } from '../data/themes'

/* ── Cards ─────────────────────────────────────────────────────────────── */

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-bloom-line bg-white p-4 ${className}`}>{children}</div>
}

export function DarkCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card bg-bloom-charcoal p-4 text-on-dark ${className}`}>{children}</div>
}

export function GreenCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card bg-bloom-green p-4 text-on-dark ${className}`}>{children}</div>
}

export function GoldCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-card border border-bloom-gold-line bg-bloom-gold-tint p-4 ${className}`}>{children}</div>
}

/* ── Page header ───────────────────────────────────────────────────────── */

export function PageHeader({ title, sub, back }: { title: string; sub?: string; back?: ReactNode }) {
  return (
    <header className="flex items-center gap-2.5 px-4 pt-4 md:px-0">
      {back}
      <div>
        <h1 className="font-display text-[26px] leading-tight font-extrabold tracking-tight">{title}</h1>
        {sub ? <p className="mt-0.5 text-xs text-ink-meta">{sub}</p> : null}
      </div>
    </header>
  )
}

/* ── Buttons ───────────────────────────────────────────────────────────── */

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>

export function PrimaryButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-input bg-bloom-green px-5 py-3 text-sm font-extrabold text-on-dark transition-colors duration-150 hover:bg-bloom-green-deep disabled:cursor-not-allowed disabled:bg-bloom-sand disabled:text-ink-meta ${className}`}
    />
  )
}

export function GoldButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-input bg-bloom-gold-bright px-5 py-3 text-sm font-extrabold text-ink transition-colors duration-150 hover:bg-bloom-gold disabled:cursor-not-allowed disabled:bg-bloom-sand disabled:text-ink-meta ${className}`}
    />
  )
}

export function GhostButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-input border-[1.5px] border-bloom-line-strong bg-transparent px-4 py-3 text-[13px] font-bold text-ink-soft transition-colors duration-150 hover:border-bloom-green hover:text-bloom-green ${className}`}
    />
  )
}

/* ── Badges ────────────────────────────────────────────────────────────── */

export function ThemeBadge({ theme }: { theme: string }) {
  const color = THEME_COLORS[theme] ?? '#295C4D'
  return (
    <span
      className="inline-flex items-center rounded-md px-2 py-1 text-[10px] font-extrabold tracking-[0.06em] text-white uppercase"
      style={{ backgroundColor: color }}
    >
      {theme}
    </span>
  )
}

/** Deep badge backgrounds — ≥4.5:1 with white text (audit P1-1). */
const MARK_BADGE_COLORS: Record<SynodalMark, string> = {
  R: '#8A7325',
  L: '#2F5F96',
  D: '#3D7A50',
  SE: '#6E5494',
}

export function MarkBadge({ mark, size = 'sm' }: { mark: SynodalMark; size?: 'sm' | 'md' }) {
  const cfg = SYNODAL_MARKS[mark]
  const dims = size === 'sm' ? 'px-1.5 py-0.5 text-[10px]' : 'px-2 py-1 text-xs'
  return (
    <span
      title={`${cfg.label} — ${cfg.description}`}
      aria-label={`Synodal mark: ${cfg.label}`}
      className={`inline-flex items-center justify-center rounded font-bold text-white uppercase ${dims}`}
      style={{ backgroundColor: MARK_BADGE_COLORS[mark] }}
    >
      {mark}
    </span>
  )
}

export function StatusBadge({
  children,
  tone = 'neutral',
}: {
  children: ReactNode
  tone?: 'live' | 'gold' | 'neutral' | 'new'
}) {
  const tones = {
    live: 'bg-[#EAF4EC] text-[#2F5E3F]',
    gold: 'bg-bloom-gold-chip text-ink-gold',
    neutral: 'bg-bloom-cream-dim text-ink-meta',
    new: 'bg-bloom-gold-bright text-ink',
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-extrabold tracking-[0.06em] uppercase ${tones[tone]}`}>
      {children}
    </span>
  )
}

export function MicroLabel({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`micro-label ${className}`}>{children}</div>
}

/* ── Progress ──────────────────────────────────────────────────────────── */

export function ProgressBar({
  value,
  max = 100,
  label,
  className = '',
  trackClass = 'bg-bloom-cream-dim',
  barClass = 'bg-bloom-gold',
}: {
  value: number
  max?: number
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
      className={`h-2 overflow-hidden rounded-full ${trackClass} ${className}`}
    >
      <div className={`h-full rounded-full transition-[width] duration-300 ${barClass}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ── Toggle switch ─────────────────────────────────────────────────────── */

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={onChange}
      className={`relative h-[26px] w-11 shrink-0 rounded-full transition-colors duration-200 ${checked ? 'bg-bloom-green' : 'bg-bloom-line-strong'}`}
    >
      <span
        className={`absolute top-[3px] h-5 w-5 rounded-full bg-white transition-[left] duration-200 ${checked ? 'left-[21px]' : 'left-[3px]'}`}
      />
    </button>
  )
}

/* ── Privacy indicator ─────────────────────────────────────────────────── */

export function PrivacyNote({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-row border border-bloom-gold-line bg-bloom-gold-tint px-3.5 py-3 text-xs leading-relaxed text-ink-gold ${className}`}>
      {children}
    </div>
  )
}

/* ── Empty / error / loading states ────────────────────────────────────── */

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string
  body: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-10 pt-20 text-center">
      <Flower2 aria-hidden="true" className="h-8 w-8 text-bloom-gold" />
      <h2 className="font-display text-lg font-bold text-bloom-green">{title}</h2>
      <p className="text-[12.5px] leading-relaxed text-ink-meta">{body}</p>
      {action ? <div className="mt-1.5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({ title = 'Something went wrong', body, onRetry }: { title?: string; body: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2.5 px-10 pt-20 text-center">
      <CloudOff aria-hidden="true" className="h-8 w-8 text-signal-concern" />
      <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
      <p className="text-[12.5px] leading-relaxed text-ink-meta">{body}</p>
      {onRetry ? (
        <GhostButton onClick={onRetry} className="mt-1.5">
          Try again
        </GhostButton>
      ) : null}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-card bg-bloom-sand ${className}`} />
}

export function ScreenSkeleton() {
  return (
    <div role="status" aria-label="Loading" className="space-y-3 px-4 pt-4 md:px-0">
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-36" />
      <Skeleton className="h-20" />
      <Skeleton className="h-28" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}
