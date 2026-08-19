import type { OneChildEntry, Survey } from '../types/pulse'
import { storage } from './storage'
import { dateKey, isoNow } from './time'
import { seedHistory } from './trends'
import { seedStreak } from './pulses'

/* First-run demo seed. Mirrors the prototype's starting state so the unlock journey
   is demonstrable (teacher at 9 of 10 pulses; one more completes the unlock), the
   leader has a live survey, and the One Child watchlist shows a real cross-staff
   pattern. Runs once; everything afterwards is user-generated. */

const SEEDED_KEY = 'seeded'

export function seedDemoData(): void {
  if (storage.get<boolean>(SEEDED_KEY)) return

  storage.set('pulsesCompleted', { teacher: 9, leader: 12 })
  seedStreak(6)
  seedHistory()

  const leaderSurvey: Survey = {
    id: 'seed-survey-1',
    ownerRole: 'leader',
    title: 'Break-time supervision check',
    audience: 'Whole school',
    questions: [
      { id: 'sq1', text: 'Do you feel safe at break time?', options: ['Yes', 'Mostly', 'Not really', 'No'] },
      { id: 'sq2', text: 'Where do you spend most of break?', options: ['Yard', 'Corridor', 'Classroom', 'Library'] },
      { id: 'sq3', text: 'Is an adult easy to find at break?', options: ['Yes', 'Sometimes', 'No'] },
      { id: 'sq4', text: 'What would make break better?', options: null },
    ],
    status: 'live',
    responses: 23,
    createdAt: isoNow(),
  }
  storage.set('surveys', [leaderSurvey])

  const day = (offset: number) => {
    const d = new Date(Date.now() - offset * 86400000)
    return `${dateKey(d)}T10:30:00.000Z`
  }
  const oneChild: OneChildEntry[] = [
    { pupilHandle: 'F2-073', yearGroup: 'Form 2', notedFor: 'Quieter than usual, sitting alone at break', submittedBy: 'teacher-a', submittedAt: day(4) },
    { pupilHandle: 'F2-073', yearGroup: 'Form 2', notedFor: 'Skipped lunch twice this week', submittedBy: 'teacher-b', submittedAt: day(3) },
    { pupilHandle: 'F2-073', yearGroup: 'Form 2', notedFor: 'Asked to stay in at break again', submittedBy: 'teacher-c', submittedAt: day(1) },
    { pupilHandle: 'F3-041', yearGroup: 'Form 3', notedFor: 'Falling asleep in first period', submittedBy: 'teacher-a', submittedAt: day(6) },
    { pupilHandle: 'F3-041', yearGroup: 'Form 3', notedFor: 'Homework stopped arriving', submittedBy: 'teacher-b', submittedAt: day(2) },
    { pupilHandle: 'F3-041', yearGroup: 'Form 3', notedFor: 'Flinched at raised voices in the yard', submittedBy: 'teacher-a', submittedAt: day(0) },
    { pupilHandle: 'F1-112', yearGroup: 'Form 1', notedFor: 'New transfer, eating alone', submittedBy: 'teacher-c', submittedAt: day(5) },
    { pupilHandle: 'F1-112', yearGroup: 'Form 1', notedFor: 'Still no buddy pairing', submittedBy: 'teacher-b', submittedAt: day(2) },
    { pupilHandle: 'F1-112', yearGroup: 'Form 1', notedFor: 'Brightened in art class — worth building on', submittedBy: 'teacher-c', submittedAt: day(0) },
  ]
  storage.set('oneChildEntries', oneChild)

  storage.set(SEEDED_KEY, true)
}
