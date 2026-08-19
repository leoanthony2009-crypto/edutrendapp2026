import { useState } from 'react'
import { ExternalLink, Globe, X, Zap } from 'lucide-react'
import { Screen } from '../components/AppShell'
import { Card, MicroLabel, PageHeader, PrivacyIndicator, StatusBadge } from '../components/primitives'
import { ErrorState, PageSkeleton } from '../components/states'
import { Sheet } from '../components/Sheet'
import { useAsync } from '../hooks/useAsync'
import { HOT_THEMES, NATIONAL_REPORT, type HotTheme } from '../data/microShots'
import { SCHOOL_CONFIG } from '../services/time'

const POUI_GPT_URL = 'https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0'

const HEAT_TEXT = { concern: 'text-concern-text', warn: 'text-warn-text', good: 'text-good-text' }
const HEAT_BAR = {
  concern: 'linear-gradient(90deg, var(--color-warn), var(--color-concern))',
  warn: 'linear-gradient(90deg, var(--color-gold), var(--color-warn))',
  good: 'var(--color-good)',
}

export function WhatsHot() {
  const { data, loading, error, reload } = useAsync(() => HOT_THEMES)
  const [shot, setShot] = useState<HotTheme | null>(null)
  const [natOpen, setNatOpen] = useState(false)

  if (loading) return <PageSkeleton />
  if (error || !data) return <ErrorState onRetry={reload} />

  return (
    <Screen>
      <PageHeader title="What's Emerging" subtitle={`Signals across ${SCHOOL_CONFIG.schoolName} and the district`} />

      <div className="grid gap-2.5 px-4 pt-3.5 md:grid-cols-2 md:px-0">
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => setNatOpen(true)}
            className="flex w-full items-center gap-3 rounded-2xl bg-charcoal p-3.5 text-left text-[#EFF3ED] hover:bg-black/80"
          >
            <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gold-bright/15">
              <Globe aria-hidden="true" className="h-4 w-4 text-gold-bright" />
            </span>
            <span className="flex-1">
              <span className="block text-[13.5px] font-bold">National Report</span>
              <span className="mt-0.5 block text-[11px] text-[#AFC3B6]">Aggregated monthly insights · Trinidad &amp; Tobago</span>
            </span>
            <StatusBadge tone="new">NEW</StatusBadge>
          </button>

          <PrivacyIndicator className="!rounded-input !p-3">
            <b>Privacy shield.</b> Themes appear only when 20+ voices in a comparison group have responded.
          </PrivacyIndicator>
        </div>

        {data.map((theme) => (
          <Card key={theme.id}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.12em] text-meta">{theme.category}</span>
              <span className={`text-[11px] font-extrabold ${HEAT_TEXT[theme.heatTone]}`}>{theme.heatLabel}</span>
            </div>
            <h2 className="font-display mt-1.5 text-[17px] font-bold">{theme.title}</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{theme.body}</p>
            <div aria-hidden="true" className="mt-2.5 h-1 rounded-chip" style={{ background: HEAT_BAR[theme.heatTone] }} />
            <p className="mt-2 text-[11px] text-meta">{theme.provenance}</p>
            <button
              type="button"
              onClick={() => setShot(theme)}
              className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 rounded-chip border border-gold-tint-line bg-gold-chip px-3.5 py-2 text-[11.5px] font-extrabold text-ink hover:brightness-95"
            >
              <Zap aria-hidden="true" className="h-3.5 w-3.5 text-gold-ink" /> Micro-Learning Shot
            </button>
          </Card>
        ))}
      </div>

      <MicroShotModal theme={shot} onClose={() => setShot(null)} />
      <NationalReportOverlay open={natOpen} onClose={() => setNatOpen(false)} />
    </Screen>
  )
}

