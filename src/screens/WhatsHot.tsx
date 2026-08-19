import { useState } from 'react'
import { ExternalLink, Globe, X, Zap } from 'lucide-react'
import { SCHOOL_NAME } from '../components/AppShell'
import { Modal } from '../components/Sheet'
import { MicroLabel, PageHeader, PrivacyNote, ScreenSkeleton, StatusBadge } from '../components/ui'
import { useLoaded } from '../hooks/useLoaded'
import { HOT_THEMES, type HotTheme } from '../data/shots'
import { NATIONAL_REGIONS } from '../data/demoAggregates'

const POUI_GPT_URL = 'https://chatgpt.com/g/g-696d4b9b682c8191b00cce3da28a61bc-bloom-gpt-1-0'

export function WhatsHot() {
  const loaded = useLoaded()
  const [shot, setShot] = useState<HotTheme | null>(null)
  const [natOpen, setNatOpen] = useState(false)

  if (!loaded) return <ScreenSkeleton />

  return (
    <div className="space-y-3 pb-4">
      <PageHeader title="What's Emerging" sub={`Signals across ${SCHOOL_NAME} and the district`} />

      <div className="space-y-3 px-4 md:px-0 lg:max-w-2xl">
        <button
          onClick={() => setNatOpen(true)}
          className="flex w-full items-center gap-3 rounded-[16px] bg-bloom-charcoal p-3.5 text-left text-on-dark transition-transform duration-150 hover:scale-[1.01]"
        >
          <span className="grid h-9 w-9 flex-none place-items-center rounded-full bg-bloom-gold-bright/15 text-bloom-gold-bright">
            <Globe aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="flex-1">
            <span className="block text-[13.5px] font-bold">National Report</span>
            <span className="mt-0.5 block text-[11px] text-on-dark-meta">Aggregated monthly insights · Trinidad &amp; Tobago</span>
          </span>
          <StatusBadge tone="new">New</StatusBadge>
        </button>

        <PrivacyNote>
          <b>Privacy shield.</b> Themes appear only when 20+ voices in a comparison group have responded.
        </PrivacyNote>

        {HOT_THEMES.map((theme) => (
          <article key={theme.id} className="rounded-card border border-bloom-line bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.12em] text-ink-meta uppercase">{theme.category}</span>
              <span className="text-[11px] font-extrabold" style={{ color: theme.heatColor }}>
                {theme.heat}
              </span>
            </div>
            <h2 className="mt-1.5 font-display text-[17px] font-bold">{theme.title}</h2>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[#6B6F5F]">{theme.body}</p>
            <div aria-hidden="true" className="mt-2.5 h-1 rounded-full" style={{ background: theme.bar }} />
            <p className="mt-2 text-[11px] text-ink-meta">{theme.why}</p>
            <button
              onClick={() => setShot(theme)}
              className="mt-2.5 inline-flex min-h-10 items-center gap-1.5 rounded-full border border-bloom-gold-line bg-bloom-gold-chip px-3.5 py-2 text-[11.5px] font-extrabold text-ink transition-colors hover:bg-bloom-gold-line"
            >
              <Zap aria-hidden="true" className="h-3.5 w-3.5 text-bloom-gold" /> Micro-Learning Shot
            </button>
          </article>
        ))}
      </div>

      {/* Micro-Learning Shot modal */}
      <Modal open={shot !== null} onClose={() => setShot(null)} label={`Micro-Learning Shot: ${shot?.title ?? ''}`}>
        {shot ? (
          <>
            <div className="relative bg-linear-135 from-bloom-green-deep to-bloom-green p-4.5 pb-6">
              <button
                onClick={() => setShot(null)}
                aria-label="Close"
                className="absolute top-3 right-3 grid h-9 w-9 place-items-center rounded-full bg-on-dark/15 text-on-dark transition-colors hover:bg-on-dark/25"
              >
                <X aria-hidden="true" className="h-4 w-4" />
              </button>
              <span className="grid h-11 w-11 place-items-center rounded-[13px] bg-bloom-cream text-bloom-gold shadow-md">
                <Zap aria-hidden="true" className="h-5 w-5" />
              </span>
            </div>
            <div className="p-4.5 pt-3.5">
              <MicroLabel className="text-ink-gold">Micro-Learning Shot</MicroLabel>
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
                <h3 className="text-[11px] font-extrabold text-mark-listening">Grounded in research</h3>
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

      {/* National Report overlay */}
      <Modal open={natOpen} onClose={() => setNatOpen(false)} label="National Report" className="!max-w-lg !p-0">
        <div className="relative bg-bloom-charcoal p-4.5 text-on-dark">
          <button
            onClick={() => setNatOpen(false)}
            aria-label="Close"
            className="absolute top-3.5 right-3.5 grid h-9 w-9 place-items-center rounded-full bg-on-dark/12 transition-colors hover:bg-on-dark/25"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2">
            <Globe aria-hidden="true" className="h-4 w-4 text-bloom-gold-bright" />
            <h2 className="font-display text-[17px] font-extrabold">National Report</h2>
          </div>
          <div className="mt-3 flex items-end justify-between">
            <div>
              <div className="text-[11px] font-extrabold tracking-[0.12em] text-[#8FE3B0]">JULY 2026</div>
              <div className="mt-1 text-[11.5px] text-on-dark-meta">12,450 total participants</div>
            </div>
            <div className="text-right">
              <div className="font-display text-[22px] font-extrabold text-[#8FE3B0]">+15%</div>
              <div className="text-[9.5px] tracking-[0.1em] text-on-dark-meta">PARTICIPATION</div>
            </div>
          </div>
        </div>
        <div className="p-4">
          <section className="rounded-[16px] border border-bloom-line border-l-4 border-l-bloom-green bg-white px-3.5 py-3.5">
            <MicroLabel className="text-ink-meta">National headline</MicroLabel>
            <p className="mt-1.5 text-sm leading-relaxed italic">
              "Secondary schools report 26% higher stress levels than Primary schools nationwide, driven largely by SBA
              deadlines and curriculum pacing."
            </p>
          </section>
          <section className="mt-3 rounded-[16px] border border-bloom-line bg-white px-3.5 py-3.5">
            <div className="flex items-center justify-between">
              <h3 className="text-[13.5px] font-bold">Regional data</h3>
              <span className="rounded-full bg-bloom-cream-dim px-2.5 py-1 text-[10.5px] font-bold text-ink-meta">Responses by region</span>
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {NATIONAL_REGIONS.map((r) => {
                const max = Math.max(...NATIONAL_REGIONS.map((x) => x.value))
                return (
                  <div key={r.label} className="grid grid-cols-[56px_1fr_44px] items-center gap-2">
                    <span className="text-right text-[11px] font-bold text-ink-soft">{r.label}</span>
                    <div
                      className="h-3 overflow-hidden rounded-[5px] bg-bloom-cream-dim"
                      role="img"
                      aria-label={`${r.label}: ${r.value.toLocaleString()} responses`}
                    >
                      <div
                        className="h-full rounded-[5px]"
                        style={{ width: `${Math.round((r.value / max) * 100)}%`, backgroundColor: r.label === 'Tobago' ? '#5BAA70' : '#295C4D' }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-ink-meta">{(r.value / 1000).toFixed(1)}k</span>
                  </div>
                )
              })}
            </div>
          </section>
          <PrivacyNote className="mt-3">
            Aggregated across 42 schools. No school or individual is identifiable below the 20-voice threshold.
          </PrivacyNote>
        </div>
      </Modal>
    </div>
  )
}
