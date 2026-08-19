import type { PulseQuestion, Role } from '../types/survey'

/**
 * Per-question option sets are deliberate:
 * - Non-scale options run best-first ("Yes" → "No").
 * - `scale: true` options run worst-first ("Not at all" → "Fully").
 * - "Prefer not to say" is always offered on sensitive questions and is
 *   EXCLUDED from scoring entirely (DESIGN_REVIEW P1.3).
 */
export const PREFER_NOT_TO_SAY = 'Prefer not to say'

export const THEME_COLORS: Record<string, string> = {
  Safety: '#6E2B2F',
  Belonging: '#8E6FB6',
  'Trusted adult': '#295C4D',
  Voice: '#C8A951',
  Fairness: '#4A8AD0',
  'Peer treatment': '#6E2B2F',
  Stress: '#8E6FB6',
  Learning: '#5BAA70',
  Attendance: '#4A8AD0',
  Home: '#6F6A58',
  Participation: '#C8A951',
  Agency: '#295C4D',
  R: '#C8A951',
  L: '#4A8AD0',
  D: '#5BAA70',
  SE: '#8E6FB6',
  Attention: '#295C4D',
  Visibility: '#4A8AD0',
  Response: '#5BAA70',
  Barriers: '#8E6FB6',
  Action: '#C8A951',
}

export const STUDENT_QUESTIONS: PulseQuestion[] = [
  { id: 's1', theme: 'Safety', domain: 'wellness', type: 'single_select', text: 'Did you feel safe in school today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'L', routesTo: ['SD'] },
  { id: 's2', theme: 'Belonging', domain: 'wellness', type: 'single_select', text: 'Did you feel like you belonged here today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'R', routesTo: ['SD'] },
  { id: 's3', theme: 'Trusted adult', domain: 'wellness', type: 'single_select', text: 'Is there an adult here you trust to talk to?', options: ['Yes', 'Maybe', 'No'], mark: 'R', routesTo: ['SD'] },
  { id: 's4', theme: 'Voice', domain: 'wellness', type: 'single_select', text: 'Did you feel listened to today?', options: ['Yes', 'Sometimes', 'No'], mark: 'L', routesTo: ['SD'] },
  { id: 's5', theme: 'Fairness', domain: 'wellness', type: 'single_select', text: 'Were you treated fairly today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'L', routesTo: ['SD', 'TL'] },
  { id: 's6', theme: 'Peer treatment', domain: 'wellness', type: 'single_select', text: 'Did another pupil make you feel unsafe or uncomfortable?', options: ['No', 'A little', 'Yes', PREFER_NOT_TO_SAY], mark: 'D', routesTo: ['SD'] },
  { id: 's7', theme: 'Stress', domain: 'wellness', type: 'single_select', text: 'How heavy did today feel?', options: ['Light', 'Okay', 'Heavy', 'Very heavy'], mark: 'SE', routesTo: ['SD'] },
  { id: 's8', theme: 'Learning', domain: 'curriculum', type: 'single_select', text: "Did today's lessons make sense to you?", options: ['Mostly', 'Some', 'Hardly', 'Not at all'], mark: 'D', routesTo: ['AE'] },
  { id: 's9', theme: 'Attendance', domain: 'wellness', type: 'single_select', text: 'How do you feel about coming back tomorrow?', options: ['Looking forward', 'Okay', 'Unsure', "Don't want to"], mark: 'D', routesTo: ['SD'] },
  { id: 's10', theme: 'Home', domain: 'wellness', type: 'single_select', text: 'Is something outside school making learning harder right now?', options: ['No', 'A little', 'Yes', PREFER_NOT_TO_SAY], mark: 'SE', routesTo: ['SD', 'CS'] },
  { id: 's11', theme: 'Participation', domain: 'curriculum', type: 'single_select', text: 'Did you get a fair chance to speak or ask for help today?', options: ['Yes', 'Mostly', 'No'], mark: 'R', routesTo: ['SD', 'TL'] },
  { id: 's12', theme: 'Agency', domain: 'wellness', type: 'free_text', text: 'Is there something you wish adults here understood?', mark: 'L', routesTo: ['SD'], weekly: true, triggersChampion: true },
]

export const TEACHER_QUESTIONS: PulseQuestion[] = [
  { id: 't1', theme: 'SE', domain: 'infrastructure', type: 'scale', text: 'Was your classroom workable today (heat, light, space, supplies)?', options: ['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], scale: true, mark: 'SE', routesTo: ['CS'] },
  { id: 't2', theme: 'R', domain: 'wellness', type: 'one_word', text: 'How are you, in one word, today?', mark: 'R', routesTo: ['SD'] },
  { id: 't3', theme: 'D', domain: 'curriculum', type: 'scale', text: 'Did the lesson land?', options: ['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], scale: true, mark: 'D', routesTo: ['AE'] },
  { id: 't4', theme: 'R', domain: 'curriculum', type: 'free_text', text: 'Whose voice did you not hear today?', mark: 'R', routesTo: ['SD'] },
  { id: 't5', theme: 'L', domain: 'wellness', type: 'free_text', text: 'Did anything happen today that you would want a leader to know?', mark: 'L', routesTo: ['SD', 'TL'], triggersChampion: true },
]

export const LEADER_QUESTIONS: PulseQuestion[] = [
  { id: 'l1', theme: 'Attention', domain: 'wellness', type: 'single_select', text: 'What concern is taking the most leadership attention this week?', options: ['Safety', 'Attendance', 'Behaviour', 'Learning', 'Wellbeing', 'Staffing', 'Family engagement'], neutral: true, mark: 'D', routesTo: ['TL'] },
  { id: 'l2', theme: 'Visibility', domain: 'wellness', type: 'free_text', text: 'Where do you feel your team has the least visibility right now?', mark: 'L', routesTo: ['TL'] },
  { id: 'l3', theme: 'Response', domain: 'wellness', type: 'single_select', text: 'Are staff responding consistently when pupils raise concerns?', options: ['Yes', 'Mostly', 'Inconsistently', 'No'], mark: 'L', routesTo: ['SD', 'TL'] },
  { id: 'l4', theme: 'Barriers', domain: 'wellness', type: 'single_select', text: 'What is preventing earlier pastoral intervention?', options: ['Time', 'Information', 'Staffing', 'Confidence', 'Communication', 'Unclear responsibility'], neutral: true, mark: 'SE', routesTo: ['TL'] },
  { id: 'l5', theme: 'Action', domain: 'wellness', type: 'free_text', text: 'What is one thing pupils are telling us that needs a leadership response this week?', mark: 'R', routesTo: ['TL'] },
]

export const DEFAULT_BANKS: Record<Role, PulseQuestion[]> = {
  student: STUDENT_QUESTIONS,
  teacher: TEACHER_QUESTIONS,
  leader: LEADER_QUESTIONS,
}
