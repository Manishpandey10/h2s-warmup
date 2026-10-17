# RozMitra: manual setup

Code is provided; installation, builds, SQL execution, accounts and deployment are manual.
No live database connection, AI request, build or browser test has been run by the coding agent.

## 1. Supabase

In SQL Editor, run these files IN ORDER, once each:

1. `supabase/migrations/001_earnings.sql`
2. `supabase/migrations/002_guidance_complaints.sql`
3. `supabase/migrations/003_official_references.sql`
4. `supabase/migrations/004_eshram_practical_guidance.sql`

Each file uses a transaction. If a file fails, fix that file's error before proceeding.
Do not rerun a successful migration: tables/functions intentionally are not silently overwritten.
The third file contains actual reviewed government reference notes, not dummy worker data.

In Authentication → Providers → Email, keep Email/password enabled and turn **Confirm Email off** for the agreed immediate-sign-in flow. Set your Site URL to your frontend URL. Save and refresh the dashboard to verify the setting persisted. With confirmation off, Supabase treats new email addresses as confirmed without proving ownership; the app does not claim that an email was verified or gate AI on email verification. No SMTP configuration is needed for signup in this flow.
If Confirm Email is enabled, set **Authentication → URL Configuration → Site URL** to `https://h2s-warmup.vercel.app` and add `https://h2s-warmup.vercel.app/login` to Redirect URLs. Set `NEXT_PUBLIC_SITE_URL=https://h2s-warmup.vercel.app` on the frontend and redeploy. The signup request explicitly uses that URL, and the default Supabase confirmation template should link with `{{ .ConfirmationURL }}`. If a customized template hardcodes the old deployment URL or uses `{{ .SiteURL }}` directly, update that template too. Already-sent emails retain their old links; test with a fresh signup email.
For evaluator access, use Authentication → Users → Add user to create worker and admin test accounts with passwords of at least 8 characters.

## 2. Environment

Copy `.env.example` to `.env.local` and fill in your real values. Never commit `.env.local`.
Use the Supabase **project URL and publishable key**, not a PostgreSQL connection string.
No database password or service-role key is used by this app.

Required for login and earnings:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
NEXT_PUBLIC_SITE_URL=https://h2s-warmup.vercel.app
```

Required on the backend for AI help and complaint drafting:

```env
GEMINI_API_KEY=YOUR_NEW_PRIVATE_KEY
GEMINI_MODEL=gemini-3.8-flash
```

Set a model available to your actual account. A model listed in documentation does not guarantee your key has access or quota.
The server uses a real Gemini generateContent request. Missing keys, quota errors, blocked/incomplete results and malformed responses produce errors, never canned answers.
The prompt asks for short English, Hindi, or Punjabi answers; the model may still make factual mistakes. Check citations and complaint facts before submitting.

## 3. Install and run locally

Use Node.js 22 or later. Open PowerShell in this project directory:

```powershell
npm install
npm run typecheck
npm test
npm run dev
```

Run the commands one at a time. Open http://localhost:3000.
If an earlier install was done before the backend files were added, run `npm install` again to add `tsx` and update the lockfile.
Commit the resulting `package-lock.json` for reproducible deployments.
Use `npm run build` for your production check, then `npm start` to run that build.

## 4. Admin login and test credentials label

Worker route: `/login`. Admin route: `/admin/login`. Editor route: `/admin`.
Admin privileges are verified on the server AND enforced through database policies; visiting an admin URL is not authorization.

Create the real confirmed admin test user in Supabase Authentication first.
Then grant ONLY the restricted source-editor role using SQL Editor (replace the email):

```sql
insert into public.source_editors (user_id)
select id from auth.users where email = 'YOUR_REAL_TEST_ADMIN_EMAIL'
on conflict do nothing;
```

To display that account's actual credentials on `/admin/login`, put these values in the FRONTEND server environment:

```env
ADMIN_TEST_EMAIL=YOUR_REAL_TEST_ADMIN_EMAIL
ADMIN_TEST_PASSWORD=YOUR_REAL_TEST_ADMIN_PASSWORD
```

These two values are deliberately public in the rendered login page. Use a dedicated test account and a unique password, never your Supabase dashboard account or a password reused elsewhere.
The test account can add/edit its own drafts, not publish sources or access other workers' private records.
It has no dashboard/database administrator powers. Role assignment is manual; public sign-up never grants it.

The owner publishes a reviewed draft in Supabase Table Editor by changing its `status` to `published`.
To revise published content, the editor creates a new draft; it cannot mutate approved guidance.
After approval, archive/remove the old published version manually if it has been superseded. Check the URL and factual notes yourself before approval.

## 5. Deploy quickly

For the fewest steps, deploy ONE Render **Web Service** (not a Static Site) containing the entire app:

| Setting        | Value                                                                                                 |
| -------------- | ----------------------------------------------------------------------------------------------------- |
| Repository     | This app's GitHub repository                                                                          |
| Root directory | Empty if this folder is the repository root; otherwise this folder's repository-relative path         |
| Build command  | `npm install && npm run build` initially; use `npm ci && npm run build` after committing the lockfile |
| Start command  | `npm start`                                                                                           |
| Node version   | 22 or later                                                                                           |

Set the Supabase and Gemini variables in Render Environment. Optional admin test label variables go here too.
Leave `NEXT_PUBLIC_API_BASE_URL` empty: frontend and backend are on the same service.
Render supplies PORT. The start command listens on 0.0.0.0.

If you want a separate backend, the `server/` folder contains its actual entry point. Both deployments need the entire repository:

1. Backend Render Web Service: build `npm install`, start `npm run backend`, health path `/health`.
2. Backend environment: Supabase variables + Gemini variables + `FRONTEND_ORIGIN=https://YOUR_STABLE_VERCEL_DOMAIN`.
3. Frontend Vercel or Render: set the Supabase variables and `NEXT_PUBLIC_API_BASE_URL=https://YOUR_BACKEND_ORIGIN` BEFORE building. The Gemini key only needs to be on the backend.
4. For Render frontend use build `npm install && npm run build` and start `npm start`.
5. Open the stable Vercel domain listed under **Domains**, not a deployment-specific preview URL. Set `FRONTEND_ORIGIN` to that exact origin, without a trailing slash or `/path`. Redeploy Render after changing it.

