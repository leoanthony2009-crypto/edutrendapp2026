/** What's Hot theme cards + their Micro-Learning Shots.
    Citations are stored with the content (DESIGN_REVIEW P2-14) and flagged until verified. */

export interface Citation {
  text: string
  scope: 'tt' | 'wider'
  verified: boolean
  source: string
}

export interface HotTheme {
  id: string
  category: string
  heatLabel: string
  heatTone: 'concern' | 'warn' | 'good'
  title: string
  body: string
  provenance: string
  shot: {
    concept: string
    tryTomorrow: string
    citations: Citation[]
  }
}

export const HOT_THEMES: HotTheme[] = [
  {
    id: 'break-hotspots',
    category: 'SAFETY & PEERS',
    heatLabel: '92% heat',
    heatTone: 'concern',
    title: 'Break-time hotspots',
    body: 'Pupils in Forms 2–3 report feeling least safe around break times, near the back corridor.',
    provenance: 'Surfaced: rising 3 weeks · 20+ voices · matches leader Pulse concern',
    shot: {
      concept:
        'Pupils feel least safe where adult presence is thinnest. Visibility, not surveillance, is what changes how a corridor feels.',
      tryTomorrow:
        'Stand at the back corridor for the first five minutes of break with a cup of tea. Presence, not patrol.',
      citations: [
        {
          scope: 'tt',
          verified: false,
          source: 'MoE T&T school-safety reviews; UWI St. Augustine',
          text: 'T&T: Ministry of Education school-safety reviews and UWI St. Augustine studies consistently locate peer incidents in low-supervision spaces (corridors, stairwells, back yards) at unstructured times.',
        },
        {
          scope: 'wider',
          verified: false,
          source: 'Astor & Benbenishty',
          text: 'Wider: Astor & Benbenishty\'s school-violence research shows most incidents cluster in "unowned" spaces — and that visible, relational adult presence (not patrols) reduces them.',
        },
      ],
    },
  },
  {
    id: 'sba-stress',
    category: 'LEARNING PRESSURE',
    heatLabel: '74% heat',
    heatTone: 'warn',
    title: 'SBA stress climbing',
    body: 'Form 5 pupils reporting heavy days doubled since the SBA window opened.',
    provenance: 'Surfaced: new this fortnight · seasonal pattern likely',
    shot: {
      concept:
        'SBA pressure spikes are seasonal and predictable. Naming the pressure out loud reduces the shame of struggling with it.',
      tryTomorrow:
        'Open one class with: "SBA season is heavy for everyone — what is one thing that would make this week lighter?"',
      citations: [
        {
          scope: 'tt',
          verified: false,
          source: 'UWI School of Education, Caribbean Curriculum',
          text: 'T&T: UWI School of Education research in Caribbean Curriculum documents SBA workload as a leading stressor for CSEC students and teachers during the submission window.',
        },
        {
          scope: 'wider',
          verified: false,
          source: 'Putwain, test-anxiety research',
          text: 'Wider: test-anxiety research (e.g. Putwain) finds that normalising pressure and breaking work into named, small steps measurably lowers assessment stress.',
        },
      ],
    },
  },
  {
    id: 'buddy-scheme',
    category: 'POSITIVE SIGNAL',
    heatLabel: 'steady',
    heatTone: 'good',
    title: 'Buddy scheme working',
    body: '"Someone made my day better" is up 11 points among Form 1 since buddies launched.',
    provenance: 'Surfaced: consistent 5 weeks · worth sharing on the Bridge',
    shot: {
      concept:
        'Belonging grows fastest through one reliable peer connection — structure creates the chance, warmth does the rest.',
      tryTomorrow: 'Ask one buddy pair to show a new pupil their favourite spot in school this week.',
      citations: [
        {
          scope: 'tt',
          verified: false,
          source: 'T&T transition studies',
          text: 'T&T: local transition studies report Form 1 pupils naming "one friend who knows my name" as the strongest predictor of settling in by end of first term.',
        },
        {
          scope: 'wider',
          verified: false,
          source: 'EEF peer-mentoring evidence',
          text: 'Wider: EEF evidence on peer mentoring shows structured buddy schemes reliably improve belonging and attendance, with the largest gains for new and transitioning pupils.',
        },
      ],
    },
  },
]

export const NATIONAL_REPORT = {
  month: 'JULY 2026',
  participants: 12450,
  participationDelta: '+15%',
  headline:
    '"Secondary schools report 26% higher stress levels than Primary schools nationwide, driven largely by SBA deadlines and curriculum pacing."',
  regions: [
    { label: 'North', responses: 3480 },
    { label: 'Central', responses: 4120 },
    { label: 'South', responses: 2890 },
    { label: 'East', responses: 1440 },
    { label: 'Tobago', responses: 520 },
  ],
  note: 'Aggregated across 42 schools. No school or individual is identifiable below the 20-voice threshold.',
}

export const TEACHER_PERKS = [
  { title: 'CXC / SBA marking toolkit', sub: 'Free download · rubric templates + timers' },
  { title: '2GB data top-up', sub: 'For your 10-day pulse streak · any local carrier' },
  { title: 'NALIS extended borrowing', sub: 'Teacher pass · 6 items, 6 weeks' },
  { title: 'Wellness Wednesday voucher', sub: 'Early-close cover for one afternoon this term' },
]
