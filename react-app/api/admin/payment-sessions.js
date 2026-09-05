import crypto from 'node:crypto'
import { getPool } from '../_lib/db.js'

function sessionToken(req) {
  return req.headers.cookie?.match(/(?:^|; )turfon24_admin_session=([^;]+)/)?.[1]
}

async function requireAdmin(req) {
  const raw = sessionToken(req)
  if (!raw) return false
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  const result = await getPool().query(
    'SELECT 1 FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id WHERE s.session_token_hash = $1 AND a.active = TRUE LIMIT 1',
    [hash],
  )
  return Boolean(result.rowCount)
}

async function expireSessions(pool) {
  await pool.query(
    "UPDATE payment_sessions SET status = 'EXPIRED' WHERE status = 'PAYMENT_PENDING' AND expires_at <= NOW()",
  )
}

export default async function handler(req, res) {
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ message: 'Method not allowed' })

  try {
    if (!await requireAdmin(req)) return res.status(401).json({ message: 'Admin authentication required.' })
    const pool = getPool()
    await expireSessions(pool)

    if (req.method === 'GET') {
      const status = String(req.query?.status || 'all').trim().toUpperCase()
      const search = String(req.query?.search || '').trim()
      const allowedStatuses = new Set(['PAYMENT_PENDING', 'PAID', 'EXPIRED', 'FAILED'])
      const values = []
      const clauses = []
      if (allowedStatuses.has(status)) {
        values.push(status)
        clauses.push(`status = $${values.length}`)
      }
      if (search) {
        values.push(`%${search}%`)
        clauses.push(`(reference ILIKE $${values.length} OR booking_data::text ILIKE $${values.length})`)
      }
      const result = await pool.query(
        `SELECT reference, booking_type AS "bookingType", amount, currency, status,
                booking_data AS "bookingData", created_at AS "createdAt",
                expires_at AS "expiresAt", paid_at AS "paidAt"
         FROM payment_sessions
         ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}
         ORDER BY created_at DESC`,
        values,
      )
      return res.status(200).json({ sessions: result.rows })
    }

    const reference = String(req.body?.reference || '').trim()
    if (!reference) return res.status(400).json({ message: 'Payment reference is required.' })
    const result = await pool.query(
      `UPDATE payment_sessions
       SET status = 'PAID', paid_at = NOW()
       WHERE reference = $1 AND status = 'PAYMENT_PENDING' AND expires_at > NOW()
       RETURNING reference, amount, currency, status, paid_at AS "paidAt"`,
      [reference],
    )
    if (!result.rowCount) {
      const existing = await pool.query('SELECT status FROM payment_sessions WHERE reference = $1 LIMIT 1', [reference])
      if (!existing.rowCount) return res.status(404).json({ message: 'Payment session not found.' })
      return res.status(409).json({ message: `Payment session is ${existing.rows[0].status}.` })
    }
    return res.status(200).json(result.rows[0])
  } catch (error) {
    console.error('admin payment sessions failed', error.message)
    return res.status(503).json({ message: 'Payment records are temporarily unavailable.' })
  }
}
