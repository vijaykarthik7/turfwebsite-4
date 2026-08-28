import pg from 'pg'

const { Pool } = pg

let pool

export function getPool() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured')
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5, ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined })
  return pool
}

export function classifyDbError(error) {
  const msg = String(error?.message || error || '')
  if (msg === 'DATABASE_URL is not configured') return 'DB_CONFIG_MISSING'
  if (/ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ECONNRESET|ETIMEDOUT|getaddrinfo|connection (timed out|terminated)|timeout/i.test(msg)) return 'DB_UNREACHABLE'
  if (/SSL|sslmode|certificate|self-signed|rejectUnauthorized/i.test(msg)) return 'DB_SSL_ERROR'
  if (/does not exist|relation .* not exist|undefined_table|42P01/i.test(msg)) return 'DB_MISSING_TABLE'
  if (/password authentication failed|28P01|role .* does not exist|permission denied/i.test(msg)) return 'DB_AUTH_ERROR'
  if (/database .* does not exist|3D000/i.test(msg)) return 'DB_MISSING_DATABASE'
  return 'DB_OTHER'
}

export function getRequestIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown'
}
