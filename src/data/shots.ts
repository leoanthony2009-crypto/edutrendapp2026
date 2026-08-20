/**
 * What's Hot theme cards + Micro-Learning Shots. Citations are stored WITH
 * the content (DESIGN_REVIEW P2.14) so they ship together and can be
 * verified/replaced editorially without code changes. The `verified` flag is
 * false until the named studies are confirmed for school-facing release.
 */
export interface Citation {
  scope: 'T&T' | 'Wider'
  text: string
  source: string
  verified: boolean
}

export interface HotTheme {
  id: string
  category: string
  heat: string
  heatColor: string
  title: string
  body: string
  bar: string
  why: string
  shot: {
    concept: string
    tryThis: string
    citations: Citation[]
  }
}

export const HOT_THEMES: HotTheme[] = [
  {
    id: 'break-hotspots',
    category: 'SAFETY & PEERS',
    heat: '92% heat',
    heatColor: '#A03E2D',
    title: 'Break-time hotspots',
    body: 'Pupils in Forms 2–3 report feeling least safe around break times, near the back corridor.',
    bar: 'linear-gradient(90deg,#E19A45,#D9634E)',
    why: 'Surfaced: rising 3 weeks · 20+ voices · matches leader Pulse concern',
    shot: {
      concept:
        'Pupils feel least safe where adult presence is thinnest. Visibility, not surveillance, is what changes how a corridor feels.',
      tryThis: 'Stand at the back corridor for the first five minutes of break with a cup of tea. Presence, not patrol.',
      citations: [
        {
          scope: 'T&T',
          text: 'Ministry of Education school-safety reviews and UWI St. Augustine studies consistently locate peer incidents in low-supervision spaces (corridors, stairwells, back yards) at unstructured times.',
          source: 'MoE T&T safety reviews; UWI St. Augustine',
          verified: false,
        },
        {
          scope: 'Wider',
          text: 'Astor & Benbenishty\'s school-violence research shows most incidents cluster in "unowned" spaces — and that visible, relational adult presence (not patrols) reduces them.',
          source: 'Astor & Benbenishty, school violence research',
          verified: false,
        },
      ],
    },
  },
  {
    id: 'sba-stress',
    category: 'LEARNING PRESSURE',
    heat: '74% heat',
    heatColor: '#8A7325',
    title: 'SBA stress climbing',
    body: 'Form 5 pupils reporting heavy days doubled since the SBA window opened.',
    bar: 'linear-gradient(90deg,#C8A951,#E19A45)',
    why: 'Surfaced: new this fortnight · seasonal pattern likely',
    shot: {
      concept: 'SBA pressure spikes are seasonal and predictable. Naming the pressure out loud reduces the shame of struggling with it.',
      tryThis: 'Open one class with: "SBA season is heavy for everyone — what is one thing that would make this week lighter?"',
      citations: [
        {
          scope: 'T&T',
          text: 'UWI School of Education research in Caribbean Curriculum documents SBA workload as a leading stressor for CSEC students and teachers during the submission window.',
          source: 'UWI Caribbean Curriculum, SBA research',
          verified: false,
        },
        {
          scope: 'Wider',
          text: 'Test-anxiety research (e.g. Putwain) finds that normalising pressure and breaking work into named, small steps measurably lowers assessment stress.',
          source: 'Putwain, test-anxiety research',
          verified: false,
        },
      ],
    },
  },
  {
    id: 'buddy-scheme',
    category: 'POSITIVE SIGNAL',
    heat: 'steady',
    heatColor: '#3D7A50',
    title: 'Buddy scheme working',
    body: '"Someone made my day better" is up 11 points among Form 1 since buddies launched.',
    bar: '#5BAA70',
    why: 'Surfaced: consistent 5 weeks · worth sharing on the Bridge',
    shot: {
      concept: 'Belonging grows fastest through one reliable peer connection — structure creates the chance, warmth does the rest.',
      tryThis: 'Ask one buddy pair to show a new pupil their favourite spot in school this week.',
      citations: [
        {
          scope: 'T&T',
          text: 'Local transition studies report Form 1 pupils naming "one friend who knows my name" as the strongest predictor of settling in by end of first term.',
          source: 'T&T transition studies',
          verified: false,
        },
        {
          scope: 'Wider',
          text: 'EEF evidence on peer mentoring shows structured buddy schemes reliably improve belonging and attendance, with the largest gains for new and transitioning pupils.',
          source: 'Education Endowment Foundation, peer mentoring',
          verified: false,
        },
      ],
    },
  },
]

export const TEACHER_PERKS = [
  { title: 'CXC / SBA marking toolkit', sub: 'Free download · rubric templates + timers' },
  { title: '2GB data top-up', sub: 'For your 10-day pulse streak · any local carrier' },
  { title: 'NALIS extended borrowing', sub: 'Teacher pass · 6 items, 6 weeks' },
  { title: 'Wellness Wednesday voucher', sub: 'Early-close cover for one afternoon this term' },
]
