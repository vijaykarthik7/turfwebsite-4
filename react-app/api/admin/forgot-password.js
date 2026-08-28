import { getPool, getRequestIp, classifyDbError } from '../_lib/db.js'
import { getMailer, resetUrl, classifyMailError } from '../_lib/mail.js'
import { GENERIC_RESET_MESSAGE, tokenPair, validEmail } from '../_lib/security.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })
  const email = String(req.body?.email || '').trim().toLowerCase()
  if (!validEmail(email)) return res.status(400).json({ message: 'Enter a valid email address.' })
  try {
    const pool = getPool()
    const ip = getRequestIp(req)
    const recent = await pool.query(`SELECT COUNT(*)::int AS count FROM password_reset_tokens WHERE created_at > NOW() - INTERVAL '15 minutes' AND (request_ip = $1 OR admin_id = (SELECT id FROM admin_users WHERE lower(email) = $2))`, [ip, email])
    if (recent.rows[0].count >= 5) return res.status(200).json({ message: GENERIC_RESET_MESSAGE })
    const admin = await pool.query('SELECT id, email FROM admin_users WHERE lower(email) = $1 AND active = TRUE LIMIT 1', [email])
    if (admin.rowCount) {
      const { rawToken, tokenHash } = tokenPair()
      await pool.query('UPDATE password_reset_tokens SET used_at = NOW() WHERE admin_id = $1 AND used_at IS NULL', [admin.rows[0].id])
      await pool.query(`INSERT INTO password_reset_tokens (admin_id, token_hash, expires_at, request_ip, user_agent) VALUES ($1, $2, NOW() + INTERVAL '30 minutes', $3, $4)`, [admin.rows[0].id, tokenHash, ip, req.headers['user-agent'] || null])
      const url = resetUrl(rawToken)
      await getMailer().sendMail({ from: process.env.MAIL_FROM, to: admin.rows[0].email, subject: 'Turfon24 Admin Password Reset', text: `We received a request to reset your Turfon24 admin password.\n\nReset your password here: ${url}\n\nThis link expires in 30 minutes and can only be used once. If you did not request this, ignore this email.`, html: `<p>We received a request to reset your Turfon24 admin password.</p><p><a href="${url}">Reset admin password</a></p><p>This link expires in 30 minutes and can only be used once.</p><p>If you did not request this, you can safely ignore this email.</p><p>Turfon24</p>` })
    }
    return res.status(200).json({ message: GENERIC_RESET_MESSAGE })
  } catch (error) {
    console.error('forgot-password failed', classifyDbError(error), classifyMailError(error), error.message)
    return res.status(503).json({ message: 'Unable to send the reset email right now. Please try again later.' })
  }
}
