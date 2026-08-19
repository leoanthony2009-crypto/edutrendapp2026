import type { MicroMove, PulseQuestion, TriageLabel } from '../types/pulse'
import { pickFallbackMove } from '../data/fallbackMicroMoves'
import { gemini, type PouiInput } from './gemini'
import { storage } from './storage'
import { dateKey } from './time'

/* POUI Micro-Move engine (PASTORAL_PULSE_SPEC § 5): one Caribbean-register,
   one-sentence coaching move generated from the teacher's just-submitted Pulse.
   Gemini generates when configured; otherwise the curated fallback bank keyed by
   (domain, mark, triage) supplies the move. */

const KEY = 'microMove'

const TERM_CONTEXT = 'T2 week 6, SBA window approaching'

export async function generateMicroMove(
  questions: PulseQuestion[],
  answers: Record<string, string | number>,
  triage: TriageLabel,
): Promise<MicroMove> {
  const responses = questions
    .filter((q) => answers[q.id] !== undefined)
    .map((q) => ({
      question: q.text,
      answer: Array.isArray(q.options) && typeof answers[q.id] === 'number'
        ? q.options[answers[q.id] as number]
        : String(answers[q.id]),
      mark: q.mark,
    }))

  let text: string | null = null
  if (gemini.available) {
    try {
      const input: PouiInput = { responses, triageLabel: triage, termContext: TERM_CONTEXT }
      text = (await gemini.generateMicroMove(input)).microMove
    } catch {
      text = null
    }
  }

  if (!text) {
    // Condition the fallback on the day's weakest-feeling domain: prefer the
    // question whose mark matches the triage trigger, else the first answered one.
    const anchor = questions.find((q) => q.triggersChampion && answers[q.id]) ?? questions[0]
    text = pickFallbackMove(anchor?.domain ?? 'wellness', anchor?.mark ?? 'R', triage).text
  }

  const move: MicroMove = {
    text,
    reason:
      triage === 'routine'
        ? "Suggested from today's pulse across your class."
        : "Suggested because today felt heavy in your class's pulses.",
    tried: false,
    saved: false,
    date: dateKey(),
  }
  storage.set(KEY, move)
  return move
}

export function getTodayMicroMove(): MicroMove | null {
  const move = storage.get<MicroMove>(KEY)
  return move && move.date === dateKey() ? move : null
}

export function updateMicroMove(patch: Partial<Pick<MicroMove, 'tried' | 'saved'>>): MicroMove | null {
  const move = storage.get<MicroMove>(KEY)
  if (!move) return null
  const next = { ...move, ...patch }
  storage.set(KEY, next)
  return next
}
