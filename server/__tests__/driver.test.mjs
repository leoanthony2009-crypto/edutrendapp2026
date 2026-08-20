// @vitest-environment node
/**
 * The SQLite driver is resolved at import time: Node's built-in node:sqlite
 * when available, better-sqlite3 otherwise (see server/db.mjs). These assert
 * that whichever driver is in use supports everything the server relies on —
 * most importantly the RAISE(ABORT) triggers that make the safeguarding audit
 * trail immutable, and foreign-key enforcement. A driver that silently lost
 * either would weaken a guarantee the pilot readiness assessment depends on.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { openDb } from '../db.mjs'

let db

function seedAlert() {
  db.prepare("INSERT INTO schools (id, code, name, timezone) VALUES ('sch','S','School','UTC')").run()
  db.prepare(
    `INSERT INTO alerts (id, school_id, created_by, assigned_to, trigger_type, pupil_handle, context, marks_json, status, created_at, read_by_deadline)
     VALUES (@id, @school_id, @created_by, @assigned_to, @trigger_type, @pupil_handle, @context, @marks_json, @status, @created_at, @read_by_deadline)`
  ).run({
    id: 'alr_1',
    school_id: 'sch',
    created_by: null,
    assigned_to: null,
    trigger_type: 'safeguarding',
    pupil_handle: null,
    context: 'ctx',
    marks_json: '["L"]',
    status: 'open',
    created_at: '2026-01-01T00:00:00.000Z',
    read_by_deadline: '2026-01-02T00:00:00.000Z',
  })
}

beforeEach(() => {
  db = openDb(':memory:')
})

describe('SQLite driver capabilities', () => {
  it('runs the full schema including triggers', () => {
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
      .all()
      .map((r) => r.name)
    for (const expected of ['alerts', 'alert_events', 'runs', 'schools', 'sessions', 'surveys', 'users']) {
      expect(tables).toContain(expected)
    }
  })

  it('enforces foreign keys', () => {
    expect(() =>
      db
        .prepare("INSERT INTO alert_events (alert_id, school_id, type, data_json, created_at) VALUES ('missing','sch','created','{}','2026-01-01')")
        .run()
    ).toThrow(/FOREIGN KEY/i)
  })

  it('enforces audit immutability at the database, not in application code', () => {
    seedAlert()
    db.prepare(
      "INSERT INTO alert_events (alert_id, school_id, actor_id, type, data_json, created_at) VALUES ('alr_1','sch',NULL,'created','{}','2026-01-01')"
    ).run()
    expect(() => db.prepare("UPDATE alert_events SET type = 'tampered'").run()).toThrow(/immutable/)
    expect(() => db.prepare('DELETE FROM alert_events').run()).toThrow(/immutable/)
    expect(db.prepare('SELECT COUNT(*) AS n FROM alert_events').get().n).toBe(1)
  })

  it('supports named parameters, aggregates and null round-trips', () => {
    seedAlert()
    const row = db.prepare('SELECT * FROM alerts WHERE id = ?').get('alr_1')
    expect(row.context).toBe('ctx')
    expect(row.created_by).toBeNull()
    const agg = db
      .prepare("SELECT COUNT(DISTINCT id) c, GROUP_CONCAT(context,' · ') g, substr(created_at,1,10) d FROM alerts")
      .get()
    expect(agg.c).toBe(1)
    expect(agg.d).toBe('2026-01-01')
  })

  it('reports changes and lastInsertRowid from run()', () => {
    seedAlert()
    const res = db
      .prepare("INSERT INTO alert_events (alert_id, school_id, type, data_json, created_at) VALUES ('alr_1','sch','created','{}','2026-01-01')")
      .run()
    expect(Number(res.changes)).toBe(1)
    expect(Number(res.lastInsertRowid)).toBeGreaterThan(0)
  })
})
