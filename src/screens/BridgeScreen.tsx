import { Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Card, ErrorState, GoldCard, MicroLabel, PageHeader, ScreenSkeleton } from '../components/ui'

/**
 * Weekly Bridge (spec § 6, Gate 4) — leader and teacher versions composed
 * server-side from the week's real rollups.
 */
export function BridgeScreen() {
  const { data, error, loading, reload } = useApi(() => Api.bridge(), [])

  if (loading) return <ScreenSkeleton />
  if (error || !data) return <ErrorState body="This week's Bridge could not be loaded." onRetry={reload} />

  return (
    <div className="mx-auto max-w-xl space-y-3 pb-4">
      <PageHeader
        title="Weekly Bridge"
        sub={`Week of ${data.weekOf} · ${data.version === 'leader' ? 'leader edition' : 'your edition'}${data.isFriday ? ' · fresh today' : ''}`}
        back={
          <Link to="/profile" aria-label="Back to Profile" className="grid min-h-11 min-w-11 place-items-center text-ink-meta hover:text-ink">
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </Link>
        }
      />
      <div className="space-y-3 px-4 md:px-0">
        {data.sections.map((section, i) =>
          i === data.sections.length - 1 && data.version === 'teacher' ? (
            <GoldCard key={section.title}>
              <MicroLabel className="text-ink-gold">{section.title}</MicroLabel>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#4A4636] italic">{section.body}</p>
            </GoldCard>
          ) : (
            <Card key={section.title}>
              <MicroLabel className="text-ink-meta">{section.title}</MicroLabel>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[#4A4636]">{section.body}</p>
            </Card>
          )
        )}
        <p className="pb-4 text-[11px] leading-relaxed text-ink-meta">
          Composed from this week's real pulse rollups. Bridges, not data exhaust.
        </p>
      </div>
    </div>
  )
}
