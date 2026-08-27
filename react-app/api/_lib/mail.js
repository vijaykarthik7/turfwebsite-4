import nodemailer from 'nodemailer'

export function getMailer() {
  const required = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASSWORD', 'MAIL_FROM']
  for (const name of required) if (!process.env[name]) throw new Error(`${name} is not configured`)
  return nodemailer.createTransport({ host: process.env.SMTP_HOST, port: Number(process.env.SMTP_PORT), secure: process.env.SMTP_SECURE === 'true', auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } })
}

export function resetUrl(token) {
  const baseUrl = process.env.APP_URL
  if (!baseUrl) throw new Error('APP_URL is not configured')
  return `${baseUrl.replace(/\/$/, '')}/admin/reset-password?token=${encodeURIComponent(token)}`
}
