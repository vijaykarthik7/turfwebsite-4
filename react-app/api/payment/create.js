import crypto from 'node:crypto'
import { getPool } from '../_lib/db.js'

const DEFAULT_RATE = 800
const PAYMENT_TTL_MINUTES = 15

function money(value) {
  return Math.round(value * 100) / 100
}

function getPricing() {
  const rate = Number(process.env.HOURLY_RATE || DEFAULT_RATE)
  if (!Number.isFinite(rate) || rate <= 0) throw new Error('HOURLY_RATE is invalid')
  return rate
}

function createReference() {
  return `T24-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' })

  const type = req.body?.type === 'extended' ? 'extended' : 'hourly'
  const hours = Number(req.body?.hours)
  const days = Number(req.body?.days)
  const rate = getPricing()
  const billableUnits = type === 'extended' ? days * 8 : hours

  if (!Number.isInteger(billableUnits) || billableUnits < 1 || billableUnits > 96) {
    return res.status(400).json({ message: 'Invalid booking duration.' })
  }

  const amount = money(rate * billableUnits)
  const reference = createReference()
  const upiId = process.env.PAYMENT_UPI_ID || 'turfon24@okaxis'
  const merchantName = process.env.PAYMENT_UPI_NAME || 'Turfon24'
  const params = new URLSearchParams({ pa: upiId, pn: merchantName, am: amount.toFixed(2), cu: 'INR', tr: reference })
  const expiresAt = new Date(Date.now() + PAYMENT_TTL_MINUTES * 60 * 1000).toISOString()

  try {
    if (process.env.DATABASE_URL) {
      await getPool().query(
        `INSERT INTO payment_sessions (reference, booking_type, amount, currency, upi_id, status, expires_at, booking_data)
         VALUES ($1, $2, $3, 'INR', $4, 'PAYMENT_PENDING', $5, $6)`,
        [reference, type, amount, upiId, expiresAt, JSON.stringify(req.body || {})],
      )
    }
  } catch (error) {
    console.error('payment session persistence failed', error.message)
    return res.status(503).json({ message: 'Payment setup is temporarily unavailable.' })
  }

  return res.status(201).json({
    reference,
    amount,
    currency: 'INR',
    upiId,
    merchantName,
    upiUri: `upi://pay?${params.toString()}`,
    status: 'PAYMENT_PENDING',
    expiresAt,
  })
}
