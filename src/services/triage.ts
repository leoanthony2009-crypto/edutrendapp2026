import type { TriageLabel } from '../types/pulse'
import { gemini } from './gemini'

/* Free-text triage (PASTORAL_PULSE_SPEC § 4.3): classify remarks as
   routine | noticing | concerned | alarmed. Gemini is the intended classifier;
   offline (and until the adapter is configured) a conservative keyword heuristic
   stands in so distress language still reaches the Champion. */

const ALARMED = [
  /\bhurt(ing)? (him|her|them|my)?self\b/i,
  /\bsuicid/i,
  /\bself[- ]?harm/i,
  /\babus(e|ed|ing)\b/i,
  /\bweapon\b/i,
  /\bknife\b/i,
  /\bthreat(en|ened)?\b/i,
  /\bunsafe at home\b/i,
  /\btouch(ed|ing)? (me|her|him)\b/i,
]

const CONCERNED = [
  /\bhungry\b/i,
  /\bno food\b/i,
  /\bnot eat(en|ing)?\b/i,
  /\bneglect/i,
  /\bwithdrawn\b/i,
  /\bcry(ing)?\b/i,
  /\bscared\b/i,
  /\bafraid\b/i,
  /\bbulli(ed|es|ying)\b/i,
  /\bunsafe\b/i,
  /\bdistress/i,
  /\bhome.*(trouble|problem|fight)/i,
  /\bnobody (to )?talk/i,
  /\balone\b/i,
]

const NOTICING = [
  /\bworr(y|ied|ies)\b/i,
  /\btired\b/i,
  /\bexhaust/i,
  /\bstress/i,
  /\bquiet(er)?\b/i,
  /\bstruggl/i,
  /\bheavy\b/i,
  /\boverwhelm/i,
  /\bmissing (class|school)\b/i,
]

export function triageHeuristic(text: string): TriageLabel {
  const t = text.trim()
  if (!t) return 'routine'
  if (ALARMED.some((r) => r.test(t))) return 'alarmed'
  if (CONCERNED.some((r) => r.test(t))) return 'concerned'
  if (NOTICING.some((r) => r.test(t))) return 'noticing'
  return 'routine'
}

export async function triageFreeText(text: string): Promise<TriageLabel> {
  if (gemini.available) {
    try {
      return await gemini.triageFreeText(text)
    } catch {
      /* fall through to heuristic */
    }
  }
  return triageHeuristic(text)
}
