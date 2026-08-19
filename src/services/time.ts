/** School-configured timezone drives every date key so a whole class sees the same
    rotation regardless of device clock settings (DESIGN_REVIEW P2-9). Rotation itself
    is deterministic over (schoolId, dateKey) — a server can compute the identical set. */
export const SCHOOL_CONFIG = {
  schoolId: 'st-josephs-rc',
  schoolName: "St. Joseph's RC Secondary",
  timezone: 'America/Port_of_Spain',
}

export function dateKey(date = new Date()): string {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: SCHOOL_CONFIG.timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  return fmt.format(date) // YYYY-MM-DD
}

/** 0 = Sunday … 6 = Saturday, in the school timezone. */
export function schoolWeekday(date = new Date()): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: SCHOOL_CONFIG.timezone, weekday: 'short' }).format(date)
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(name)
}

/** ISO-week style key (year-week) used to gate the weekly Leader Pulse. */
export function weekKey(date = new Date()): string {
  const key = dateKey(date)
  const [y, m, d] = key.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d)
  const dayNum = new Date(utc).getUTCDay() || 7
  const thursday = new Date(utc + (4 - dayNum) * 86400000)
  const yearStart = Date.UTC(thursday.getUTCFullYear(), 0, 1)
  const week = Math.ceil(((thursday.getTime() - yearStart) / 86400000 + 1) / 7)
  return `${thursday.getUTCFullYear()}-W${String(week).padStart(2, '0')}`
}

export function isoNow(): string {
  return new Date().toISOString()
}
