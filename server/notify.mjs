/**
 * Notification/escalation abstraction. Safeguarding must never depend on the
 * Champion happening to open the app: every alert produces a delivery attempt
 * through this adapter. In development the adapter records delivery in the
 * notifications table (an outbox) and logs — it never pretends an external
 * message was sent. Production wires a real channel (SMS/email) here.
 */
export function createDevDeliveryAdapter(db, { quiet = false } = {}) {
  return {
    name: 'dev-outbox',
    deliver(notificationId) {
      const now = new Date().toISOString()
      db.prepare('UPDATE notifications SET delivered_at = ? WHERE id = ?').run(now, notificationId)
      if (!quiet) {
        const n = db.prepare('SELECT kind, user_id, school_id FROM notifications WHERE id = ?').get(notificationId)
        console.log(`[bloom notify] ${n.kind} → user=${n.user_id ?? 'school'} school=${n.school_id}`)
      }
      return true
    },
  }
}

export function notify(db, adapter, { schoolId, userId = null, kind, payload }) {
  const res = db
    .prepare('INSERT INTO notifications (school_id, user_id, kind, payload_json, created_at) VALUES (?, ?, ?, ?, ?)')
    .run(schoolId, userId, kind, JSON.stringify(payload ?? {}), new Date().toISOString())
  adapter.deliver(res.lastInsertRowid)
  return res.lastInsertRowid
}
