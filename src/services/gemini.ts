/**
 * ── API ADAPTER (stub) ────────────────────────────────────────────────────
 * Boundary for every Gemini-backed capability named in PASTORAL_PULSE_SPEC
 * (free-text triage § 4.3, POUI micro-move generation § 5, Weekly Bridge § 6).
 *
 * The app is local-first and makes NO network calls today: this adapter
 * always rejects, and callers fall back to the curated banks/heuristics.
 * To go live, swap `generateText` for a real `@google/genai` call
 * (model: gemini-2.5-flash) — no caller changes needed.
 */
export interface GeminiAdapter {
  generateText(prompt: string): Promise<string>
}

export const gemini: GeminiAdapter = {
  async generateText(): Promise<string> {
    throw new Error('Gemini adapter not connected — using curated fallback')
  },
}