function MicroShotModal({ theme, onClose }: { theme: HotTheme | null; onClose: () => void }) {
  return (
    <Sheet open={theme !== null} onClose={onClose} title="Micro-Learning Shot" variant="center" showClose={false}>
      {theme && (
        <>
          <div className="relative bg-gradient-to-br from-green-deep to-green p-[18px] pb-6">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Micro-Learning Shot"
              className="hit-target absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-ondark/15 text-ondark hover:bg-ondark/25"
            >
              <X aria-hidden="true" className="h-3.5 w-3.5" />
            </button>
            <div className="grid h-11 w-11 place-items-center rounded-row bg-cream shadow-md">
              <Zap aria-hidden="true" className="h-5 w-5 text-gold" />
            </div>
          </div>
          <div className="p-[18px] pt-3.5">
            <MicroLabel className="text-gold-ink">Micro-Learning Shot</MicroLabel>
            <h2 className="font-display mt-1 text-[21px] font-extrabold text-ink">{theme.title}</h2>
            <div className="mt-3 rounded-input border border-line bg-white px-3.5 py-3">
              <h3 className="text-[11px] font-extrabold text-green">The concept</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{theme.shot.concept}</p>
            </div>
            <div className="mt-2 rounded-input border border-gold-tint-line bg-gold-tint px-3.5 py-3">
              <h3 className="text-[11px] font-extrabold text-gold-ink">Try this tomorrow</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{theme.shot.tryTomorrow}</p>
            </div>
            <div className="mt-2 rounded-input border border-line bg-white px-3.5 py-3">
              <h3 className="text-[11px] font-extrabold text-listening-deep">Grounded in research</h3>
              {theme.shot.citations.map((c) => (
                <p key={c.source} className="mt-1 text-[11.5px] leading-relaxed text-ink-soft">
                  {c.text}
                  {!c.verified && <span className="text-meta"> (citation pending verification)</span>}
                </p>
              ))}
            </div>
            <div className="mt-3.5 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="min-h-11 flex-1 rounded-input bg-charcoal py-3 text-sm font-extrabold text-ondark hover:bg-black/80"
              >
                Got it, thanks →
              </button>
              <a
                href={POUI_GPT_URL}
                target="_blank"
                rel="noreferrer"
                title="Opens outside Bloom in ChatGPT"
                className="grid min-h-11 flex-none place-items-center rounded-input bg-gold-chip px-4 text-[12.5px] font-extrabold text-gold-ink hover:brightness-95"
              >
                <span className="inline-flex items-center gap-1">
                  POUI GPT <ExternalLink aria-hidden="true" className="h-3 w-3" />
                </span>
              </a>
            </div>
          </div>
        </>
      )}
    </Sheet>
  )
}

function NationalReportOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const maxResponses = Math.max(...NATIONAL_REPORT.regions.map((r) => r.responses))
  return (
    <Sheet open={open} onClose={onClose} title="National Report" variant="center" showClose={false}>
      <div className="relative bg-charcoal p-[18px] text-[#EFF3ED]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close National Report"
          className="hit-target absolute right-3.5 top-3.5 grid h-7 w-7 place-items-center rounded-full bg-ondark/10 text-ondark hover:bg-ondark/25"
        >
          <X aria-hidden="true" className="h-3.5 w-3.5" />
        </button>
        <div className="flex items-center gap-2">
          <Globe aria-hidden="true" className="h-4 w-4 text-gold-bright" />
          <h2 className="font-display text-[17px] font-extrabold">National Report</h2>
        </div>
        <div className="mt-3 flex items-end justify-between">
          <div>
            <div className="text-[11px] font-extrabold tracking-[0.12em] text-[#8FE3B0]">{NATIONAL_REPORT.month}</div>
            <div className="mt-0.5 text-[11.5px] text-[#AFC3B6]">
              {NATIONAL_REPORT.participants.toLocaleString()} total participants
            </div>
          </div>
          <div className="text-right">
            <div className="font-display text-[22px] font-extrabold text-[#8FE3B0]">{NATIONAL_REPORT.participationDelta}</div>
            <div className="text-[9.5px] tracking-[0.1em] text-[#AFC3B6]">PARTICIPATION</div>
          </div>
        </div>
      </div>
      <div className="p-4">
        <div className="rounded-2xl border border-line border-l-4 border-l-green bg-white px-3.5 py-3">
          <MicroLabel className="text-meta">National headline</MicroLabel>
          <p className="mt-1.5 text-sm italic leading-relaxed text-ink">{NATIONAL_REPORT.headline}</p>
        </div>
        <div className="mt-3 rounded-2xl border border-line bg-white px-3.5 py-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[13.5px] font-bold">Regional data</h3>
            <span className="rounded-chip bg-cream-dim px-2.5 py-1 text-[10.5px] font-bold text-meta">Responses by region</span>
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {NATIONAL_REPORT.regions.map((r) => (
              <div key={r.label} className="grid grid-cols-[56px_1fr_44px] items-center gap-2">
                <span className="text-right text-[11px] font-bold text-ink-soft">{r.label}</span>
                <div
                  className="h-3 overflow-hidden rounded-[5px] bg-cream-dim"
                  role="img"
                  aria-label={`${r.label}: ${r.responses.toLocaleString()} responses`}
                >
                  <div
                    className={`h-full rounded-[5px] ${r.label === 'Tobago' ? 'bg-good' : 'bg-green'}`}
                    style={{ width: `${Math.round((r.responses / maxResponses) * 100)}%` }}
                  />
                </div>
                <span aria-hidden="true" className="text-[11px] font-bold text-meta">
                  {(r.responses / 1000).toFixed(1)}k
                </span>
              </div>
            ))}
          </div>
        </div>
        <PrivacyIndicator className="mt-3 !rounded-input !p-3">{NATIONAL_REPORT.note}</PrivacyIndicator>
      </div>
    </Sheet>
  )
}
