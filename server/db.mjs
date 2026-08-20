import Database from 'better-sqlite3'
import { randomBytes } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

export function newId(prefix) {
  return `${prefix}_${randomBytes(9).toString('base64url')}`
}

const SCHEMA = `
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  timezone TEXT NOT NULL DEFAULT 'America/Port_of_Spain',
  board TEXT, school_type TEXT, location TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  role TEXT NOT NULL CHECK (role IN ('student','teacher','leader')),
  is_champion INTEGER NOT NULL DEFAULT 0,
  name TEXT NOT NULL,
  display_handle TEXT,
  year_tier TEXT NOT NULL DEFAULT 'senior' CHECK (year_tier IN ('junior','senior')),
  code TEXT NOT NULL,
  pass_hash TEXT NOT NULL,
  UNIQUE (school_id, code)
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS runs (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  role TEXT NOT NULL,
  date TEXT NOT NULL,
  score INTEGER,
  responses_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  UNIQUE (user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_runs_school_date ON runs (school_id, date);

CREATE TABLE IF NOT EXISTS banks (
  school_id TEXT NOT NULL REFERENCES schools(id),
  role TEXT NOT NULL,
  bank_json TEXT NOT NULL,
  PRIMARY KEY (school_id, role)
);

CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  owner_id TEXT NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT '',
  audience TEXT NOT NULL,
  year_groups_json TEXT NOT NULL DEFAULT '[]',
  questions_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','live','paused','closed')),
  tracker INTEGER NOT NULL DEFAULT 0,
  series_id TEXT,
  close_date TEXT,
  created_at TEXT NOT NULL,
  launched_at TEXT,
  closed_at TEXT
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL REFERENCES surveys(id),
  school_id TEXT NOT NULL REFERENCES schools(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  answers_json TEXT NOT NULL,
  submitted_at TEXT NOT NULL,
  UNIQUE (survey_id, user_id)
);

CREATE TABLE IF NOT EXISTS alerts (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  created_by TEXT REFERENCES users(id),
  assigned_to TEXT REFERENCES users(id),
  trigger_type TEXT NOT NULL CHECK (trigger_type IN ('free_text','safeguarding','pattern')),
  pupil_handle TEXT,
  context TEXT NOT NULL,
  marks_json TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','reviewed','actioned')),
  created_at TEXT NOT NULL,
  read_by_deadline TEXT NOT NULL,
  read_at TEXT,
  read_by TEXT,
  outcome TEXT,
  outcome_note TEXT,
  closed_at TEXT,
  escalated_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_alerts_school ON alerts (school_id, status);

CREATE TABLE IF NOT EXISTS alert_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  alert_id TEXT NOT NULL REFERENCES alerts(id),
  school_id TEXT NOT NULL,
  actor_id TEXT,
  type TEXT NOT NULL,
  data_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL
);

-- (immutability triggers for alert_events are created separately below)

CREATE TABLE IF NOT EXISTS one_child (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  pupil_handle TEXT NOT NULL,
  year_group TEXT NOT NULL,
  noted_for TEXT NOT NULL,
  submitted_by TEXT NOT NULL REFERENCES users(id),
  submitted_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watch_actions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id TEXT NOT NULL,
  pupil_handle TEXT NOT NULL,
  action TEXT NOT NULL,
  champion_id TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS school_actions (
  id TEXT PRIMARY KEY,
  school_id TEXT NOT NULL REFERENCES schools(id),
  leader_id TEXT NOT NULL REFERENCES users(id),
  signal_summary TEXT NOT NULL,
  action_taken TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS micro_moves (
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,
  text TEXT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL,
  tried INTEGER NOT NULL DEFAULT 0,
  saved INTEGER NOT NULL DEFAULT 0,
  helped TEXT,
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id TEXT NOT NULL,
  user_id TEXT,
  kind TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  delivered_at TEXT
);

CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  school_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS prefs (
  user_id TEXT PRIMARY KEY,
  bridge_digest INTEGER NOT NULL DEFAULT 1
);
`

/** Audit rows can never be updated or deleted — enforced at the database. */
export const AUDIT_TRIGGERS = `
CREATE TRIGGER IF NOT EXISTS alert_events_no_update
BEFORE UPDATE ON alert_events
BEGIN SELECT RAISE(ABORT, 'alert_events is immutable'); END;
CREATE TRIGGER IF NOT EXISTS alert_events_no_delete
BEFORE DELETE ON alert_events
BEGIN SELECT RAISE(ABORT, 'alert_events is immutable'); END;
`

export function openDb(path = process.env.BLOOM_DB ?? 'data/bloom.sqlite') {
  if (path !== ':memory:') {
    try {
      mkdirSync(dirname(path), { recursive: true })
    } catch {
      /* cwd-relative file */
    }
  }
  const db = new Database(path)
  db.exec(SCHEMA)
  db.exec(AUDIT_TRIGGERS)
  return db
}

/** Test-only: wipe every table and reseed (drops/recreates audit triggers). */
export function resetForTests(db, reseed) {
  db.exec('DROP TRIGGER IF EXISTS alert_events_no_update; DROP TRIGGER IF EXISTS alert_events_no_delete;')
  db.exec('PRAGMA foreign_keys = OFF')
  const tables = db.prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'").all()
  for (const t of tables) db.prepare(`DELETE FROM ${t.name}`).run()
  db.exec('PRAGMA foreign_keys = ON')
  db.exec(AUDIT_TRIGGERS)
  reseed?.(db)
}
