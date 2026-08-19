import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { newId } from './db.mjs'

const SESSION_HOURS = 12

export function hashPass(pass) {
  const salt = randomBytes(16).toString('hex')
  const hash = scryptSync(String(pass), salt, 32).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPass(pass, stored) {
  const [salt, hash] = String(stored).split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(String(pass), salt, 32)
  const expected = Buffer.from(hash, 'hex')
  return candidate.length === expected.length && timingSafeEqual(candidate, expected)
}

export function createSession(db, userId) {
  const token = `${newId('ses')}${randomBytes(24).toString('base64url')}`
  const now = new Date()
  const expires = new Date(now.getTime() + SESSION_HOURS * 3_600_000)
  db.prepare('INSERT INTO sessions (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)').run(
    token,
    userId,
    now.toISOString(),
    expires.toISOString()
  )
  return { token, expiresAt: expires }
}

export function destroySession(db, token) {
  db.prepare('DELETE FROM sessions WHERE token = ?').run(token)
}

function parseCookies(header) {
  const out = {}
  for (const part of String(header ?? '').split(';')) {
    const i = part.indexOf('=')
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim())
  }
  return out
}

export function sessionToken(req) {
  const bearer = req.headers.authorization
  if (bearer?.startsWith('Bearer ')) return bearer.slice(7)
  return parseCookies(req.headers.cookie)['bloom_session'] ?? null
}

/**
 * Resolve the authenticated user for a request. The session row — never any
 * client-supplied field — is the source of role, championship and school.
 */
export function currentUser(db, req) {
  const token = sessionToken(req)
  if (!token) return null
  const row = db
    .prepare(
      `SELECT s.token, s.expires_at, u.id, u.school_id, u.role, u.is_champion, u.name, u.display_handle, u.year_tier,
              sc.name AS school_name, sc.timezone, sc.code AS school_code, sc.board, sc.school_type, sc.location
       FROM sessions s JOIN users u ON u.id = s.user_id JOIN schools sc ON sc.id = u.school_id
       WHERE s.token = ?`
    )
    .get(token)
  if (!row) return null
  if (Date.parse(row.expires_at) < Date.now()) {
    destroySession(db, token)
    return null
  }
  return {
    id: row.id,
    schoolId: row.school_id,
    role: row.role,
    isChampion: row.is_champion === 1,
    name: row.name,
    displayHandle: row.display_handle,
    yearTier: row.year_tier,
    school: {
      name: row.school_name,
      code: row.school_code,
      timezone: row.timezone,
      board: row.board,
      schoolType: row.school_type,
      location: row.location,
    },
    token,
  }
}

export function requireAuth(db) {
  return (req, res, next) => {
    const user = currentUser(db, req)
    if (!user) return res.status(401).json({ error: 'not_authenticated' })
    req.user = user
    next()
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'forbidden' })
    next()
  }
}

export function requireChampion(req, res, next) {
  if (!req.user.isChampion) return res.status(403).json({ error: 'forbidden' })
  next()
}

export function sessionCookie(token, expiresAt) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `bloom_session=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Expires=${expiresAt.toUTCString()}${secure}`
}

export function clearedSessionCookie() {
  return 'bloom_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
}
