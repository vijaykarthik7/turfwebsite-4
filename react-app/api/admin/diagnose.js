import { getPool } from '../_lib/db.js'
import { getMailer } from '../_lib/mail.js'

function presence(...names) {
  const out = {}
  for (const name of names) out[name] = Boolean(process.env[name])
  return out
}

export default async function handler(_req, res) {
  const env = presence('DATABASE_URL', 'APP_URL', 'MAIL_FROM', 'SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'SMTP_SECURE', 'RESET_DEST_EMAIL')

  const database = { configured: env.DATABASE_URL, reachable: false, tables: {}, error: null }
  if (env.DATABASE_URL) {
    try {
      const pool = getPool()
      await pool.query('SELECT 1')
      database.reachable = true
      const tables = await pool.query(`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('admin_users', 'admin_sessions', 'password_reset_tokens')`)
      for (const row of tables.rows) database.tables[row.table_name] = true
    } catch (error) {
      database.error = String(error?.message || error).slice(0, 300)
    }
  }

  const mailer = {
    configured: Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASSWORD && env.MAIL_FROM),
    port: process.env.SMTP_PORT || null,
    secure: process.env.SMTP_SECURE === 'true',
    destEmail: process.env.RESET_DEST_EMAIL || null,
    verified: false,
    error: null
  }
  if (mailer.configured) {
    try {
      await getMailer().verify()
      mailer.verified = true
    } catch (error) {
      mailer.error = String(error?.message || error).slice(0, 300)
    }
  }

  const appUrl = { configured: env.APP_URL, valid: false, reason: null }
  if (env.APP_URL) {
    try {
      const u = new URL(process.env.APP_URL)
      appUrl.valid = u.protocol === 'https:' || u.protocol === 'http:'
      if (!appUrl.valid) appUrl.reason = 'protocol must be http(s)'
    } catch {
      appUrl.reason = 'not a valid URL'
    }
  }

  const missing = Object.entries(env).filter(([, v]) => !v).map(([k]) => k)
  const ready = Boolean(
    env.DATABASE_URL && database.reachable && database.tables.admin_users && database.tables.password_reset_tokens &&
    mailer.configured && mailer.verified && appUrl.valid
  )

  return res.status(200).json({ env, database, mailer, appUrl, missing, ready })
}
