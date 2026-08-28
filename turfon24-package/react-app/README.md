# React + Vite

## Secure Admin Password Reset

The reset flow uses the Vercel serverless functions in `api/admin`, Postgres, bcrypt, and SMTP. Apply `db/migrations/001_admin_password_reset.sql` before using it; the migration seeds the existing admin email with its bcrypt password hash.

Configure these server-only Vercel environment variables:

`DATABASE_URL`, `APP_URL`, `MAIL_FROM`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, and optionally `SMTP_SECURE=true`.

Never expose SMTP or database credentials through Vite variables or frontend code. The email provider must be configured before the request endpoint can successfully deliver a reset email.

### Deployment checklist (Vercel)

1. **Project root = the `react-app` folder.** The serverless functions under `api/` must be at the Vercel project root, otherwise `/api/admin/login` returns 404 and the login form shows "Incorrect email or password."
2. **Build framework = Vite** (build command `npm run build`, output `dist`).
3. **Set the server-only env vars** listed above in the Vercel project (Production). `APP_URL` must be the deployed HTTPS origin, e.g. `https://turfon24.vercel.app` — never `localhost`.
4. **Apply the migrations once against the production database** (`db/migrations/001_admin_password_reset.sql`, then `002_payment_sessions.sql`). The admin sign-in that works locally is `ask@turfon24.com` with the password seeded by migration 001 (the same account the Vite dev server intercepts for local testing). If the production database already has the `admin_users` table but no row for that address, seed it with the same `INSERT ... ON CONFLICT (email) DO NOTHING` statement from migration 001.
5. Local development is a mocked login (`vite.config.js` intercepts `/api/admin/login`). It intentionally never touches the real database or SMTP, which is why login "works" locally even when the production environment is unconfigured.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
