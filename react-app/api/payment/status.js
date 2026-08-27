import { getPool } from '../_lib/db.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  const reference = String(req.query?.reference || '').trim()
  if (!reference) return res.status(400).json({ message: 'Payment reference is required.' })

  if (!process.env.DATABASE_URL) {
    return res.status(200).json({ reference, status: 'PAYMENT_PENDING', message: 'Payment provider verification is not configured.' })
  }

  try {
    const result = await getPool().query(
      'SELECT reference, amount, currency, status, expires_at AS "expiresAt" FROM payment_sessions WHERE reference = $1 LIMIT 1',
      [reference],
    )
    if (!result.rowCount) return res.status(404).json({ message: 'Payment session not found.' })
    const session = result.rows[0]
    if (session.status === 'PAYMENT_PENDING' && new Date(session.expiresAt) <= new Date()) {
      await getPool().query('UPDATE payment_sessions SET status = \'EXPIRED\' WHERE reference = $1 AND status = \'PAYMENT_PENDING\'', [reference])
      session.status = 'EXPIRED'
    }
    return res.status(200).json(session)
  } catch (error) {
    console.error('payment status lookup failed', error.message)
    return res.status(503).json({ message: 'Payment status is temporarily unavailable.' })
  }
}
