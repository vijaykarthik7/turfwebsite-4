import crypto from 'node:crypto'
import { getPool } from '../_lib/db.js'

function sessionToken(req) { return req.headers.cookie?.match(/(?:^|; )turfon24_admin_session=([^;]+)/)?.[1] }

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' })
  const raw = sessionToken(req)
  if (!raw) return res.status(401).json({ authenticated: false })
  const hash = crypto.createHash('sha256').update(raw).digest('hex')
  try {
    const result = await getPool().query('SELECT 1 FROM admin_sessions s JOIN admin_users a ON a.id = s.admin_id WHERE s.session_token_hash = $1 AND a.active = TRUE LIMIT 1', [hash])
    return res.status(result.rowCount ? 200 : 401).json({ authenticated: Boolean(result.rowCount) })
  } catch (error) {
    console.error('admin session check failed', error.message)
    return res.status(503).json({ message: 'Session check is temporarily unavailable.' })
  }
}
