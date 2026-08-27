import bcrypt from 'bcryptjs'
import { getPool } from '../_lib/db.js'
import { hashToken, PASSWORD_MIN_LENGTH } from '../_lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const token = String(req.body?.token || '')
  const newPassword = String(req.body?.newPassword || '')
  if (!/^[a-f0-9]{64}$/.test(token)) return res.status(400).json({ message: 'Invalid password reset link.' })
  if (newPassword.length < PASSWORD_MIN_LENGTH) return res.status(400).json({ message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters.` })
  const client = await getPool().connect()
  try {
    await client.query('BEGIN')
    const tokenResult = await client.query(`SELECT id, admin_id, used_at, expires_at FROM password_reset_tokens WHERE token_hash = $1 FOR UPDATE`, [hashToken(token)])
    if (!tokenResult.rowCount) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'Invalid password reset link.' }) }
    const reset = tokenResult.rows[0]
    if (reset.used_at) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'This password reset link has already been used.' }) }
    if (new Date(reset.expires_at) <= new Date()) { await client.query('ROLLBACK'); return res.status(400).json({ message: 'This password reset link has expired. Please request a new reset link.' }) }
    const passwordHash = await bcrypt.hash(newPassword, 12)
    await client.query('UPDATE admin_users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND active = TRUE', [passwordHash, reset.admin_id])
    await client.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1', [reset.id])
    await client.query('DELETE FROM admin_sessions WHERE admin_id = $1', [reset.admin_id])
    await client.query('COMMIT')
    return res.status(200).json({ message: 'Password updated successfully.' })
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {})
    console.error('reset-password failed', error.message)
    return res.status(503).json({ message: 'Unable to update the password right now. Please try again later.' })
  } finally { client.release() }
}
