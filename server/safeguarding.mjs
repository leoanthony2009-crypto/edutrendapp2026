import { newId } from './db.mjs'
import { notify } from './notify.mjs'
import { looksLikeRealName } from './pulse-logic.mjs'

const DAY_MS = 86_400_000
const HOUR_MS = 3_600_000

function audit(db, alertId, schoolId, actorId, type, data = {}) {
  db.prepare(
    'INSERT INTO alert_events (alert_id, school_id, actor_id, type, data_json, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(alertId, schoolId, actorId, type, JSON.stringify(data), new Date().toISOString())
}

/** The school's primary Champion (assignment model: first champion account). */
export function primaryChampion(db, schoolId) {
  return db.prepare('SELECT id, name FROM users WHERE school_id = ? AND is_champion = 1 ORDER BY id LIMIT 1').get(schoolId)
}

/**
 * Create a Champion alert: server record + assignment + immutable audit
 * events + delivery through the notification adapter (never silent).
 */
export function createAlert(db, adapter, { schoolId, createdBy, triggerType, context, marks, pupilHandle = null, now = new Date() }) {
  const champion = primaryChampion(db, schoolId)
  const alert = {
    id: newId('alr'),
    school_id: schoolId,
    created_by: createdBy,
    assigned_to: champion?.id ?? null,
    trigger_type: triggerType,
    pupil_handle: pupilHandle,
    context: String(context).slice(0, 500),
    marks_json: JSON.stringify(marks),
    status: 'open',
    created_at: now.toISOString(),
    read_by_deadline: new Date(now.getTime() + 24 * HOUR_MS).toISOString(),
  }
  db.prepare(
    `INSERT INTO alerts (id, school_id, created_by, assigned_to, trigger_type, pupil_handle, context, marks_json, status, created_at, read_by_deadline)
     VALUES (@id, @school_id, @created_by, @assigned_to, @trigger_type, @pupil_handle, @context, @marks_json, @status, @created_at, @read_by_deadline)`
  ).run(alert)
  audit(db, alert.id, schoolId, createdBy, 'created', { triggerType, pupilHandle })
  if (champion) {
    audit(db, alert.id, schoolId, null, 'assigned', { championId: champion.id })
    notify(db, adapter, {
      schoolId,
      userId: champion.id,
      kind: 'champion_alert',
      payload: { alertId: alert.id, deadline: alert.read_by_deadline },
    })
  }
  return alert
}

export function readAlert(db, alertId, champion, { view = false } = {}) {
  const alert = db.prepare('SELECT * FROM alerts WHERE id = ? AND school_id = ?').get(alertId, champion.schoolId)
  if (!alert) return null
  if (view) audit(db, alertId, champion.schoolId, champion.id, 'viewed')
  return alert
}

export function acknowledgeAlert(db, alertId, champion) {
  const alert = readAlert(db, alertId, champion)
  if (!alert) return null
  if (alert.status === 'open') {
    const now = new Date().toISOString()
    db.prepare("UPDATE alerts SET status = 'reviewed', read_at = ?, read_by = ? WHERE id = ?").run(now, champion.id, alertId)
    audit(db, alertId, champion.schoolId, champion.id, 'acknowledged')
  }
  return readAlert(db, alertId, champion)
}

export function closeAlert(db, alertId, champion, outcome, note) {
  if (!String(note ?? '').trim()) {
    const err = new Error('outcome_note_required')
    err.status = 422
    throw err
  }
  const alert = readAlert(db, alertId, champion)
  if (!alert) return null
  const now = new Date().toISOString()
  db.prepare(
    `UPDATE alerts SET status = 'actioned', outcome = ?, outcome_note = ?, closed_at = ?,
       read_at = COALESCE(read_at, ?), read_by = COALESCE(read_by, ?) WHERE id = ?`
  ).run(outcome, String(note).trim(), now, now, champion.id, alertId)
  audit(db, alertId, champion.schoolId, champion.id, 'disposition', { outcome })
  audit(db, alertId, champion.schoolId, champion.id, 'note_recorded', { length: String(note).trim().length })
  audit(db, alertId, champion.schoolId, champion.id, 'closed')
  return readAlert(db, alertId, champion)
}

/**
 * Server-side 24h SLA sweep: any open alert past its read deadline is
 * escalated exactly once — audit event + notification to school leadership.
 * Runs on an interval in the server and is invoked directly by tests.
 */
export function escalateOverdueAlerts(db, adapter, now = new Date()) {
  const overdue = db
    .prepare("SELECT * FROM alerts WHERE status = 'open' AND escalated_at IS NULL AND read_by_deadline < ?")
    .all(now.toISOString())
  for (const alert of overdue) {
    db.prepare('UPDATE alerts SET escalated_at = ? WHERE id = ?').run(now.toISOString(), alert.id)
    audit(db, alert.id, alert.school_id, null, 'escalated', { deadline: alert.read_by_deadline })
    const leaders = db.prepare("SELECT id FROM users WHERE school_id = ? AND role = 'leader'").all(alert.school_id)
    for (const leader of leaders) {
      notify(db, adapter, {
        schoolId: alert.school_id,
        userId: leader.id,
        kind: 'champion_alert_overdue',
        payload: { alertId: alert.id, deadline: alert.read_by_deadline },
      })
    }
  }
  return overdue.length
}

/** § 4.2 pattern trigger: same handle from 2+ distinct staff within 5 days. */
export function recordOneChildEntry(db, adapter, user, { yearGroup, handle, notedFor }, now = new Date()) {
  if (looksLikeRealName(handle) || looksLikeRealName(notedFor)) {
    const err = new Error('use_handle_not_name')
    err.status = 422
    throw err
  }
  const pupilHandle = `${String(yearGroup).trim()}-${String(handle).trim()}`
  db.prepare(
    'INSERT INTO one_child (id, school_id, pupil_handle, year_group, noted_for, submitted_by, submitted_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(newId('oc'), user.schoolId, pupilHandle, String(yearGroup).trim(), String(notedFor).trim().slice(0, 120), user.id, now.toISOString())

  const since = new Date(now.getTime() - 5 * DAY_MS).toISOString()
  const staff = db
    .prepare('SELECT COUNT(DISTINCT submitted_by) AS n FROM one_child WHERE school_id = ? AND pupil_handle = ? AND submitted_at >= ?')
    .get(user.schoolId, pupilHandle, since)
  const openPattern = db
    .prepare("SELECT COUNT(*) AS n FROM alerts WHERE school_id = ? AND trigger_type = 'pattern' AND pupil_handle = ? AND status = 'open'")
    .get(user.schoolId, pupilHandle)
  if (staff.n >= 2 && openPattern.n === 0) {
    createAlert(db, adapter, {
      schoolId: user.schoolId,
      createdBy: null,
      triggerType: 'pattern',
      context: `${pupilHandle} noted by ${staff.n} staff within 5 days.`,
      marks: ['D'],
      pupilHandle,
      now,
    })
  }
  return pupilHandle
}

/** § 3.4 watchlist: ≥2 mentions across ≥3 distinct days in the past 14 days. */
export function watchlist(db, schoolId, now = new Date()) {
  const since = new Date(now.getTime() - 14 * DAY_MS).toISOString()
  const rows = db
    .prepare(
      `SELECT pupil_handle,
              COUNT(*) AS mentions,
              COUNT(DISTINCT substr(submitted_at, 1, 10)) AS days,
              COUNT(DISTINCT submitted_by) AS staff,
              GROUP_CONCAT(noted_for, ' · ') AS pattern
       FROM one_child WHERE school_id = ? AND submitted_at >= ?
       GROUP BY pupil_handle
       HAVING mentions >= 2 AND days >= 3
       ORDER BY mentions DESC`
    )
    .all(schoolId, since)
  const actions = db
    .prepare(
      `SELECT pupil_handle, action FROM watch_actions WHERE school_id = ?
       AND id IN (SELECT MAX(id) FROM watch_actions WHERE school_id = ? GROUP BY pupil_handle)`
    )
    .all(schoolId, schoolId)
  const actionByHandle = Object.fromEntries(actions.map((a) => [a.pupil_handle, a.action]))
  return rows.map((r) => ({
    pupilHandle: r.pupil_handle,
    mentions: r.mentions,
    days: r.days,
    staff: r.staff,
    pattern: r.pattern ?? '',
    marks: ['D'],
    action: actionByHandle[r.pupil_handle] ?? null,
  }))
}
