import type { TriageLabel } from '../types/pulse'
import type { SynodalMark } from '../types/synodal'

/* ============================================================================
   GEMINI API ADAPTER — intentionally stubbed.
   Bloom is local-first with no backend calls yet. Free-text triage and POUI
   micro-move generation are designed against this interface; the shipped
   implementation reports "unavailable" so callers use the curated fallback
   bank (PASTORAL_PULSE_SPEC §§ 4.3, 5.2). To go live, provide an adapter that
   calls `gemini-2.5-flash` with the prompts from the spec — nothing outside
   this file needs to change.
   ========================================================================== */

export interface PouiInput {
  responses: Array<{ question: string; answer: string; mark: SynodalMark }>
  triageLabel: TriageLabel
  termContext: string
}

export interface GeminiAdapter {
  available: boolean
  triageFreeText(text: string): Promise<TriageLabel>
  generateMicroMove(input: PouiInput): Promise<{ microMove: string }>
}

class UnavailableGeminiAdapter implements GeminiAdapter {
  available = false
  triageFreeText(): Promise<TriageLabel> {
    return Promise.reject(new Error('Gemini adapter not configured'))
  }
  generateMicroMove(): Promise<{ microMove: string }> {
    return Promise.reject(new Error('Gemini adapter not configured'))
  }
}

export const gemini: GeminiAdapter = new UnavailableGeminiAdapter()
