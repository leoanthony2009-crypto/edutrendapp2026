import type { QuestionDomain, TriageLabel } from '../types/survey'
import type { SynodalMark } from '../types/synodal'

/**
 * Curated POUI micro-move bank (PASTORAL_PULSE_SPEC § 5.2) — used whenever
 * the Gemini adapter is offline. Caribbean register, one sentence (two at
 * most), keyed by (domain, mark, triage).
 */
export interface FallbackMicroMove {
  domain: QuestionDomain
  mark: SynodalMark
  triage: TriageLabel
  text: string
}

export const FALLBACK_MICRO_MOVES: FallbackMicroMove[] = [
  // Wellness · Relating
  { domain: 'wellness', mark: 'R', triage: 'routine', text: 'Greet three pupils by name at the door tomorrow — the quiet ones first.' },
  { domain: 'wellness', mark: 'R', triage: 'noticing', text: "Tomorrow's first ten minutes — water, windows, a song they choose. Mark a register before, not after." },
  { domain: 'wellness', mark: 'R', triage: 'concerned', text: 'Sit near, not across — two quiet minutes beside the child before the bell. Your Champion has been told.' },
  { domain: 'wellness', mark: 'R', triage: 'alarmed', text: 'Stay warm and ordinary with the class tomorrow; the Champion has been told and carries it from here.' },
  // Wellness · Listening
  { domain: 'wellness', mark: 'L', triage: 'routine', text: 'End one class with "what should I know that I didn\'t ask?" — then just listen.' },
  { domain: 'wellness', mark: 'L', triage: 'noticing', text: 'Pick one pupil you have not really heard this week and give them the first question tomorrow.' },
  { domain: 'wellness', mark: 'L', triage: 'concerned', text: 'Keep tomorrow light — one check-in, no digging. Your Champion reads your note within 24 hours.' },
  { domain: 'wellness', mark: 'L', triage: 'alarmed', text: 'Nothing extra tomorrow — hold the routine steady. The Champion has been told.' },
  // Wellness · Discerning
  { domain: 'wellness', mark: 'D', triage: 'routine', text: 'Name one thing that went right today and tell the class it was them.' },
  { domain: 'wellness', mark: 'D', triage: 'noticing', text: 'Watch break time from the gallery for five minutes — see where the energy pools and where it drains.' },
  { domain: 'wellness', mark: 'D', triage: 'concerned', text: 'Note what you saw in One Child before it fades; the Champion picks it up from there.' },
  // Wellness · Self-Emptying
  { domain: 'wellness', mark: 'SE', triage: 'routine', text: 'Leave on time one day this week — the marking will meet you tomorrow.' },
  { domain: 'wellness', mark: 'SE', triage: 'noticing', text: 'Hand one small job to a pupil who needs to be needed — the register, the windows, the chalk.' },
  { domain: 'wellness', mark: 'SE', triage: 'concerned', text: 'Tomorrow, do less on purpose — one lesson at walking pace. You carried plenty today.' },
  // Curriculum · Discerning
  { domain: 'curriculum', mark: 'D', triage: 'routine', text: '20-minute Friday team-teach. Same problem, two approaches, ten-minute debrief.' },
  { domain: 'curriculum', mark: 'D', triage: 'noticing', text: 'Reteach the one idea that slid — five minutes, different door in: a story, a sketch, a lime.' },
  { domain: 'curriculum', mark: 'D', triage: 'concerned', text: 'Park the pace for a day — one small win the whole class can feel. The rest will keep.' },
  // Curriculum · Relating
  { domain: 'curriculum', mark: 'R', triage: 'routine', text: 'Cold-call kindly tomorrow — two pupils who never raise a hand, questions they can land.' },
  { domain: 'curriculum', mark: 'R', triage: 'noticing', text: 'Pair the quiet one with a steady friend for the first task — voice grows in small rooms.' },
  // Curriculum · Self-Emptying
  { domain: 'curriculum', mark: 'SE', triage: 'routine', text: 'What you changed mid-lesson today — write it on a sticky, share it in the staffroom. That was craft, not improvising.' },
  { domain: 'curriculum', mark: 'SE', triage: 'noticing', text: 'Borrow, don\'t build: ask one colleague for the resource you were about to make from scratch tonight.' },
  // Infrastructure · Self-Emptying
  { domain: 'infrastructure', mark: 'SE', triage: 'routine', text: 'The thing you keep fixing quietly — log it once, today, before you fix it again.' },
  { domain: 'infrastructure', mark: 'SE', triage: 'noticing', text: 'Open the windows before the class arrives and claim the coolest half-hour for the hardest work.' },
  { domain: 'infrastructure', mark: 'SE', triage: 'concerned', text: 'Report the broken thing today — in writing, once — and let it be someone else\'s to carry.' },
  // Infrastructure · Listening
  { domain: 'infrastructure', mark: 'L', triage: 'routine', text: 'Ask the class what one thing about the room makes work hardest — then move that one thing.' },
  // One Child · Discerning
  { domain: 'one_child', mark: 'D', triage: 'routine', text: 'Find one ordinary moment tomorrow to let that child feel seen — a nod, their name, their work held up.' },
  { domain: 'one_child', mark: 'D', triage: 'noticing', text: 'Give that child a small responsibility tomorrow morning — belonging often starts with being needed.' },
  { domain: 'one_child', mark: 'D', triage: 'concerned', text: 'Keep tomorrow gentle and predictable for them. Your Champion has been told and reads it within 24 hours.' },
  { domain: 'one_child', mark: 'D', triage: 'alarmed', text: 'Hold the routine, stay kind, write nothing on paper that names them. The Champion has been told.' },
]
