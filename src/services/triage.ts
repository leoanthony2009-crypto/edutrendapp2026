import type { TriageLabel } from '../types/survey'
import { gemini } from './gemini'

/**
 * Free-text triage (PASTORAL_PULSE_SPEC § 4.3): classify a remark as
 * routine | noticing | concerned | alarmed. Anything concerned/alarmed
 * raises a Champion alert even when the question wasn't flagged.
 *
 * Gemini does the real classification when connected; offline we use a
 * conservative keyword heuristic so safeguarding never silently no-ops.
 */
const ALARMED = [
  'abuse',
  'abused',
  'hurt me',
  'hurting me',
  'hit me',
  'hits me',
  'touched',
  'self-harm',
  'harm myself',
  'suicide',
  'kill',
  'weapon',
  'unsafe at home',
  'scared to go home',
]

const CONCERNED = [
  'unsafe',
  'afraid',
  'scared',
  'hungry',
  'no food',
  'neglect',
  'withdrawn',
  'crying',
  'bullied',
  'bullying',
  'threatened',
  'alone',
  'no one to talk',
  'distress',
  'missing school',
  'bruise',
]

const NOTICING = ['tired', 'worried', 'worry', 'quiet', 'stress', 'stressed', 'heavy', 'struggling', 'overwhelmed', 'anxious', 'down']

export function triageFreeTextOffline(text: string): TriageLabel {
  const t = text.toLowerCase()
  if (ALARMED.some((k) => t.includes(k))) return 'alarmed'
  if (CONCERNED.some((k) => t.includes(k))) return 'concerned'
  if (NOTICING.some((k) => t.includes(k))) return 'noticing'
  return 'routine'
}

const LABELS: TriageLabel[] = ['routine', 'noticing', 'concerned', 'alarmed']

export async function triageFreeText(text: string): Promise<TriageLabel> {
  if (!text.trim()) return 'routine'
  try {
    const res = await gemini.generateText(
      `Classify the following teacher remark for pastoral concern level.
Respond with EXACTLY ONE of: routine, noticing, concerned, alarmed.
Caribbean teacher context. A remark is "concerned" if it suggests a child or staff member is unsafe, hungry, neglected, withdrawn, or in distress. "Alarmed" only for explicit safeguarding language.

Remark: "${text}"`
    )
    const label = res.trim().toLowerCase() as TriageLabel
    return LABELS.includes(label) ? label : triageFreeTextOffline(text)
  } catch {
    return triageFreeTextOffline(text)
  }
}
