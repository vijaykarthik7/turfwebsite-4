import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), {
    name: 'local-admin-api',
    configureServer(server) {
      server.middlewares.use('/api/admin/login', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; return res.end() }
        let body = ''
        for await (const chunk of req) body += chunk
        const { email, password } = JSON.parse(body || '{}')
        const valid = String(email || '').trim().toLowerCase() === 'ask@turfon24.com' && await bcrypt.compare(String(password || ''), '$2b$12$Cmv2/PFKIXxvn1ZlgkkiL.CNWGFGed2qFbvceK.5nrhSkD0skZ7FC')
        if (!valid) { res.statusCode = 401; res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify({ message: 'Incorrect email or password.' })) }
        const session = crypto.randomBytes(32).toString('hex')
        res.setHeader('Set-Cookie', `turfon24_admin_session=${session}; Path=/; HttpOnly; SameSite=Lax`)
        res.statusCode = 200; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ ok: true }))
      })
    },
  }],
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        admin: 'admin.html',
      },
    },
  },
})
