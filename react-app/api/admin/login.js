import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { getPool } from '../_lib/db.js'

function cookie(name, value, maxAge) { return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${process.env.NODE_ENV === 'production' ? '; Secure' : ''}` }

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  try {
    const pool = getPool()
    const result = await pool.query('SELECT id, password_hash FROM admin_users WHERE lower(email) = $1 AND active = TRUE LIMIT 1', [email])
    const valid = result.rowCount && await bcrypt.compare(password, result.rows[0].password_hash)
    if (!valid) return res.status(401).json({ message: 'Incorrect email or password.' })
    const rawSession = crypto.randomBytes(32).toString('hex')
    const hash = crypto.createHash('sha256').update(rawSession).digest('hex')
    await pool.query('INSERT INTO admin_sessions (admin_id, session_token_hash) VALUES ($1, $2)', [result.rows[0].id, hash])
    res.setHeader('Set-Cookie', cookie('turfon24_admin_session', rawSession, 60 * 60 * 8))
    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('admin login failed', error.message)
    return res.status(503).json({ message: 'Login is temporarily unavailable.' })
  }
}
