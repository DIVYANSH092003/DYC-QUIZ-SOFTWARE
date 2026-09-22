# DYC QUIZ SOFTWARE

<<<<<<< Updated upstream
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
=======
This project is a Next.js app prepared for deployment on Vercel.

## Deployment checklist

1. Push this repository to GitHub.
2. Import it in Vercel using the GitHub repository.
3. Keep the framework detected as Next.js.
4. Use the project root as the app root.
5. Add the required environment variables in Vercel Project Settings > Environment Variables.
6. Deploy.

## Required environment variables

Create a `.env.local` file for local development, and add equivalent variables in Vercel:

```bash
APP_URL=http://localhost:3000
ADMIN_EMAIL=admin@dycglobal.com
PASSWORD_RESET_SECRET=replace-with-a-long-random-secret
RESEND_API_KEY=
RESEND_FROM_EMAIL=
```

Notes:
- `PASSWORD_RESET_SECRET` is required for password reset tokens in production.
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are optional if email recovery is not configured.
- If email delivery is not configured, the app still runs locally with a development fallback.

## Vercel-ready notes

- The app uses the standard Next.js build pipeline.
- Public hosting is supported for the quiz platform and admin routes.
- If you want to expose the app publicly, keep secrets in Vercel environment variables instead of committing them to Git.

>>>>>>> Stashed changes
