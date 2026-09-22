# DYC QUIZ SOFTWARE

Next.js quiz and training application.

## Deploy to Vercel from GitHub

1. Open [Vercel](https://vercel.com/new) and sign in with GitHub.
2. Select **Import Git Repository** and choose `DIVYANSH092003/DYC-QUIZ-SOFTWARE`.
3. Keep the project root as `/`.
4. Vercel will detect Next.js. The repository is configured to use pnpm with:
   - Install command: `pnpm install --frozen-lockfile`
   - Build command: `pnpm build`
5. Add the environment variables below in **Project Settings → Environment Variables**. Add them for **Production**, **Preview**, and **Development** as appropriate.
6. Click **Deploy**. Every push to `main` will create a new deployment.

### Required production environment variables

```env
PASSWORD_RESET_SECRET=<long-random-secret-at-least-32-characters>
ADMIN_EMAIL=itsupport@dycgpl.com
APP_URL=https://<your-vercel-domain>
RESEND_API_KEY=<your-resend-api-key>
RESEND_FROM_EMAIL=DYC Global <no-reply@your-verified-domain.com>
```

`RESEND_API_KEY` and `RESEND_FROM_EMAIL` are required only when the admin password-recovery email feature is used. The sender domain must be verified in Resend. `APP_URL` should be the final Vercel URL, including a custom domain if one is configured.

### Important data note

The application currently stores Inspector attempts in `data/inspector-attempts.json`. Vercel serverless functions use ephemeral filesystems, so file changes are not a durable production database and can disappear between invocations or deployments. For persistent multi-user production data, migrate this ledger to a hosted database such as Vercel Postgres, Neon, Supabase, or another database service.

Training uploads are stored in each user's browser using IndexedDB and are not uploaded to Vercel.

## Local development

```bash
pnpm install
pnpm dev
```

Open <http://localhost:3000>.
