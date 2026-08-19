import { useState } from 'react'
import { ExternalLink, X, Zap } from 'lucide-react'
import { useMe } from '../store/AppStore'
import { Api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { Modal } from '../components/Sheet'
import { Card, ErrorState, MicroLabel, PageHeader, PrivacyNote, ScreenSkeleton, StatusBadge } from '../components/ui'
import { HOT_THEMES, type HotTheme } from '../data/shots'

const POUI_GPT_URL = 'https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0'

/**
 * What's Emerging. The signal list is REAL (weakest domains from this
 * school's pulses, K-suppressed). The Micro-Learning Shot library and any
 * national figures are editorial and clearly labelled Sample until national
 * aggregation exists — no demo number is presented as school data.
 */
export function WhatsHot() {
  const me = useMe()
  const [shot, setShot] = useState<HotTheme | null>(null)
  const { data: summary, error, loading, reload } = useApi(() => Api.analytics('7d'), [])

  if (loading) return <ScreenSkeleton />
  if (error || !summary) return <ErrorState body="Signals could not be loaded." onRetry={reload} />

  const shotFor = (label: string): HotTheme | null => {
    if (/safety|peers/i.test(label)) return HOT_THEMES.find((t) => t.id === 'break-hotspots') ?? null
    if (/learning|engagement/i.test(label)) return HOT_THEMES.find((t) => t.id === 'sba-stress') ?? null
    if (/belonging|trusted/i.test(label)) return HOT_THEMES.find((t) => t.id === 'buddy-scheme') ?? null
    return null
  }

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="What's Emerging" sub={`Real signals from ${me.school.name}'s pulses this week`} />

      <div className="space-y-3 px-4 md:px-0 lg:max-w-2xl">
        <PrivacyNote>
          <b>Privacy shield.</b> Signals appear only when {summary.kAnon}+ voices in a comparison group have responded —
          enforced by the school server.
        </PrivacyNote>

        {summary.themes.length === 0 ? (
          <Card className="text-center text-[12.5px] text-ink-meta">
            Signals are still gathering this week — nothing has cleared the {summary.kAnon}-voice threshold yet.
          </Card>
        ) : (
          summary.themes.map((theme) => {
            const linkedShot = shotFor(theme.label)
            return (
              <article key={theme.label} className="rounded-card border border-bloom-line bg-white p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold tracking-[0.12em] text-ink-meta uppercase">This week's signal</span>
                  <span className="text-[11px] font-extrabold" style={{ color: theme.value < 60 ? '#A03E2D' : '#8A7325' }}>
                    {theme.value}/100
                  </span>
                </div>
                <h2 className="mt-1.5 font-display text-[17px] font-bold">{theme.label}</h2>
                <p className="mt-1 text-[12.5px] leading-relaxed text-[#6B6F5F]">
                  Among the week's weakest domains, from {theme.voices} pupil voices. Bloom shows the pattern — the "why"
                  belongs to your school.
                </p>
                <div aria-hidden="true" className="mt-2.5 h-1 rounded-full bg-bloom-cream-dim">
                  <div className="h-full rounded-full" style={{ width: `${theme.value}%`, background: theme.value < 60 ? '#D9634E' : '#C8A951' }} />
                </div>
                {linkedShot ? (
                  <button
                    onClick={() => setShot(linkedShot)}
                    className="mt-2.5 inline-flex min-h-11 items-center gap-1.5 rounded-full border border-bloom-gold-line bg-bloom-gold-chip px-3.5 py-2 text-[11.5px] font-extrabold text-ink transition-colors hover:bg-bloom-gold-line"
                  >
                    <Zap aria-hidden="true" className="h-3.5 w-3.5 text-bloom-gold" /> Micro-Learning Shot
                  </button>
                ) : null}
              </article>
            )
          })
        )}

        <Card>
          <div className="flex items-center justify-between">
            <MicroLabel className="text-ink-meta">Micro-Learning library</MicroLabel>
            <StatusBadge tone="gold">Sample</StatusBadge>
          </div>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-meta">
            Short evidence-informed reads. Editorial content with citations pending verification — not derived from your
            school's data.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {HOT_THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setShot(t)}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-bloom-line-strong px-3.5 py-2 text-[11.5px] font-bold text-ink-soft transition-colors hover:border-bloom-green"
              >
                <Zap aria-hidden="true" className="h-3 w-3 text-bloom-gold" /> {t.title}
              </button>
            ))}
          </div>
        </Card>
      </div>

      <Modal open={shot !== null} onClose={() => setShot(null)} label={`Micro-Learning Shot: ${shot?.title ?? ''}`}>
        {shot ? (
          <>
            <div className="relative bg-linear-135 from-bloom-green-deep to-bloom-green p-4.5 pb-6">
              <button
                onClick={() => setShot(null)}
                aria-label="Close"
                className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-full bg-on-dark/15 text-on-dark transition-colors hover:bg-on-dark/25"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
              <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-bloom-cream text-bloom-gold shadow-md">
                <Zap aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>
            <div className="p-4.5 pt-3.5">
              <div className="flex items-center justify-between">
                <MicroLabel className="text-ink-gold">Micro-Learning Shot</MicroLabel>
                <StatusBadge tone="gold">Sample</StatusBadge>
              </div>
              <h2 className="mt-1 font-display text-[21px] font-extrabold">{shot.title}</h2>
              <section className="mt-3 rounded-row border border-bloom-line bg-white px-3.5 py-3">
                <h3 className="text-[11px] font-extrabold text-bloom-green">The concept</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{shot.shot.concept}</p>
              </section>
              <section className="mt-2 rounded-row border border-bloom-gold-line bg-bloom-gold-tint px-3.5 py-3">
                <h3 className="text-[11px] font-extrabold text-ink-gold">Try this tomorrow</h3>
                <p className="mt-1 text-[12.5px] leading-relaxed text-ink-soft">{shot.shot.tryThis}</p>
              </section>
              <section className="mt-2 rounded-row border border-bloom-line bg-white px-3.5 py-3">
                <h3 className="text-[11px] font-extrabold text-mark-listening-deep">Grounded in research</h3>
                {shot.shot.citations.map((c) => (
                  <p key={c.source} className="mt-1.5 text-[11.5px] leading-relaxed text-ink-soft">
                    <b>{c.scope}:</b> {c.text}
                  </p>
                ))}
                <p className="mt-1.5 text-[10px] text-ink-meta">Citations stored with content · pending editorial verification before school release.</p>
              </section>
              <div className="mt-3.5 flex gap-2">
                <button
                  onClick={() => setShot(null)}
                  className="min-h-12 flex-1 rounded-row bg-bloom-charcoal px-4 py-3 text-sm font-extrabold text-on-dark transition-colors hover:bg-black"
                >
                  Got it, thanks →
                </button>
                <a
                  href={POUI_GPT_URL}
                  target="_blank"
                  rel="noreferrer"
                  title="Opens outside Bloom, in ChatGPT"
                  className="inline-flex min-h-12 items-center gap-1 rounded-row bg-bloom-gold-chip px-4 text-[12.5px] font-extrabold text-ink-gold no-underline transition-colors hover:bg-bloom-gold-line"
                >
                  POUI GPT <ExternalLink aria-hidden="true" className="h-3 w-3" />
                </a>
              </div>
            </div>
          </>
        ) : null}
      </Modal>
    </div>
  )
}
