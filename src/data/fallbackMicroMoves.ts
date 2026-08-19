import type { QuestionDomain, TriageLabel } from '../types/pulse'
import type { SynodalMark } from '../types/synodal'

export interface FallbackMicroMove {
  domain: QuestionDomain
  mark: SynodalMark
  triage: TriageLabel
  text: string
}

/** Curated Caribbean-register micro-moves used when the POUI adapter is unavailable
    (PASTORAL_PULSE_SPEC § 5.2). Keyed by (domain, mark, triage); lookup degrades gracefully. */
export const FALLBACK_MICRO_MOVES: FallbackMicroMove[] = [
  { domain: 'wellness', mark: 'R', triage: 'routine', text: 'Greet the three quietest by name at the door tomorrow — nothing more.' },
  { domain: 'wellness', mark: 'R', triage: 'noticing', text: "Tomorrow's first ten minutes — water, windows, a song they choose. Mark a register before, not after." },
  { domain: 'wellness', mark: 'R', triage: 'concerned', text: 'Sit near, not opposite, the child on your mind at lunch. Your Champion has been told.' },
  { domain: 'wellness', mark: 'R', triage: 'alarmed', text: 'Keep tomorrow ordinary and warm. The Champion has this now — you are not carrying it alone.' },
  { domain: 'wellness', mark: 'L', triage: 'routine', text: 'Ask one pupil "what should I know that I don\'t?" and just listen.' },
  { domain: 'wellness', mark: 'L', triage: 'noticing', text: 'Leave the last two minutes open — no task, no talk, just room for somebody to reach you.' },
  { domain: 'wellness', mark: 'L', triage: 'concerned', text: 'Say "I noticed, and I\'m glad you said it" to the class — no names. Your Champion has been told.' },
  { domain: 'wellness', mark: 'L', triage: 'alarmed', text: 'Nothing extra tomorrow — presence over programme. The Champion has been told and will act.' },
  { domain: 'wellness', mark: 'D', triage: 'routine', text: 'Jot one line about who surprised you today. Read it back Friday.' },
  { domain: 'wellness', mark: 'D', triage: 'noticing', text: 'Swap one written task for a talking one — you hear more when they speak.' },
  { domain: 'wellness', mark: 'D', triage: 'concerned', text: 'Trust the unease — note it, date it, and let the Champion carry the next step.' },
  { domain: 'wellness', mark: 'SE', triage: 'routine', text: 'Leave on time one day this week. The pile will meet you Thursday either way.' },
  { domain: 'wellness', mark: 'SE', triage: 'noticing', text: 'Name one thing you absorbed this week to someone who can fix it — once, out loud.' },
  { domain: 'wellness', mark: 'SE', triage: 'concerned', text: 'Put down one duty tomorrow and let it be seen. Your Champion has been told.' },
  { domain: 'curriculum', mark: 'D', triage: 'routine', text: '20-minute Friday team-teach. Same problem, two approaches, ten-minute debrief.' },
  { domain: 'curriculum', mark: 'D', triage: 'noticing', text: 'Re-teach the one idea that slid, first thing — five minutes, different door in.' },
  { domain: 'curriculum', mark: 'D', triage: 'concerned', text: 'Shrink tomorrow to one thing done well. Depth settles a room faster than pace.' },
  { domain: 'curriculum', mark: 'R', triage: 'routine', text: 'Cold-call kindly — two pupils who never volunteer, questions they can land.' },
  { domain: 'curriculum', mark: 'R', triage: 'noticing', text: 'Move one quiet voice to the front row of your attention — one question, eye level.' },
  { domain: 'curriculum', mark: 'SE', triage: 'routine', text: 'Steal five minutes back: one starter recycled from last term is still a good starter.' },
  { domain: 'curriculum', mark: 'SE', triage: 'noticing', text: 'What you changed mid-lesson worked — write the one line down before it fades.' },
  { domain: 'curriculum', mark: 'L', triage: 'routine', text: 'End class with "what nearly made sense?" — the nearly is where tomorrow starts.' },
  { domain: 'infrastructure', mark: 'SE', triage: 'routine', text: 'Log the broken thing today — two lines, name attached. Absorbing it silently helps nobody.' },
  { domain: 'infrastructure', mark: 'SE', triage: 'noticing', text: 'Move the lesson to the shade, not through the heat. Comfort is pedagogy too.' },
  { domain: 'infrastructure', mark: 'SE', triage: 'concerned', text: 'Report it once more, in writing, and copy your Champion. Then teach where the air moves.' },
  { domain: 'infrastructure', mark: 'L', triage: 'routine', text: 'Ask the class what one fix would change the room most — they know before we do.' },
  { domain: 'one_child', mark: 'D', triage: 'routine', text: 'Find one honest reason to praise that child publicly tomorrow, early in the day.' },
  { domain: 'one_child', mark: 'D', triage: 'noticing', text: 'Two minutes at the gate, no agenda — "I was thinking about you" carries far.' },
  { domain: 'one_child', mark: 'D', triage: 'concerned', text: 'Keep your routine with them steady and gentle. Your Champion has been told.' },
  { domain: 'one_child', mark: 'D', triage: 'alarmed', text: 'Stay warm, stay usual, write down what you saw. The Champion is acting on it now.' },
]

/** Best-match lookup: exact (domain, mark, triage) → (domain, triage) → (mark, triage) → any routine. */
export function pickFallbackMove(domain: QuestionDomain, mark: SynodalMark, triage: TriageLabel): FallbackMicroMove {
  const bank = FALLBACK_MICRO_MOVES
  return (
    bank.find((m) => m.domain === domain && m.mark === mark && m.triage === triage) ??
    bank.find((m) => m.domain === domain && m.triage === triage) ??
    bank.find((m) => m.mark === mark && m.triage === triage) ??
    bank.find((m) => m.triage === triage) ??
    bank[0]
  )
}
