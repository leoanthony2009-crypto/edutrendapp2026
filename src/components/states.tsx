import type { ReactNode } from 'react'
import { AlertCircle, Flower2 } from 'lucide-react'
import { Button } from './primitives'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-card bg-sand ${className}`} />
}

/** Standard page-level loading placeholder. */
export function PageSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-4 pt-4 md:px-0" role="status" aria-label="Loading">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-36" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
      <span className="sr-only">Loading…</span>
    </div>
  )
}

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
      <Flower2 aria-hidden="true" className="h-8 w-8 text-gold" />
      <h2 className="font-display text-[19px] font-bold text-green">{title}</h2>
      <p className="text-[12.5px] leading-relaxed text-meta">{body}</p>
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2.5 px-10 pt-20 text-center" role="alert">
      <AlertCircle aria-hidden="true" className="h-8 w-8 text-concern-text" />
      <h2 className="font-display text-[19px] font-bold text-ink">Something needs another try</h2>
      <p className="text-[12.5px] leading-relaxed text-meta">
        {message ?? "We couldn't load this just now. Your answers are safe on this device."}
      </p>
      {onRetry && (
        <Button variant="primary" className="mt-1.5" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
