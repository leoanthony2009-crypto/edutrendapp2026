/**
 * Demo aggregate data. In production these come from the BSC rollup API
 * (`/api/bsc/rollup`) — locally they give screens realistic collated context
 * that the user's own submitted pulse blends into.
 */
export const SCHOOL_BASELINE_TODAY = 73

/** Blend the school baseline with the user's own collated run score. */
export function collatedToday(runScore: number | null | undefined): number {
  if (runScore === null || runScore === undefined) return SCHOOL_BASELINE_TODAY
  return Math.round((SCHOOL_BASELINE_TODAY + runScore) / 2)
}

export const PULSE_7D = [64, 66, 61, 69, 71, 68]
export const PULSE_30D = [58, 62, 60, 65, 63, 67, 64, 66, 61, 69, 71]
export const PULSE_TERM = [52, 55, 60, 57, 63, 66, 64, 70, 68, 72, 71]

export const PARTICIPATION_WEEK = [78, 82, 74, 80, 84, 79]
export const PARTICIPATION_DAYS = ['W', 'T', 'F', 'M', 'T', 'W', 'Today']

export const DOMAIN_SNAPSHOT = [
  { label: 'Safety & peers', value: 67, delta: -3 },
  { label: 'Belonging', value: 72, delta: 4 },
  { label: 'Trusted adults', value: 61, delta: 1 },
  { label: 'Emotional load', value: 58, delta: -2 },
  { label: 'Engagement', value: 70, delta: 2 },
  { label: 'Learning', value: 64, delta: 0 },
  { label: 'Voice & fairness', value: 69, delta: 5 },
  { label: 'Home context', value: 62, delta: -1 },
]

export const RECURRING_THEMES = [
  { label: 'Break-time safety (Forms 2–3)', sub: 'Safety · 44 mentions', width: 84, color: '#D9634E' },
  { label: 'SBA pressure', sub: 'Learning pressure · 36 mentions', width: 68, color: '#C8A951' },
  { label: 'Buddy scheme lifting belonging', sub: 'Positive signal · 29 mentions', width: 55, color: '#5BAA70' },
]

export const UNHEARD_COHORTS = [
  { label: 'Form 3 boys', pct: 38, color: '#D9634E' },
  { label: 'New transfers', pct: 46, color: '#E19A45' },
  { label: 'Form 1', pct: 72, color: '#5BAA70' },
  { label: 'Form 5 (SBA term)', pct: 54, color: '#C8A951' },
]

export const LESSONS_DISTRIBUTION = [
  { label: 'Mostly', pct: 48, color: '#5BAA70' },
  { label: 'Some', pct: 29, color: '#C8A951' },
  { label: 'Hardly', pct: 15, color: '#E19A45' },
  { label: 'Not at all', pct: 8, color: '#D9634E' },
]

export const NATIONAL_REGIONS = [
  { label: 'North', value: 3480 },
  { label: 'Central', value: 4120 },
  { label: 'South', value: 2890 },
  { label: 'East', value: 1440 },
  { label: 'Tobago', value: 520 },
]

/** Seed watchlist line shown before local One Child entries accumulate. */
export const SEED_WATCHLIST_NOTE = { handle: 'F2-073', staff: 3, days: 4 }
