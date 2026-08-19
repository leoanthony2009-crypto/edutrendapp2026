export type SynodalMark = 'R' | 'L' | 'D' | 'SE'

export const SYNODAL_MARKS: Record<
  SynodalMark,
  { label: string; color: string; badgeColor: string; description: string }
> = {
  R: {
    label: 'Relating',
    color: '#C8A951',
    badgeColor: '#C8A951',
    description: 'Whose voice was present, and whose was not.',
  },
  L: {
    label: 'Listening',
    color: '#4A8AD0',
    badgeColor: '#2E6CAE',
    description: 'What the school was being told and may not have heard.',
  },
  D: {
    label: 'Discerning',
    color: '#5BAA70',
    badgeColor: '#38754B',
    description: 'What the teacher noticed and named.',
  },
  SE: {
    label: 'Self-Emptying',
    color: '#8E6FB6',
    badgeColor: '#6E548D',
    description: 'What the school absorbs without complaint.',
  },
}
