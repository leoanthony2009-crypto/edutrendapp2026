import type { MicroMove, OneChildEntry, QuestionDomain, TriageLabel } from '../types/survey'
import type { SynodalMark } from '../types/synodal'
import { FALLBACK_MICRO_MOVES } from '../data/fallbackMicroMoves'
import { gemini } from './gemini'

/**
 * POUI Micro-Move generation (PASTORAL_PULSE_SPEC § 5). The Gemini prompt is
 * implemented behind the adapter; offline the curated Caribbean-register bank
 * answers, keyed by (domain, mark, triage) with graceful widening.
 */
export interface PulseSummary {
  responses: Array<{ question: string; answer: string; mark: SynodalMark; domain: QuestionDomain }>
  oneChild?: OneChildEntry
  triageLabel: TriageLabel
  termContext: string // e.g. "T2 week 6, SBA window approaching"
}

const POUI_SYSTEM_PROMPT = `You are POUI — a coaching voice for Caribbean Catholic teachers, named for the Poui tree whose yellow blossoms burst into colour precisely when conditions are hardest.

Your job is to give the teacher ONE pastoral micro-move they can use tomorrow.

RULES:
- ONE sentence. Two at most. Never a paragraph.
- Caribbean register. Patois acceptable where natural. No British education jargon.
- Concrete and small — minutes, not weeks.
- Walks alongside the teacher. Never preaches. Never starts with "Try to..." or "Have you considered...".
- If the teacher is tired, your move respects that. Don't add to their load.
- If safeguarding is involved, your last line acknowledges that the Champion has been told. Do not give safeguarding advice yourself.
- No literature reviews. No bullet points. No "research suggests".`

export function pickFallbackMove(domain: QuestionDomain, mark: SynodalMark, triage: TriageLabel): string {
  const bank = FALLBACK_MICRO_MOVES
  const exact = bank.find((m) => m.domain === domain && m.mark === mark && m.triage === triage)
  if (exact) return exact.text
  const sameDomainMark = bank.find((m) => m.domain === domain && m.mark === mark)
  if (sameDomainMark) return sameDomainMark.text
  const sameMarkTriage = bank.find((m) => m.mark === mark && m.triage === triage)
  if (sameMarkTriage) return sameMarkTriage.text
  const sameDomain = bank.find((m) => m.domain === domain)
  if (sameDomain) return sameDomain.text
  return bank[0].text
}

function dominantContext(pulse: PulseSummary): { domain: QuestionDomain; mark: SynodalMark } {
  if (pulse.oneChild) return { domain: 'one_child', mark: 'D' }
  const first = pulse.responses[0]
  const counts = new Map<string, number>()
  for (const r of pulse.responses) {
    const key = `${r.domain}|${r.mark}`
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
  let best = first ? `${first.domain}|${first.mark}` : 'wellness|R'
  let bestCount = 0
  for (const [key, count] of counts) {
    if (count > bestCount) {
      best = key
      bestCount = count
    }
  }
  const [domain, mark] = best.split('|') as [QuestionDomain, SynodalMark]
  return { domain, mark }
}

export async function generateMicroMove(pulse: PulseSummary): Promise<MicroMove> {
  const { domain, mark } = dominantContext(pulse)
  const reason =
    pulse.triageLabel === 'routine'
      ? 'Suggested from your pulse today.'
      : 'Suggested because today felt heavy in your pulses.'
  try {
    const userPrompt = `Today's Pulse:
${pulse.responses.map((r) => `- ${r.question} [${r.mark}]: ${r.answer}`).join('\n')}
${pulse.oneChild ? `\nOne Child noted: ${pulse.oneChild.pupilHandle} — ${pulse.oneChild.notedFor}` : ''}
${pulse.triageLabel !== 'routine' ? `\nTriage: ${pulse.triageLabel}` : ''}
Context: ${pulse.termContext}

Generate the Micro-Move.`
    const text = await gemini.generateText(`${POUI_SYSTEM_PROMPT}\n\n${userPrompt}`)
    return { text: text.trim(), source: 'poui', reason }
  } catch {
    return { text: pickFallbackMove(domain, mark, pulse.triageLabel), source: 'fallback', reason }
  }
}