Public `NEXT_PUBLIC_` variables are embedded during frontend build; changing them requires rebuilding the frontend.
Neither setup needs a direct PostgreSQL connection string.

## 6. Hands-on submission checks

- New worker account can sign in immediately after signup and starts empty.
- Save your own earnings; refresh; edit; delete with confirmation. Confirm totals across pagination and month changes.
- Check expenses greater than received, pending-only entries, decimal amounts, invalid dates, and more than 24 hours.
- Use a second user in a different browser profile: they must not see or change the first user's entries or complaints, even via a copied API record ID.
- English is default. The English/Hindi/Punjabi selector changes labels/errors and persists after refresh. New AI answers use the chosen language; existing generated text stays in its original language, without silently changing stored data.
- Ask an e-Shram document question; follow the returned official citation. Ask an unsupported question: the answer must acknowledge source limits.
- Generate a complaint with fresh facts. Edit it, save, refresh, download the saved text.
- Temporarily remove the Gemini key and restart the backend: see an honest error, with no synthetic result. Restore it afterwards.
- A normal user cannot access admin source APIs. A source editor can create/revise drafts but cannot publish or see other people's private data.
- Check keyboard navigation, focus indicators, labels, Hindi readability and narrow mobile screens.
- Test the DEPLOYED URLs, not just localhost. Give evaluators real dedicated test logins.

AI requests are limited to ten per signed-in account per UTC hour using an atomic database function. Failed provider requests count toward that cap. Configure provider budget limits and Supabase auth abuse protection for a broader public launch.

## Submission checklist

- [ ] Public GitHub repo, without .env files or private worker data.
- [ ] Deployed app URL tested with fresh inputs.
- [ ] Brief description: India-focused gig worker companion for earnings, official support and complaint drafting.
- [ ] State the real AI service/model used and its use in help and complaint drafting.
- [ ] Demo video URL.
- [ ] Real evaluator credentials and admin test label configured.
- [ ] Meaningful tests and manual access/isolation checks completed.

## Official implementation references

- https://nextjs.org/docs/app/getting-started/installation
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://ai.google.dev/api/generate-content
- https://render.com/docs/deploy-nextjs-app

Reference-note sources are recorded directly in `003_official_references.sql` with their review date.
