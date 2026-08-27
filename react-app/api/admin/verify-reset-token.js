import { getPool } from '../_lib/db.js'
import { hashToken } from '../_lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  const token = String(req.query?.token || '')
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ valid: false, reason: 'invalid' })
  try {
    const result = await getPool().query(`SELECT CASE WHEN used_at IS NOT NULL THEN 'used' WHEN expires_at <= NOW() THEN 'expired' ELSE 'valid' END AS status FROM password_reset_tokens WHERE token_hash = $1 LIMIT 1`, [hashToken(token)])
    if (!result.rowCount) return res.status(200).json({ valid: false, reason: 'invalid' })
    const status = result.rows[0].status
    return res.status(200).json(status === 'valid' ? { valid: true } : { valid: false, reason: status })
  } catch (error) {
    console.error('verify-reset-token failed', error.message)
    return res.status(503).json({ valid: false, reason: 'unavailable' })
  }
}
