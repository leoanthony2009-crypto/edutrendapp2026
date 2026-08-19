import type { PulseQuestion, Role } from '../types/pulse'

/** Default per-role banks — student 12 / teacher 5 / leader 5 (README § State Management). */
export const DEFAULT_BANKS: Record<Role, PulseQuestion[]> = {
  student: [
    { id: 's1', theme: 'Safety', text: 'Did you feel safe in school today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'R', routesTo: ['SD'] },
    { id: 's2', theme: 'Belonging', text: 'Did you feel like you belonged here today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'R', routesTo: ['SD'] },
    { id: 's3', theme: 'Trusted adult', text: 'Is there an adult here you trust to talk to?', options: ['Yes', 'Maybe', 'No'], mark: 'L', routesTo: ['SD'] },
    { id: 's4', theme: 'Voice', text: 'Did you feel listened to today?', options: ['Yes', 'Sometimes', 'No'], mark: 'L', routesTo: ['SD', 'TL'] },
    { id: 's5', theme: 'Fairness', text: 'Were you treated fairly today?', options: ['Yes', 'Mostly', 'Not really', 'No'], mark: 'D', routesTo: ['SD'] },
    { id: 's6', theme: 'Peer treatment', text: 'Did another pupil make you feel unsafe or uncomfortable?', options: ['No', 'A little', 'Yes', 'Prefer not to say'], mark: 'D', routesTo: ['SD'] },
    { id: 's7', theme: 'Stress', text: 'How heavy did today feel?', options: ['Light', 'Okay', 'Heavy', 'Very heavy'], mark: 'SE', routesTo: ['SD'] },
    { id: 's8', theme: 'Learning', text: "Did today's lessons make sense to you?", options: ['Mostly', 'Some', 'Hardly', 'Not at all'], mark: 'D', routesTo: ['AE'] },
    { id: 's9', theme: 'Attendance', text: 'How do you feel about coming back tomorrow?', options: ['Looking forward', 'Okay', 'Unsure', "Don't want to"], mark: 'R', routesTo: ['SD', 'AE'] },
    { id: 's10', theme: 'Home', text: 'Is something outside school making learning harder right now?', options: ['No', 'A little', 'Yes', 'Prefer not to say'], mark: 'L', routesTo: ['CS', 'SD'] },
    { id: 's11', theme: 'Participation', text: 'Did you get a fair chance to speak or ask for help today?', options: ['Yes', 'Mostly', 'No'], mark: 'R', routesTo: ['TL'] },
    { id: 's12', theme: 'Agency', text: 'Is there something you wish adults here understood?', options: null, mark: 'L', routesTo: ['SD', 'TL'], weekly: true, triggersChampion: true },
  ],
  teacher: [
    { id: 't1', theme: 'SE', text: 'Was your classroom workable today (heat, light, space, supplies)?', options: ['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], mark: 'SE', routesTo: ['CS'], domain: 'infrastructure', scale: true },
    { id: 't2', theme: 'R', text: 'How are you, in one word, today?', options: null, mark: 'R', routesTo: ['SD'], domain: 'wellness' },
    { id: 't3', theme: 'D', text: 'Did the lesson land?', options: ['Not at all', 'Barely', 'Somewhat', 'Mostly', 'Fully'], mark: 'D', routesTo: ['AE'], domain: 'curriculum', scale: true },
    { id: 't4', theme: 'R', text: 'Whose voice did you not hear today?', options: null, mark: 'R', routesTo: ['SD'], domain: 'curriculum' },
    { id: 't5', theme: 'L', text: 'Did anything happen today that you would want a leader to know?', options: null, mark: 'L', routesTo: ['SD', 'TL'], domain: 'wellness', triggersChampion: true },
  ],
  leader: [
    { id: 'l1', theme: 'Attention', text: 'What concern is taking the most leadership attention this week?', options: ['Safety', 'Attendance', 'Behaviour', 'Learning', 'Wellbeing', 'Staffing', 'Family engagement'], mark: 'D', routesTo: ['TL'], neutral: true },
    { id: 'l2', theme: 'Visibility', text: 'Where do you feel your team has the least visibility right now?', options: null, mark: 'L', routesTo: ['TL'] },
    { id: 'l3', theme: 'Response', text: 'Are staff responding consistently when pupils raise concerns?', options: ['Yes', 'Mostly', 'Inconsistently', 'No'], mark: 'D', routesTo: ['TL', 'SD'] },
    { id: 'l4', theme: 'Barriers', text: 'What is preventing earlier pastoral intervention?', options: ['Time', 'Information', 'Staffing', 'Confidence', 'Communication', 'Unclear responsibility'], mark: 'SE', routesTo: ['TL'], neutral: true },
    { id: 'l5', theme: 'Action', text: 'What is one thing pupils are telling us that needs a leadership response this week?', options: null, mark: 'L', routesTo: ['TL', 'SD'], triggersChampion: true },
  ],
}
